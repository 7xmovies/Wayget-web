import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Receipt, 
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { PaymentSession, GatewayConfig } from '../types';

interface CheckoutTerminalProps {
  config: GatewayConfig | null;
  onViewReceipt: (session: PaymentSession) => void;
  onSessionUpdated: () => void;
  activeSession: PaymentSession | null;
  setActiveSession: (session: PaymentSession | null) => void;
}

export const CheckoutTerminal: React.FC<CheckoutTerminalProps> = ({
  config,
  onViewReceipt,
  onSessionUpdated,
  activeSession,
  setActiveSession,
}) => {
  // Form State
  const [baseAmount, setBaseAmount] = useState<string>('99');
  const [orderId, setOrderId] = useState<string>(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
  const [customerName, setCustomerName] = useState<string>('Dev User');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [note, setNote] = useState<string>('Pro Subscription');
  const [useDynamicAmount, setUseDynamicAmount] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Verification & Polling state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [manualUtr, setManualUtr] = useState<string>('');
  const [manualUtrError, setManualUtrError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string>('');

  const pollingIntervalRef = useRef<any>(null);

  // Initialize countdown timer when activeSession changes
  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const left = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setTimeRemaining(left);
      if (left <= 0 && activeSession.status === 'PENDING') {
        setActiveSession({ ...activeSession, status: 'EXPIRED' });
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [activeSession?.expiresAt, activeSession?.status]);

  // Auto-polling verification loop
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'PENDING') {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      return;
    }

    const checkVerification = async () => {
      try {
        setIsVerifying(true);
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config?.apiKey ? { 'x-api-key': config.apiKey } : {}),
          },
          body: JSON.stringify({ sessionId: activeSession.id }),
        });
        const data = await res.json();

        if (data.verified && data.session) {
          setActiveSession(data.session);
          setVerificationFeedback(data.message || 'Payment successfully verified!');
          onSessionUpdated();
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        } else if (data.status === 'EXPIRED') {
          setActiveSession(data.session);
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        } else {
          setVerificationFeedback(data.message || 'Checking Gmail IMAP for recent credits...');
        }
      } catch (err) {
        console.warn('Verification poll failed:', err);
      } finally {
        setIsVerifying(false);
      }
    };

    // Initial check after 3 seconds, then poll every 6 seconds
    const timeout = setTimeout(checkVerification, 3000);
    pollingIntervalRef.current = setInterval(checkVerification, 6000);

    return () => {
      clearTimeout(timeout);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [activeSession?.id, activeSession?.status]);

  // Create payment session handler
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(baseAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config?.apiKey ? { 'x-api-key': config.apiKey } : {}),
        },
        body: JSON.stringify({
          amount: num,
          orderId,
          customerName,
          customerPhone,
          note,
          useDynamicAmount,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        setVerificationFeedback('Payment session initialized. Awaiting UPI transfer...');
        onSessionUpdated();
      } else {
        alert(data.error || 'Failed to create payment session');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Manual UTR submission handler
  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const trimmed = manualUtr.trim();
    if (trimmed.length < 8) {
      setManualUtrError('Please enter a valid 12-digit UPI UTR or reference number.');
      return;
    }
    setManualUtrError('');

    try {
      setIsVerifying(true);
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config?.apiKey ? { 'x-api-key': config.apiKey } : {}),
        },
        body: JSON.stringify({
          sessionId: activeSession.id,
          utr: trimmed,
        }),
      });

      const data = await res.json();
      if (data.verified && data.session) {
        setActiveSession(data.session);
        setVerificationFeedback(data.message);
        onSessionUpdated();
      } else {
        setManualUtrError(data.message || 'UTR not verified yet. Try again.');
      }
    } catch (err: any) {
      setManualUtrError(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          UPI & FamPay Verification Terminal
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Create dynamic UPI QR codes and verify payments automatically via Gmail IMAP alerts using{' '}
          <code className="text-amber-600 font-mono font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            fampay-verify
          </code>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Payment Generator Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Payment Invoice</h2>
              <p className="text-xs text-slate-500">Generates instant dynamic QR & deep link</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline decoration-dotted"
            >
              New Order ID
            </button>
          </div>

          <form onSubmit={handleCreatePayment} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Amount (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="99"
                  className="w-full pl-8 pr-4 py-2.5 text-lg font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {['49', '99', '199', '499', '999'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBaseAmount(amt)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                      baseAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order ID Reference
                </label>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Purpose / Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Product purchase or service fee"
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Dynamic Amount Option */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDynamicAmount}
                  onChange={(e) => setUseDynamicAmount(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Enable Dynamic Decimal Allocation (Recommended)
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Adds a unique +₹0.01 to +₹0.99 decimal tag so{' '}
                    <span className="font-mono font-semibold">fampay-verify</span> matches incoming
                    Gmail IMAP alerts automatically without asking customers for 12-digit UTRs.
                  </p>
                </div>
              </label>
            </div>

            {/* Merchant Info Banner */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Receiving UPI: <strong className="text-slate-800">{config?.merchantUpiId || 'fampay@fam'}</strong></span>
              </div>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{config?.merchantName || 'Merchant'}</span>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.99]"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Session...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Generate Payment QR Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Interactive UPI Checkout Terminal */}
        <div className="lg:col-span-7">
          {activeSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              {/* Terminal Top Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                        {activeSession.orderId}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {config?.merchantName || 'Apex Digital Store'}
                      </h3>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {activeSession.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        PAID & VERIFIED
                      </span>
                    ) : activeSession.status === 'EXPIRED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        SESSION EXPIRED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        AWAITING PAYMENT
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Highlight */}
                <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Payable Amount</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
                        ₹{activeSession.payableAmount.toFixed(2)}
                      </span>
                      {activeSession.dynamicOffset > 0 && (
                        <span className="text-xs text-slate-400 font-normal">
                          (₹{activeSession.baseAmount.toFixed(2)} + ₹{activeSession.dynamicOffset.toFixed(2)} tag)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Countdown Expiry */}
                  {activeSession.status === 'PENDING' && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        Time Remaining
                      </span>
                      <span className={`text-xl font-mono font-bold ${timeRemaining < 180 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                        {formatTimer(timeRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-6">
                {activeSession.status === 'VERIFIED' ? (
                  /* Verified Success State */
                  <div className="text-center py-6">
                    <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Payment Successfully Verified!</h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                      Confirmed received via{' '}
                      <span className="font-semibold text-slate-800">
                        {activeSession.verificationSource === 'fampay-verify-imap'
                          ? 'Gmail IMAP Alert (fampay-verify)'
                          : activeSession.verificationSource === 'manual-utr'
                          ? '12-digit UTR Match'
                          : 'Simulation Sandbox'}
                      </span>
                    </p>

                    {/* Receipt Details Card */}
                    <div className="mt-6 max-w-md mx-auto bg-slate-50 rounded-xl border border-slate-200 p-4 text-left space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Amount Received</span>
                        <span className="font-bold text-slate-900 text-sm">₹{activeSession.payableAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">UTR / Ref Number</span>
                        <span className="font-mono font-semibold text-slate-900">{activeSession.utr || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Sender Name</span>
                        <span className="font-medium text-slate-900">{activeSession.senderName || activeSession.customerName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Transaction ID</span>
                        <span className="font-mono text-slate-700">{activeSession.transactionId || 'FAM-OK'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Verification Time</span>
                        <span className="text-slate-700">
                          {activeSession.verifiedAt
                            ? new Date(activeSession.verifiedAt).toLocaleTimeString('en-IN')
                            : 'Just now'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => onViewReceipt(activeSession)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        <Receipt className="w-4 h-4" />
                        View & Print Tax Receipt
                      </button>
                      <button
                        onClick={() => {
                          setActiveSession(null);
                          setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
                      >
                        Create Another Payment
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Pending Payment State */
                  <div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* QR Code Container */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-md relative group">
                          <img
                            src={activeSession.qrCodeUrl}
                            alt="FamPay UPI QR Code"
                            className="w-52 h-52 object-contain"
                          />
                          {/* Centered FamPay Badge */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white p-1 rounded-full shadow-md border border-slate-200">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-extrabold text-slate-950">
                                FP
                              </div>
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                          Scan with FamPay, GPay, PhonePe, Paytm
                        </span>
                      </div>

                      {/* Payment Details & Deep Links */}
                      <div className="flex-1 w-full space-y-4">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Payee UPI ID:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">
                                {config?.merchantUpiId || 'apextech@fam'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(config?.merchantUpiId || 'apextech@fam', 'upi')}
                                className="p-1 text-slate-500 hover:text-slate-900 transition"
                                title="Copy UPI ID"
                              >
                                {copiedField === 'upi' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Exact Amount:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">
                                ₹{activeSession.payableAmount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(activeSession.payableAmount.toFixed(2), 'amount')}
                                className="p-1 text-slate-500 hover:text-slate-900 transition"
                                title="Copy Amount"
                              >
                                {copiedField === 'amount' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Note:</span>
                            <span className="font-mono text-slate-700 truncate max-w-[200px]">
                              {activeSession.orderId}
                            </span>
                          </div>
                        </div>

                        {/* Open in App Intent */}
                        <div className="space-y-2">
                          <a
                            href={activeSession.upiUri}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            Open Direct in UPI / FamPay App
                          </a>

                          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-400">
                            <span>Supported:</span>
                            <span className="font-semibold text-slate-600">FamPay</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-600">Google Pay</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-600">PhonePe</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-600">Paytm</span>
                          </div>
                        </div>

                        {/* Real-time Polling Feedback Bar */}
                        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
                          <RefreshCw className={`w-4 h-4 text-amber-400 flex-shrink-0 ${isVerifying ? 'animate-spin' : ''}`} />
                          <div className="flex-1 truncate">
                            <span className="font-semibold text-white">IMAP Verifier Status: </span>
                            <span className="text-slate-300">
                              {verificationFeedback || 'Awaiting incoming bank alert...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual UTR Fallback & Instant Simulation Section */}
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                      {/* Manual 12-digit UTR Input */}
                      <form onSubmit={handleManualUtrSubmit} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Enter 12-digit UTR / Ref No. if paid with rounded amount"
                          value={manualUtr}
                          onChange={(e) => setManualUtr(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isVerifying}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition"
                        >
                          Verify UTR
                        </button>
                      </form>
                      {manualUtrError && (
                        <p className="text-xs text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {manualUtrError}
                        </p>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active Payment Session</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Fill in the order amount on the left and click "Generate Payment QR Code" to launch a live UPI checkout session.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
