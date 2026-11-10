import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Code2, 
  Terminal, 
  QrCode, 
  Receipt, 
  Lock, 
  Globe, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Smartphone,
  Mail,
  IndianRupee,
  Layers,
  Clock,
  Key,
  Check,
  Copy
} from 'lucide-react';
import { GatewayConfig } from '../types';
import { InsForgeUser } from '../lib/insforge';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenTerminal: () => void;
  onOpenApi: () => void;
  user: InsForgeUser | null;
  config: GatewayConfig | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenTerminal,
  onOpenApi,
  user,
  config,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'node' | 'python' | 'react'>('curl');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const codeSnippets = {
    curl: `# 1. Create dynamic payment invoice with UPI QR
curl -X POST "${baseUrl}/api/v1/payment/create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${user && config?.apiKey ? config.apiKey : 'fp_live_YOUR_MERCHANT_KEY'}" \\
  -d '{
    "amount": 299,
    "orderId": "ORD-8921",
    "customerName": "Rahul Sharma",
    "note": "Pro Membership"
  }'

# 2. Check instant verification status
curl "${baseUrl}/api/v1/payment/status/ORD-8921"`,

    node: `import fetch from 'node-fetch';

// Create a payment session from your Node.js / Express backend
const response = await fetch('${baseUrl}/api/v1/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${user && config?.apiKey ? config.apiKey : 'fp_live_YOUR_MERCHANT_KEY'}',
  },
  body: JSON.stringify({
    amount: 499,
    orderId: 'ORD-10492',
    customerName: 'Priya Patel',
  }),
});

const { payment } = await response.json();
console.log('Customer QR Code:', payment.qrCodeUrl);
console.log('Payable Amount with dynamic offset:', payment.payableAmount);`,

    python: `import requests

# Create payment session in Python / Django / FastAPI
response = requests.post(
    "${baseUrl}/api/v1/payment/create",
    headers={"x-api-key": "${user && config?.apiKey ? config.apiKey : 'fp_live_YOUR_MERCHANT_KEY'}"},
    json={
        "amount": 999,
        "orderId": "ORD-5541",
        "customerName": "Anand Kumar",
    }
)

data = response.json()
print("UPI Intent Link:", data["payment"]["upiUri"])
print("QR Code Image:", data["payment"]["qrCodeUrl"])`,

    react: `// Drop-in React UPI Payment Button
import { useState } from 'react';

export function CheckoutButton() {
  const [qrUrl, setQrUrl] = useState(null);

  const startCheckout = async () => {
    const res = await fetch('${baseUrl}/api/v1/payment/create', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': '${user && config?.apiKey ? config.apiKey : 'fp_live_YOUR_MERCHANT_KEY'}'
      },
      body: JSON.stringify({ amount: 199, orderId: 'ORD-7721' })
    });
    const { payment } = await res.json();
    setQrUrl(payment.qrCodeUrl);
  };

  return (
    <div>
      <button onClick={startCheckout}>Pay with UPI / FamPay</button>
      {qrUrl && <img src={qrUrl} alt="UPI QR Code" />}
    </div>
  );
}`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-amber-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multi-Tenant Gateway · Powered by fampay-verify</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Turn Any UPI ID into an <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Instant Automated Payment Gateway
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Accept real UPI payments from FamPay, Google Pay, PhonePe, Paytm, and Cred with 
            <strong className="text-white"> 0% intermediary fees</strong>. Automated real-time verification powered by secure Gmail IMAP alerts and dynamic UPI matching.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{user ? 'Open Merchant Dashboard' : 'Get Free API Key'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenTerminal}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Launch Payment Terminal</span>
            </button>
          </div>

          {/* Trust Value Badges (Natural clean metadata) */}
          <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">0% Fee</div>
              <div className="text-xs text-slate-400 mt-0.5">No gateway deduction</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">0 Seconds</div>
              <div className="text-xs text-slate-400 mt-0.5">Instant direct settlement</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">BYOC</div>
              <div className="text-xs text-slate-400 mt-0.5">Bring your UPI ID & Gmail</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">CORS API</div>
              <div className="text-xs text-slate-400 mt-0.5">Call from any website</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (3 Simple Steps) */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How FamPay Verify Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A frictionless, 3-step pipeline designed for zero-commission peer-to-peer UPI reconciliation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold font-mono text-base">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Configure Credentials</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign up and provide your personal UPI ID (e.g. <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">store@fam</code>) and Gmail App Password. Each merchant receives an isolated API key.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold font-mono text-base">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Generate Dynamic QR</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Call <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">POST /api/v1/payment/create</code> from your external website. The engine adds micro-cent offsets (e.g. ₹99.03) to distinguish concurrent orders.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold font-mono text-base">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Instant IMAP Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the customer transfers funds, <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">fampay-verify</code> automatically catches the credit email notification in your inbox and verifies the session in seconds!
            </p>
          </div>
        </div>
      </section>

      {/* 3. Aggregators vs FamPay Verify Comparison */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
            Fintech Economics
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Traditional Gateways vs FamPay Verify
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Why direct P2P UPI verification is the preferred choice for modern indie creators and Indian businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-slate-300">Traditional Aggregators</span>
              <span className="text-xs font-mono text-red-400">Stripe / Razorpay / Cashfree</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong className="text-white">2.0% to 3.5% transaction cut</strong> taken on every single payment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong className="text-white">T+2 Settlement Delays:</strong> Funds are held for 48 hours before reaching your bank.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong className="text-white">Lengthy Business KYC:</strong> Requires business registrations, GST certificates, and approvals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">✕</span>
                <span><strong className="text-white">High Account Freeze Risk:</strong> Automated risk algorithms can lock your funds arbitrarily.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-amber-500/40 space-y-4 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                FamPay Verify SaaS
              </span>
              <span className="text-xs font-mono text-emerald-400">Direct P2P UPI</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">0% Platform Deduction:</strong> Keep 100% of customer payments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Instant Settled Funds:</strong> Customer pays directly to your personal UPI ID / bank.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Zero KYC Bureaucracy:</strong> Simply bring your UPI ID & Gmail account to get started in 2 minutes.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">100% Merchant Custody:</strong> No intermediary holds or freezes your earnings.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Developer-First REST API Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              Universal Microservice
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Developer-First REST API
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Integrate with any tech stack in 5 lines of code. CORS enabled for client-side web apps.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenApi}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Explore Interactive API Hub</span>
            </button>
          </div>
        </div>

        {/* Code Showcase Box (Full height, natural flow, NO inner scroll box!) */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-slate-200">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
            <div className="flex items-center gap-2">
              {(['curl', 'node', 'python', 'react'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
                    activeCodeTab === tab
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="p-6 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
            <pre className="whitespace-pre-wrap break-all">
              <code>{codeSnippets[activeCodeTab]}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* 5. Key Architecture Features */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for High-Trust Payments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Engineered with privacy-first credential isolation, webhooks, and multi-tenant InsForge cloud storage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <QrCode className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Dynamic Amount Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Adds randomized ₹0.01 to ₹0.99 offsets to simultaneous transactions. Allows 100% automated matching of identical base prices without order collision.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated Webhooks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Configure your backend webhook endpoint. As soon as a payment is reconciled, a cryptographically structured HTTP POST event is dispatched instantly.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Google App Password Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect via Google 16-character App Passwords. Your primary Gmail password is never needed, keeping your main Google account 100% secure.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Smartphone className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Any UPI App Supported</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers can scan and pay with FamPay, Google Pay, PhonePe, Paytm, BHIM, Cred, or their preferred banking app.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Layers className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Tenant PostgreSQL</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Backed by InsForge BaaS PostgreSQL database with Row Level Security. Every merchant's transactions and credentials remain strictly isolated.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Receipt className="w-5 h-5 text-sky-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Manual UTR Fallback</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In case of email delay, customers can submit their 12-digit bank UTR reference number for instantaneous secondary verification.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-slate-950 text-center space-y-6 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Start Accepting Automated UPI Payments Today
          </h2>
          <p className="text-sm sm:text-base font-medium text-slate-900/90">
            Sign up in 30 seconds, bring your own UPI ID and Gmail, and get your custom live API key immediately.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg transition"
          >
            {user ? 'Open Dashboard' : 'Create Free Account'}
          </button>

          <button
            onClick={onOpenTerminal}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/30 hover:bg-white/40 text-slate-950 font-bold text-sm rounded-xl transition border border-slate-950/10"
          >
            Test Pay Terminal
          </button>
        </div>
      </section>
    </div>
  );
};
