import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Mail, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  HelpCircle, 
  Globe, 
  Save, 
  Send,
  Zap,
  Info,
  Lock
} from 'lucide-react';
import { GatewayConfig } from '../types';
import { insforge, InsForgeUser } from '../lib/insforge';

interface GatewaySettingsProps {
  config: GatewayConfig | null;
  user: InsForgeUser | null;
  onConfigUpdated: () => void;
  onOpenImapGuide: () => void;
  onOpenAuth: () => void;
}

export const GatewaySettings: React.FC<GatewaySettingsProps> = ({
  config,
  user,
  onConfigUpdated,
  onOpenImapGuide,
  onOpenAuth,
}) => {
  const [merchantUpiId, setMerchantUpiId] = useState<string>(config?.merchantUpiId || 'user@fam');
  const [merchantName, setMerchantName] = useState<string>(config?.merchantName || 'My Store');
  const [gmail, setGmail] = useState<string>(config?.gmail || '');
  const [gmailAppPassword, setGmailAppPassword] = useState<string>('');
  const [mode, setMode] = useState<'live' | 'simulation'>(config?.mode || 'simulation');
  const [enableDynamicAmount, setEnableDynamicAmount] = useState<boolean>(
    config?.enableDynamicAmount ?? true
  );
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(
    config?.sessionTimeoutMinutes || 15
  );
  const [webhookUrl, setWebhookUrl] = useState<string>(config?.webhookUrl || '');

  // UI status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isTestingImap, setIsTestingImap] = useState<boolean>(false);
  const [imapTestResult, setImapTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  // Sync state when config changes
  useEffect(() => {
    if (config) {
      setMerchantUpiId(config.merchantUpiId || 'user@fam');
      setMerchantName(config.merchantName || 'My Store');
      setGmail(config.gmail || '');
      setMode(config.mode || 'simulation');
      setEnableDynamicAmount(config.enableDynamicAmount ?? true);
      setSessionTimeoutMinutes(config.sessionTimeoutMinutes || 15);
      setWebhookUrl(config.webhookUrl || '');
    }
  }, [config]);

  // Handle Save to InsForge Database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(null);

      // Get current auth session token
      const session = (insforge.auth as any).tokenManager?.getSession();
      const token = session?.accessToken || '';

      const res = await fetch('/api/user/merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantUpiId,
          merchantName,
          gmail,
          gmailAppPassword: gmailAppPassword || undefined,
          mode,
          enableDynamicAmount,
          sessionTimeoutMinutes,
          webhookUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Your merchant credentials were saved to InsForge database!');
        setGmailAppPassword(''); // clear sensitive password field after saving
        onConfigUpdated();
        setTimeout(() => setSaveSuccess(null), 3500);
      } else {
        alert(data.error || 'Failed to save merchant credentials');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Test IMAP Connection
  const handleTestImap = async () => {
    try {
      setIsTestingImap(true);
      setImapTestResult(null);

      const session = (insforge.auth as any).tokenManager?.getSession();
      const token = session?.accessToken || '';

      const res = await fetch('/api/gateway/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          gmail,
          gmailAppPassword,
        }),
      });

      const data = await res.json();
      setImapTestResult(data);
    } catch (err: any) {
      setImapTestResult({
        success: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setIsTestingImap(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Merchant Credentials
          </h1>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            BYO UPI & Gmail
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Bring your own receiving UPI ID, business name, and Gmail credentials to verify payments on your own account.
        </p>
      </div>

      {!user && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              <strong className="block">Guest Mode Active</strong>
              Sign in or create an account with email, Google, or GitHub to save your personal merchant credentials permanently in InsForge.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl whitespace-nowrap shadow-xs"
          >
            Sign In / Register
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* UPI Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Receiving UPI Profile</h2>
              <p className="text-xs text-slate-500">The UPI ID that will collect payments from your customers</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Receiving UPI ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={merchantUpiId}
                onChange={(e) => setMerchantUpiId(e.target.value)}
                placeholder="yourname@fam, user@okhdfcbank, etc."
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                FamPay (@fam), PhonePe, GPay, Paytm, CRED, etc.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Business / Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Apex Studio"
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shown to buyers when scanning your QR code
              </span>
            </div>
          </div>
        </div>

        {/* Verification Engine */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Verification Engine</h2>
              <p className="text-xs text-slate-500">Real-time payment verification powered by fampay-verify</p>
            </div>
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-slate-900">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-bold block text-slate-900">Live Production Verification (Gmail IMAP + Bank UTR)</span>
                <span className="text-xs text-slate-600 mt-1 block leading-relaxed">
                  Uses the <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-semibold text-emerald-900">fampay-verify</code> engine to poll and parse real incoming UPI credit notifications directly from your connected Gmail inbox via secure IMAP. Direct bank UTR reference reconciliation is also available as a seamless fallback.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gmail IMAP Credentials */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">3. Your Gmail IMAP Credentials</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  fampay-verify
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Required for Live Mode so fampay-verify can read your bank / FamPay credit alert emails
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenImapGuide}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 underline decoration-dotted"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How to get App Password
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Gmail Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  placeholder="your_alerts@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                16-Character Google App Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder={config?.hasGmailPassword ? '•••••••••••••••• (Configured in Database)' : 'abcd efgh ijkl mnop'}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestImap}
              disabled={isTestingImap || !gmail}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition disabled:opacity-50"
            >
              {isTestingImap ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing Gmail IMAP Connection...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Test Gmail IMAP Connection
                </>
              )}
            </button>

            {imapTestResult && (
              <div
                className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                  imapTestResult.success
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {imapTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{imapTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Webhook Dispatch */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">4. Your Webhook Endpoint (Optional)</h2>
              <p className="text-xs text-slate-500">
                Receive instant HTTP POST alerts on your own website when a payment is verified
              </p>
            </div>
            <Globe className="w-5 h-5 text-slate-600" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Webhook URL (HTTPS)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://yourwebsite.com/api/payment-callback"
              className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {saveSuccess}
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Saved securely to InsForge PostgreSQL Database with RLS
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving to Database...' : 'Save My Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
};
