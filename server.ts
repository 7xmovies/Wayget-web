import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { FamPayVerifier } from 'fampay-verify';
import imapSimple from 'imap-simple';
import { createAdminClient } from '@insforge/sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize InsForge Admin Client for database operations
const INSFORGE_BASE_URL = process.env.INSFORGE_URL || 'https://pfirjd69.us-east.insforge.app';
const INSFORGE_API_KEY = process.env.INSFORGE_API_KEY || 'ik_8a798ab90bd2bcbb33e387eec90e1bda';

const insforgeAdmin = createAdminClient({
  baseUrl: INSFORGE_BASE_URL,
  apiKey: INSFORGE_API_KEY,
});

export interface MerchantRecord {
  id: string;
  user_id: string;
  merchant_upi_id: string;
  merchant_name: string;
  gmail: string;
  gmail_app_password?: string;
  api_key: string;
  mode: 'live' | 'simulation';
  enable_dynamic_amount: boolean;
  webhook_url?: string;
  session_timeout_minutes: number;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  order_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  note: string;
  base_amount: number;
  payable_amount: number;
  dynamic_offset: number;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  upi_uri: string;
  qr_code_url: string;
  created_at: string;
  expires_at: string;
  verified_at?: string;
  utr?: string;
  transaction_id?: string;
  sender_name?: string;
  verification_source?: string;
  webhook_delivered?: boolean;
}

// Decimal counter for dynamic amount allocation
let currentDecimalCounter = 1;

// Helper: Verify User Access Token from InsForge Auth
async function verifyUserToken(token: string) {
  if (!token) return null;
  try {
    const res = await fetch(`${INSFORGE_BASE_URL}/api/auth/sessions/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.warn('Error verifying token with InsForge:', err);
    return null;
  }
}

// Helper: Get or Create Merchant record for a user
async function getOrCreateMerchant(userId: string, defaultName: string = 'Merchant Store'): Promise<MerchantRecord> {
  const { data: existing, error } = await insforgeAdmin.database
    .from('merchants')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0] as MerchantRecord;
  }

  // Create new merchant profile
  const newApiKey = 'fp_live_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const newMerchant = {
    user_id: userId,
    merchant_upi_id: 'merchant@fam',
    merchant_name: defaultName,
    gmail: '',
    gmail_app_password: '',
    api_key: newApiKey,
    mode: 'simulation',
    enable_dynamic_amount: true,
    webhook_url: '',
    session_timeout_minutes: 15,
  };

  const { data: created, error: insertError } = await insforgeAdmin.database
    .from('merchants')
    .insert([newMerchant])
    .select();

  if (insertError || !created || created.length === 0) {
    throw new Error(insertError?.message || 'Failed to initialize merchant profile');
  }

  return created[0] as MerchantRecord;
}

// Helper: Resolve Merchant from API Key in request headers/body/query
async function resolveMerchantFromApiKey(req: express.Request): Promise<MerchantRecord | null> {
  const apiKey = (
    req.headers['x-api-key'] ||
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query.api_key ||
    req.body.apiKey
  ) as string;

  if (apiKey) {
    const { data } = await insforgeAdmin.database
      .from('merchants')
      .select('*')
      .eq('api_key', apiKey.trim())
      .limit(1);

    if (data && data.length > 0) {
      return data[0] as MerchantRecord;
    }
  }

  // If no API key provided, check if user session token is present
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);
    if (user?.id) {
      return await getOrCreateMerchant(user.id, user.name || user.email?.split('@')[0] || 'Store');
    }
  }

  // Fallback to first available merchant in system
  const { data: first } = await insforgeAdmin.database
    .from('merchants')
    .select('*')
    .limit(1);

  if (first && first.length > 0) {
    return first[0] as MerchantRecord;
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable CORS for external websites, mobile apps, and microservices
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-user-id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // 1. SaaS User Merchant Profile Routes
  // ==========================================

  // Get current logged-in user's merchant profile
  app.get('/api/user/merchant', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    try {
      const merchant = await getOrCreateMerchant(user.id, user.name || user.email?.split('@')[0] || 'My Store');

      // Count active pending checkouts
      const { data: pendingRows } = await insforgeAdmin.database
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'PENDING');

      res.json({
        success: true,
        merchant: {
          id: merchant.id,
          userId: merchant.user_id,
          merchantUpiId: merchant.merchant_upi_id,
          merchantName: merchant.merchant_name,
          gmail: merchant.gmail,
          hasGmailPassword: Boolean(merchant.gmail_app_password),
          apiKey: merchant.api_key,
          mode: merchant.mode,
          enableDynamicAmount: merchant.enable_dynamic_amount,
          webhookUrl: merchant.webhook_url,
          sessionTimeoutMinutes: merchant.session_timeout_minutes,
          activeSessionsCount: pendingRows?.length || 0,
          isAdmin: Boolean(merchant.is_admin || (user as any).is_project_admin || (user.metadata as any)?.role === 'admin'),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update current logged-in user's merchant profile
  app.post('/api/user/merchant', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const {
      merchantUpiId,
      merchantName,
      gmail,
      gmailAppPassword,
      mode,
      enableDynamicAmount,
      webhookUrl,
      sessionTimeoutMinutes,
    } = req.body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (merchantUpiId !== undefined) updates.merchant_upi_id = merchantUpiId.trim();
    if (merchantName !== undefined) updates.merchant_name = merchantName.trim();
    if (gmail !== undefined) updates.gmail = gmail.trim();
    if (gmailAppPassword !== undefined && gmailAppPassword.trim()) {
      updates.gmail_app_password = gmailAppPassword.replace(/\s/g, '');
    }
    if (mode === 'live' || mode === 'simulation') updates.mode = mode;
    if (typeof enableDynamicAmount === 'boolean') updates.enable_dynamic_amount = enableDynamicAmount;
    if (webhookUrl !== undefined) updates.webhook_url = webhookUrl.trim();
    if (sessionTimeoutMinutes) updates.session_timeout_minutes = Math.min(60, Math.max(3, Number(sessionTimeoutMinutes)));

    try {
      const { data, error } = await insforgeAdmin.database
        .from('merchants')
        .update(updates)
        .eq('user_id', user.id)
        .select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const updated = data?.[0] as MerchantRecord;
      res.json({
        success: true,
        message: 'Merchant settings saved successfully.',
        merchant: {
          id: updated.id,
          userId: updated.user_id,
          merchantUpiId: updated.merchant_upi_id,
          merchantName: updated.merchant_name,
          gmail: updated.gmail,
          hasGmailPassword: Boolean(updated.gmail_app_password),
          apiKey: updated.api_key,
          mode: updated.mode,
          enableDynamicAmount: updated.enable_dynamic_amount,
          webhookUrl: updated.webhook_url,
          sessionTimeoutMinutes: updated.session_timeout_minutes,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Regenerate user's API Key
  app.post('/api/user/regenerate-api-key', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    }

    const newApiKey = 'fp_live_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    try {
      const { error } = await insforgeAdmin.database
        .from('merchants')
        .update({ api_key: newApiKey, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({
        success: true,
        apiKey: newApiKey,
        message: 'New API Key generated successfully.',
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get User's Payments & Transactions Ledger from InsForge Database
  app.get('/api/user/payments', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    let query = insforgeAdmin.database
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // If user is authenticated, scope to their user_id
    if (user?.id) {
      query = query.eq('user_id', user.id);
    }

    const { data: rows, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const transactions = (rows || []).map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      note: row.note,
      baseAmount: Number(row.base_amount),
      payableAmount: Number(row.payable_amount),
      dynamicOffset: Number(row.dynamic_offset),
      status: row.status,
      upiUri: row.upi_uri,
      qrCodeUrl: row.qr_code_url,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
      verifiedAt: row.verified_at ? new Date(row.verified_at).getTime() : undefined,
      utr: row.utr,
      transactionId: row.transaction_id,
      senderName: row.sender_name,
      verificationSource: row.verification_source,
      webhookDelivered: row.webhook_delivered,
    }));

    const stats = {
      totalVolume: transactions
        .filter((t) => t.status === 'VERIFIED')
        .reduce((sum, t) => sum + t.payableAmount, 0),
      verifiedCount: transactions.filter((t) => t.status === 'VERIFIED').length,
      pendingCount: transactions.filter((t) => t.status === 'PENDING' && t.expiresAt > Date.now()).length,
      expiredCount: transactions.filter((t) => t.status === 'EXPIRED' || (t.status === 'PENDING' && t.expiresAt <= Date.now())).length,
      totalCount: transactions.length,
    };

    res.json({
      transactions,
      stats,
    });
  });

  // Public/Guest config compatibility route - Never exposes API key or Admin privileges to public visitors
  app.get('/api/gateway/config', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    if (user) {
      const merchant = await getOrCreateMerchant(user.id, user.name || user.email?.split('@')[0] || 'Store');
      return res.json({
        merchantUpiId: merchant.merchant_upi_id,
        merchantName: merchant.merchant_name,
        gmail: merchant.gmail,
        hasGmailPassword: Boolean(merchant.gmail_app_password),
        mode: merchant.mode,
        enableDynamicAmount: merchant.enable_dynamic_amount,
        webhookUrl: merchant.webhook_url,
        sessionTimeoutMinutes: merchant.session_timeout_minutes,
        apiKey: merchant.api_key,
        activeSessionsCount: 0,
        isAdmin: Boolean(merchant.is_admin || (user as any).is_project_admin || (user.metadata as any)?.role === 'admin'),
      });
    }

    // Unauthenticated public request: no API key exposed, strictly non-admin
    res.json({
      merchantUpiId: 'demo@fam',
      merchantName: 'FamPay Public Gateway',
      gmail: '',
      hasGmailPassword: false,
      mode: 'live',
      enableDynamicAmount: true,
      webhookUrl: '',
      sessionTimeoutMinutes: 15,
      apiKey: '',
      activeSessionsCount: 0,
      isAdmin: false,
    });
  });

  // Admin Overview: View all registered merchants, platform volumes, and global transactions
  app.get('/api/admin/overview', async (req, res) => {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    const user = await verifyUserToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in as admin.' });
    }

    const { data: userMerchant } = await insforgeAdmin.database
      .from('merchants')
      .select('is_admin')
      .eq('user_id', user.id)
      .limit(1);

    const isAdmin = Boolean((user as any).is_project_admin || userMerchant?.[0]?.is_admin || (user.metadata as any)?.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // Fetch all merchants
    const { data: merchants } = await insforgeAdmin.database
      .from('merchants')
      .select('id, user_id, merchant_upi_id, merchant_name, gmail, api_key, mode, is_admin, created_at')
      .order('created_at', { ascending: false });

    // Fetch recent global payments
    const { data: payments } = await insforgeAdmin.database
      .from('payments')
      .select('id, user_id, order_id, customer_name, base_amount, payable_amount, status, utr, verification_source, created_at, verified_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const totalVolume = payments
      ?.filter((p: any) => p.status === 'VERIFIED')
      .reduce((sum: number, p: any) => sum + Number(p.payable_amount || 0), 0) || 0;

    const verifiedCount = payments?.filter((p: any) => p.status === 'VERIFIED').length || 0;
    const pendingCount = payments?.filter((p: any) => p.status === 'PENDING').length || 0;
    const expiredCount = payments?.filter((p: any) => p.status === 'EXPIRED').length || 0;

    res.json({
      success: true,
      stats: {
        totalMerchants: merchants?.length || 0,
        totalPayments: payments?.length || 0,
        totalVolume,
        verifiedCount,
        pendingCount,
        expiredCount,
      },
      merchants: merchants || [],
      recentPayments: payments || [],
    });
  });

  // ==========================================
  // 2. Test Gmail IMAP Connection
  // ==========================================
  app.post('/api/gateway/test-connection', async (req, res) => {
    let gmail = req.body.gmail;
    let gmailAppPassword = (req.body.gmailAppPassword || '').replace(/\s/g, '');

    // If not supplied directly, load from logged in merchant
    if (!gmail || !gmailAppPassword) {
      const merchant = await resolveMerchantFromApiKey(req);
      if (merchant) {
        gmail = gmail || merchant.gmail;
        gmailAppPassword = gmailAppPassword || merchant.gmail_app_password;
      }
    }

    if (!gmail || !gmailAppPassword) {
      return res.status(400).json({
        success: false,
        message: 'Gmail address and 16-character Google App Password are required.',
      });
    }

    const emailClean = gmail.includes('@') ? gmail : `${gmail}@gmail.com`;

    try {
      const imapConfig = {
        imap: {
          user: emailClean,
          password: gmailAppPassword,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
          authTimeout: 10000,
        },
      };

      const connection = await imapSimple.connect(imapConfig);
      await connection.openBox('INBOX');
      const recentMessages = await connection.search(['ALL'], { bodies: [] });
      connection.end();

      return res.json({
        success: true,
        message: 'Successfully connected to Gmail IMAP!',
        inboxDetails: {
          totalEmails: recentMessages.length,
          checkedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message.includes('AUTHENTICATIONFAILED')
          ? 'Authentication failed: Please ensure 2-Step Verification is enabled and you are using a valid 16-character Google App Password (not your normal Gmail password).'
          : `IMAP Connection Error: ${err.message}`,
        details: err.message,
      });
    }
  });

  // ==========================================
  // 3. Multi-Tenant V1 Payment Gateway API
  // ==========================================

  // Create Payment Session (CORS enabled, accepts API Key from any website/app)
  app.post(['/api/payment/create', '/api/v1/payment/create', '/api/v1/payments/create'], async (req, res) => {
    try {
      const {
        amount,
        customerName = 'Valued Customer',
        customerPhone = '',
        customerEmail = '',
        orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        note = 'Order Payment',
      } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive amount is required.' });
      }

      // Resolve merchant by API key or Bearer token
      const merchant = await resolveMerchantFromApiKey(req);
      if (!merchant) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid or missing API key. Pass via x-api-key header or Authorization: Bearer <key>.',
        });
      }

      const upiId = merchant.merchant_upi_id || 'merchant@fam';
      const merchantName = merchant.merchant_name || 'Store';

      // Dynamic amount calculation: add small decimal offset like 0.01 to 0.99
      let payableAmount = numAmount;
      let dynamicOffset = 0;

      if (merchant.enable_dynamic_amount) {
        dynamicOffset = Number((currentDecimalCounter * 0.01).toFixed(2));
        currentDecimalCounter = (currentDecimalCounter % 99) + 1;
        payableAmount = Number((numAmount + dynamicOffset).toFixed(2));
      }

      const sessionId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      const timeoutMs = (merchant.session_timeout_minutes || 15) * 60 * 1000;
      const createdAt = new Date();
      const expiresAt = new Date(Date.now() + timeoutMs);

      // Construct UPI deep-link
      const cleanNote = note ? `${orderId} - ${note}`.substring(0, 50) : orderId;
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        merchantName
      )}&am=${payableAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

      // Generate base64 QR Code
      const qrCodeUrl = await QRCode.toDataURL(upiUri, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 380,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      // Save payment session in InsForge PostgreSQL Database
      const paymentRow = {
        id: sessionId,
        user_id: merchant.user_id,
        order_id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        note: note,
        base_amount: numAmount,
        payable_amount: payableAmount,
        dynamic_offset: dynamicOffset,
        status: 'PENDING',
        upi_uri: upiUri,
        qr_code_url: qrCodeUrl,
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      const { error: insertErr } = await insforgeAdmin.database
        .from('payments')
        .insert([paymentRow]);

      if (insertErr) {
        console.error('Error inserting payment into InsForge:', insertErr);
      }

      // Return unified response compatible with external apps & frontend
      res.json({
        success: true,
        sessionId,
        orderId,
        baseAmount: numAmount,
        payableAmount,
        dynamicOffset,
        currency: 'INR',
        status: 'PENDING',
        upiUri,
        qrCodeUrl,
        createdAt: createdAt.getTime(),
        expiresAt: expiresAt.getTime(),
        expiresInSeconds: Math.floor(timeoutMs / 1000),
        merchantUpiId: upiId,
        merchantName,
        checkStatusUrl: `/api/v1/payment/status/${sessionId}`,
        verifyUrl: `/api/v1/payment/verify`,
        session: {
          id: sessionId,
          orderId,
          customerName,
          baseAmount: numAmount,
          payableAmount,
          dynamicOffset,
          status: 'PENDING',
          upiUri,
          qrCodeUrl,
          createdAt: createdAt.getTime(),
          expiresAt: expiresAt.getTime(),
          merchantUpiId: upiId,
          merchantName,
        },
      });
    } catch (err: any) {
      console.error('Error creating payment:', err);
      res.status(500).json({ error: 'Failed to create payment session', details: err.message });
    }
  });

  // Verify Payment via fampay-verify (Gmail IMAP) or manual UTR
  app.post(['/api/payment/verify', '/api/v1/payment/verify', '/api/v1/payments/verify'], async (req, res) => {
    try {
      const { utr, txnid } = req.body;
      const targetId = req.body.sessionId || req.body.id || req.body.orderId;

      if (!targetId) {
        return res.status(400).json({ error: 'sessionId or orderId is required' });
      }

      // 1. Fetch payment from InsForge database
      let { data: payments, error } = await insforgeAdmin.database
        .from('payments')
        .select('*')
        .eq('id', targetId)
        .limit(1);

      if (!payments || payments.length === 0) {
        const { data: orderPayments } = await insforgeAdmin.database
          .from('payments')
          .select('*')
          .eq('order_id', targetId)
          .order('created_at', { ascending: false })
          .limit(1);
        payments = orderPayments;
      }

      if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'Payment session not found' });
      }

      const session = payments[0];

      // If already verified, return verified details immediately
      if (session.status === 'VERIFIED') {
        return res.json({
          verified: true,
          status: 'VERIFIED',
          message: 'Payment already verified successfully.',
          transactionId: session.transaction_id,
          utr: session.utr,
          amount: Number(session.payable_amount),
          senderName: session.sender_name,
          verifiedAt: session.verified_at ? new Date(session.verified_at).getTime() : Date.now(),
          transaction: {
            sessionId: session.id,
            orderId: session.order_id,
            amount: Number(session.payable_amount),
            baseAmount: Number(session.base_amount),
            utr: session.utr,
            transactionId: session.transaction_id,
            senderName: session.sender_name,
            verifiedAt: session.verified_at ? new Date(session.verified_at).getTime() : Date.now(),
            source: session.verification_source,
          },
          session,
        });
      }

      // Check if expired
      if (new Date(session.expires_at).getTime() < Date.now()) {
        await insforgeAdmin.database
          .from('payments')
          .update({ status: 'EXPIRED' })
          .eq('id', session.id);

        return res.json({
          verified: false,
          status: 'EXPIRED',
          message: 'Payment session has expired. Please initiate a new payment.',
          session: { ...session, status: 'EXPIRED' },
        });
      }

      // 2. Fetch the merchant who owns this payment
      const { data: merchants } = await insforgeAdmin.database
        .from('merchants')
        .select('*')
        .eq('user_id', session.user_id)
        .limit(1);

      const merchant = merchants?.[0] as MerchantRecord | undefined;

      const cleanUtr = utr ? String(utr).trim() : undefined;
      const cleanTxnId = txnid ? String(txnid).trim() : undefined;

      // Check if merchant has Live Mode with Gmail credentials configured
      const isLiveMode =
        merchant?.mode === 'live' &&
        Boolean(merchant?.gmail) &&
        Boolean(merchant?.gmail_app_password);

      if (isLiveMode && merchant) {
        // Run fampay-verify with THAT merchant's Gmail credentials
        const verifier = new FamPayVerifier({
          gmail: merchant.gmail,
          gmailAppPassword: merchant.gmail_app_password!,
        });

        const verifyResult = await verifier.verifyPayment({
          amount: Number(session.payable_amount),
          utr: cleanUtr,
          txnid: cleanTxnId,
          userId: session.id,
        });

        if (verifyResult.verified) {
          const verifiedAt = new Date().toISOString();
          const finalUtr = verifyResult.utr || cleanUtr || `UTR${Date.now()}`;
          const finalTxn = verifyResult.transaction_id || cleanTxnId || `FAM${Math.floor(10000000 + Math.random() * 90000000)}`;
          const sender = verifyResult.sender_name || session.customer_name;

          // Update database
          await insforgeAdmin.database
            .from('payments')
            .update({
              status: 'VERIFIED',
              verified_at: verifiedAt,
              utr: finalUtr,
              transaction_id: finalTxn,
              sender_name: sender,
              verification_source: 'fampay-verify-imap',
            })
            .eq('id', session.id);

          // Dispatch merchant webhook if configured
          if (merchant.webhook_url) {
            triggerWebhook(merchant.webhook_url, { ...session, utr: finalUtr, transaction_id: finalTxn, sender_name: sender });
          }

          return res.json({
            verified: true,
            status: 'VERIFIED',
            message: `Verified! Received ₹${session.payable_amount} from ${sender}`,
            transactionId: finalTxn,
            utr: finalUtr,
            amount: Number(session.payable_amount),
            senderName: sender,
            verifiedAt: new Date(verifiedAt).getTime(),
            transaction: {
              sessionId: session.id,
              orderId: session.order_id,
              amount: Number(session.payable_amount),
              baseAmount: Number(session.base_amount),
              utr: finalUtr,
              transactionId: finalTxn,
              senderName: sender,
              verifiedAt: new Date(verifiedAt).getTime(),
              source: 'fampay-verify-imap',
            },
            session,
          });
        } else {
          return res.json({
            verified: false,
            status: 'PENDING',
            message: verifyResult.message || 'Payment not detected in Gmail inbox yet.',
            details: verifyResult.details,
            session,
          });
        }
      } else {
        // Simulation or Manual UTR submission fallback
        if (cleanUtr && cleanUtr.length >= 8) {
          const verifiedAt = new Date().toISOString();
          const finalTxn = `FAM${cleanUtr.slice(-8)}`;
          const sender = session.customer_name || 'Verified UPI User';

          await insforgeAdmin.database
            .from('payments')
            .update({
              status: 'VERIFIED',
              verified_at: verifiedAt,
              utr: cleanUtr,
              transaction_id: finalTxn,
              sender_name: sender,
              verification_source: 'manual-utr',
            })
            .eq('id', session.id);

          if (merchant?.webhook_url) {
            triggerWebhook(merchant.webhook_url, { ...session, utr: cleanUtr, transaction_id: finalTxn, sender_name: sender });
          }

          return res.json({
            verified: true,
            status: 'VERIFIED',
            message: `Payment verified via UTR reference ${cleanUtr}!`,
            transactionId: finalTxn,
            utr: cleanUtr,
            amount: Number(session.payable_amount),
            senderName: sender,
            verifiedAt: new Date(verifiedAt).getTime(),
            transaction: {
              sessionId: session.id,
              orderId: session.order_id,
              amount: Number(session.payable_amount),
              baseAmount: Number(session.base_amount),
              utr: cleanUtr,
              transactionId: finalTxn,
              senderName: sender,
              verifiedAt: new Date(verifiedAt).getTime(),
              source: 'manual-utr',
            },
            session,
          });
        }

        return res.json({
          verified: false,
          status: session.status,
          message: 'Awaiting payment transaction. Use sandbox simulator or enter 12-digit UTR number.',
          session,
        });
      }
    } catch (err: any) {
      console.error('Error during payment verification:', err);
      res.status(500).json({
        verified: false,
        error: 'Verification error',
        message: err.message,
      });
    }
  });

  // Simulate Instant Payment Credit
  app.post(['/api/payment/simulate-credit', '/api/v1/payment/simulate', '/api/v1/payments/simulate'], async (req, res) => {
    const targetId = req.body.sessionId || req.body.id || req.body.orderId;
    const { senderName = 'Aman Gupta', utrNumber } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: 'sessionId or orderId is required' });
    }

    let { data: payments } = await insforgeAdmin.database
      .from('payments')
      .select('*')
      .eq('id', targetId)
      .limit(1);

    if (!payments || payments.length === 0) {
      const { data: orderPayments } = await insforgeAdmin.database
        .from('payments')
        .select('*')
        .eq('order_id', targetId)
        .order('created_at', { ascending: false })
        .limit(1);
      payments = orderPayments;
    }

    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = payments[0];
    if (session.status === 'VERIFIED') {
      return res.json({ success: true, message: 'Already verified', session });
    }

    const generatedUtr = utrNumber || `4129${Math.floor(10000000 + Math.random() * 90000000)}`;
    const verifiedAt = new Date().toISOString();
    const finalTxn = `FAM${generatedUtr.slice(-8)}`;

    await insforgeAdmin.database
      .from('payments')
      .update({
        status: 'VERIFIED',
        verified_at: verifiedAt,
        utr: generatedUtr,
        transaction_id: finalTxn,
        sender_name: senderName,
        verification_source: 'simulation',
      })
      .eq('id', session.id);

    // Fetch merchant for webhook
    const { data: merchants } = await insforgeAdmin.database
      .from('merchants')
      .select('webhook_url')
      .eq('user_id', session.user_id)
      .limit(1);

    if (merchants?.[0]?.webhook_url) {
      triggerWebhook(merchants[0].webhook_url, { ...session, utr: generatedUtr, transaction_id: finalTxn, sender_name: senderName });
    }

    res.json({
      success: true,
      verified: true,
      status: 'VERIFIED',
      message: `Simulated incoming FamPay alert for ₹${session.payable_amount} successfully!`,
      transaction: {
        sessionId: session.id,
        orderId: session.order_id,
        amount: Number(session.payable_amount),
        utr: generatedUtr,
        transactionId: finalTxn,
        senderName: senderName,
        verifiedAt: new Date(verifiedAt).getTime(),
      },
      session: {
        ...session,
        status: 'VERIFIED',
        utr: generatedUtr,
        transaction_id: finalTxn,
        sender_name: senderName,
        verified_at: verifiedAt,
      },
    });
  });

  // Get Payment Session Status
  app.get(['/api/payment/status/:id', '/api/v1/payment/status/:id', '/api/v1/payments/status/:id'], async (req, res) => {
    let { data: payments } = await insforgeAdmin.database
      .from('payments')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);

    if (!payments || payments.length === 0) {
      const { data: orderPayments } = await insforgeAdmin.database
        .from('payments')
        .select('*')
        .eq('order_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(1);
      payments = orderPayments;
    }

    if (!payments || payments.length === 0) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const session = payments[0];
    const isExpired = session.status === 'PENDING' && new Date(session.expires_at).getTime() < Date.now();
    const currentStatus = isExpired ? 'EXPIRED' : session.status;

    if (isExpired && session.status !== 'EXPIRED') {
      await insforgeAdmin.database
        .from('payments')
        .update({ status: 'EXPIRED' })
        .eq('id', session.id);
    }

    res.json({
      success: true,
      sessionId: session.id,
      orderId: session.order_id,
      verified: currentStatus === 'VERIFIED',
      status: currentStatus,
      payableAmount: Number(session.payable_amount),
      baseAmount: Number(session.base_amount),
      utr: session.utr || null,
      senderName: session.sender_name || null,
      verifiedAt: session.verified_at ? new Date(session.verified_at).getTime() : null,
      expiresAt: new Date(session.expires_at).getTime(),
      session,
    });
  });

  // Helper function to trigger webhook
  function triggerWebhook(url: string, payload: any) {
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'payment.verified',
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    }).catch((err) => {
      console.warn('Webhook dispatch failed:', err.message);
    });
  }

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FamPay SaaS Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
