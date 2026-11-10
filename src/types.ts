export interface GatewayConfig {
  merchantUpiId: string;
  merchantName: string;
  gmail: string;
  hasGmailPassword: boolean;
  mode: 'live' | 'simulation';
  enableDynamicAmount: boolean;
  webhookUrl?: string;
  sessionTimeoutMinutes: number;
  activeSessionsCount: number;
  apiKey: string;
  isAdmin?: boolean;
}

export interface PaymentSession {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note: string;
  baseAmount: number;
  payableAmount: number;
  dynamicOffset: number;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  upiUri: string;
  qrCodeUrl: string;
  createdAt: number;
  expiresAt: number;
  verifiedAt?: number;
  utr?: string;
  transactionId?: string;
  senderName?: string;
  verificationSource?: 'fampay-verify-imap' | 'simulation' | 'manual-utr';
  webhookDelivered?: boolean;
}

export interface LedgerStats {
  totalVolume: number;
  verifiedCount: number;
  pendingCount: number;
  expiredCount: number;
  totalCount: number;
}

export interface UserMerchantProfile {
  id: string;
  userId: string;
  merchantUpiId: string;
  merchantName: string;
  gmail: string;
  hasGmailPassword: boolean;
  apiKey: string;
  mode: 'live' | 'simulation';
  enableDynamicAmount: boolean;
  webhookUrl?: string;
  sessionTimeoutMinutes: number;
  isAdmin?: boolean;
}

