import React, { useState } from 'react';
import { 
  Key, 
  Copy, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  Globe, 
  Code2, 
  ExternalLink, 
  Check, 
  Layers,
  Terminal,
  Zap,
  ArrowRight
} from 'lucide-react';
import { GatewayConfig } from '../types';
import { InsForgeUser } from '../lib/insforge';

interface ApiHubProps {
  config: GatewayConfig | null;
  user: InsForgeUser | null;
  onOpenAuth: () => void;
  onKeyRegenerated: () => void;
}

export const ApiHub: React.FC<ApiHubProps> = ({ config, user, onOpenAuth, onKeyRegenerated }) => {
  const [apiKey, setApiKey] = useState<string>(config?.apiKey || '');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const displayKey = user && config?.apiKey ? (apiKey || config.apiKey) : 'fp_live_••••••••••••••••••••••••';
  const codeKey = user && config?.apiKey ? (apiKey || config.apiKey) : 'fp_live_YOUR_MERCHANT_KEY';

  // Live Interactive API Tester State
  const [testAmount, setTestAmount] = useState<string>('99');
  const [testCustomer, setTestCustomer] = useState<string>('Alex Johnson');
  const [testOrderId, setTestOrderId] = useState<string>(`EXT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isCallingApi, setIsCallingApi] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string>('');
  const [isVerifyingApi, setIsVerifyingApi] = useState<boolean>(false);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);

  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'react' | 'node' | 'python' | 'curl'>('html');

  // Base API URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  // Synchronize with config apiKey
  React.useEffect(() => {
    if (config?.apiKey) {
      setApiKey(config.apiKey);
    }
  }, [config?.apiKey]);

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? Any existing integration using the old key will need to be updated.')) {
      return;
    }
    try {
      setIsRegenerating(true);
      const session = (window as any).insforgeUserSession;
      const token = session?.accessToken || '';

      const res = await fetch('/api/user/regenerate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
        onKeyRegenerated();
      } else {
        // Fallback to gateway regeneration
        const fallbackRes = await fetch('/api/gateway/regenerate-api-key', { method: 'POST' });
        const fallbackData = await fallbackRes.json();
        if (fallbackData.apiKey) {
          setApiKey(fallbackData.apiKey);
          onKeyRegenerated();
        }
      }
    } catch (err: any) {
      alert(`Failed to regenerate key: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Test 1: Live Create Payment via API
  const handleTestCreatePayment = async () => {
    if (!user) {
      alert('Please sign in or register to get your API key and execute live API calls.');
      onOpenAuth();
      return;
    }

    try {
      setIsCallingApi(true);
      setApiResponse(null);
      setVerifyResponse(null);

      const res = await fetch('/api/v1/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          amount: parseFloat(testAmount) || 99,
          orderId: testOrderId,
          customerName: testCustomer,
          note: 'External Website Checkout',
        }),
      });

      const data = await res.json();
      setApiResponse(data);
      if (data.sessionId) {
        setCreatedSessionId(data.sessionId);
      }
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsCallingApi(false);
    }
  };

  // Test 2: Live Verify Payment via API
  const handleTestVerifyPayment = async () => {
    if (!user) {
      alert('Please sign in to execute live API verification.');
      onOpenAuth();
      return;
    }

    if (!createdSessionId) {
      alert('Please create a payment first to get a sessionId.');
      return;
    }

    try {
      setIsVerifyingApi(true);
      setVerifyResponse(null);

      // Call the real verify endpoint (Gmail IMAP or session status check)
      const res = await fetch('/api/v1/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          sessionId: createdSessionId,
        }),
      });

      const data = await res.json();
      setVerifyResponse(data);
    } catch (err: any) {
      setVerifyResponse({ error: err.message });
    } finally {
      setIsVerifyingApi(false);
    }
  };

  // Code snippets for external integrations
  const getHtmlSnippet = () => {
    return `<!-- Drop-in FamPay Checkout for any HTML website -->
<div id="fampay-checkout-container">
  <button id="pay-btn" onclick="startFamPayCheckout()">Pay with UPI / FamPay (₹${testAmount})</button>
  <div id="qr-display" style="display:none; margin-top:16px;">
    <p>Scan with FamPay, GPay, PhonePe, or Paytm:</p>
    <img id="qr-img" width="220" />
    <p id="amount-text" style="font-weight:bold;"></p>
    <p id="status-text" style="color:#d97706;">Awaiting payment verification...</p>
  </div>
</div>

<script>
async function startFamPayCheckout() {
  document.getElementById('pay-btn').disabled = true;
  document.getElementById('pay-btn').innerText = 'Generating QR...';

  // 1. Create Payment Request on your API Gateway
  const res = await fetch('${baseUrl}/api/v1/payment/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${codeKey}'
    },
    body: JSON.stringify({
      amount: ${testAmount},
      orderId: 'ORD-' + Date.now(),
      customerName: 'Website Customer'
    })
  });

  const data = await res.json();
  if (!data.success) return alert('Payment failed to initialize');

  // 2. Display QR & payable dynamic amount
  document.getElementById('qr-img').src = data.qrCodeUrl;
  document.getElementById('amount-text').innerText = 'Exact Amount: ₹' + data.payableAmount;
  document.getElementById('qr-display').style.display = 'block';

  // 3. Poll for instant verification
  const checkInterval = setInterval(async () => {
    const statusRes = await fetch('${baseUrl}/api/v1/payment/status/' + data.sessionId);
    const statusData = await statusRes.json();

    if (statusData.verified) {
      clearInterval(checkInterval);
      document.getElementById('status-text').innerText = '✅ Payment Verified! UTR: ' + statusData.utr;
      document.getElementById('status-text').style.color = '#16a34a';
      // Deliver digital goods, redirect to success page, or grant access:
      // window.location.href = '/thank-you?orderId=' + data.orderId;
    }
  }, 5000);
}
</script>`;
  };

  const getReactSnippet = () => {
    return `import React, { useState, useEffect } from 'react';

export function FamPayCheckout({ amount = ${testAmount}, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('IDLE');

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('${baseUrl}/api/v1/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '${codeKey}',
        },
        body: JSON.stringify({
          amount,
          orderId: 'ORD-' + Date.now(),
          customerName: 'App User',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data);
        setStatus('PENDING');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll status while pending
  useEffect(() => {
    if (!session?.sessionId || status !== 'PENDING') return;

    const timer = setInterval(async () => {
      const res = await fetch(\`${baseUrl}/api/v1/payment/status/\${session.sessionId}\`);
      const data = await res.json();
      if (data.verified) {
        setStatus('VERIFIED');
        clearInterval(timer);
        if (onSuccess) onSuccess(data);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [session, status]);

  if (status === 'VERIFIED') {
    return <div className="text-green-600 font-bold">✅ Payment Verified! Thank you.</div>;
  }

  if (session) {
    return (
      <div className="p-4 border rounded-xl text-center">
        <h3 className="font-bold">Scan to Pay ₹{session.payableAmount}</h3>
        <img src={session.qrCodeUrl} alt="UPI QR" className="mx-auto w-48 h-48" />
        <a href={session.upiUri} className="block mt-2 text-sm text-blue-600 underline">
          Open in UPI App
        </a>
        <p className="text-xs text-amber-600 mt-2">Checking payment status automatically...</p>
      </div>
    );
  }

  return (
    <button onClick={initiatePayment} disabled={loading} className="px-4 py-2 bg-amber-500 font-bold rounded">
      {loading ? 'Creating...' : \`Pay ₹\${amount} with FamPay / UPI\`}
    </button>
  );
}`;
  };

  const getNodeSnippet = () => {
    return `// Backend Node.js / Express integration
const GATEWAY_URL = '${baseUrl}';
const API_KEY = '${codeKey}';

// 1. Create a payment session
async function createPayment(amount, orderId, customerName) {
  const response = await fetch(\`\${GATEWAY_URL}/api/v1/payment/create\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      amount,
      orderId,
      customerName,
    }),
  });
  return await response.json();
}

// 2. Verify payment status
async function checkPaymentStatus(sessionId) {
  const response = await fetch(\`\${GATEWAY_URL}/api/v1/payment/status/\${sessionId}\`, {
    headers: { 'x-api-key': API_KEY },
  });
  return await response.json();
}

// 3. Manual verification fallback (by UTR number)
async function verifyWithUtr(sessionId, utrNumber) {
  const response = await fetch(\`\${GATEWAY_URL}/api/v1/payment/verify\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ sessionId, utr: utrNumber }),
  });
  return await response.json();
}`;
  };

  const getPythonSnippet = () => {
    return `import requests

GATEWAY_URL = "${baseUrl}"
API_KEY = "${codeKey}"

# 1. Create Payment
def create_payment(amount: float, order_id: str, customer_name: str):
    url = f"{GATEWAY_URL}/api/v1/payment/create"
    headers = {"Content-Type": "application/json", "x-api-key": API_KEY}
    payload = {
        "amount": amount,
        "orderId": order_id,
        "customerName": customer_name
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# 2. Check Verification Status
def check_status(session_id: str):
    url = f"{GATEWAY_URL}/api/v1/payment/status/{session_id}"
    headers = {"x-api-key": API_KEY}
    response = requests.get(url, headers=headers)
    return response.json()

# Example Usage:
payment = create_payment(199.0, "ORD-9912", "Rahul Sharma")
print("Scan QR code:", payment["qrCodeUrl"])
print("Payable exact amount:", payment["payableAmount"])
print("UPI link:", payment["upiUri"])`;
  };

  const getCurlSnippet = () => {
    return `# 1. Create a Payment Session
curl -X POST "${baseUrl}/api/v1/payment/create" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${codeKey}" \\
  -d '{
    "amount": ${testAmount},
    "orderId": "${testOrderId}",
    "customerName": "${testCustomer}"
  }'

# 2. Check Verification Status
curl "${baseUrl}/api/v1/payment/status/${createdSessionId || 'pay_sample_id'}" \\
  -H "x-api-key: ${codeKey}"

# 3. Manual UTR Verification
curl -X POST "${baseUrl}/api/v1/payment/verify" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${codeKey}" \\
  -d '{
    "sessionId": "${createdSessionId || 'pay_sample_id'}",
    "utr": "412890562391"
  }'`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Introduction */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            API Integration Gateway
          </h1>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            CORS Enabled · REST v1
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Use this website as your payment verification microservice. Create payment QR codes and verify transactions directly from any external website, mobile application, or backend.
        </p>
      </div>

      {/* Top Credentials & Base URL Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Base URL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            API Base Endpoint
          </span>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs">
            <span className="text-slate-800 font-semibold truncate">{baseUrl}</span>
            <button
              onClick={() => copyToClipboard(baseUrl, 'base')}
              className="p-1 text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
            >
              {copiedSnippet === 'base' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            All endpoints are CORS-enabled. Your client websites can call this directly from the browser!
          </p>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Merchant API Key
            </span>
            {user ? (
              <button
                onClick={handleRegenerateKey}
                disabled={isRegenerating}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                Login Required
              </span>
            )}
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs">
            <span className={user ? "text-slate-900 font-bold tracking-wider truncate" : "text-slate-400 select-none tracking-widest font-mono"}>
              {displayKey}
            </span>
            {user ? (
              <button
                onClick={() => copyToClipboard(displayKey, 'key')}
                className="p-1 text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
                title="Copy API Key"
              >
                {copiedKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                Sign In to View
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {user ? (
              <>Pass via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">x-api-key</code> header or Bearer authorization header.</>
            ) : (
              <>Sign in to generate and view your unique live merchant API key connected to your UPI ID.</>
            )}
          </p>
        </div>
      </div>

      {/* Interactive Live API Test Console */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Live Interactive API Console
            </h2>
            <p className="text-xs text-slate-500">
              Test creating and verifying payments directly through the REST API endpoints in real-time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Ref</label>
                <input
                  type="text"
                  value={testOrderId}
                  onChange={(e) => setTestOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={testCustomer}
                onChange={(e) => setTestCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-2 pt-2">
              {/* Button 1: Create */}
              <button
                onClick={handleTestCreatePayment}
                disabled={isCallingApi}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                {isCallingApi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing POST /api/v1/payment/create...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    1. Execute POST /api/v1/payment/create
                  </>
                )}
              </button>

              {/* Button 2: Verify Payment via fampay-verify (Gmail IMAP) */}
              <button
                onClick={handleTestVerifyPayment}
                disabled={isVerifyingApi || !createdSessionId}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
              >
                {isVerifyingApi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    2. Execute POST /api/v1/payment/verify
                  </>
                )}
              </button>
            </div>

            {createdSessionId && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <span className="font-bold">Active Session Created:</span>
                <span className="block font-mono mt-0.5">{createdSessionId}</span>
              </div>
            )}
          </div>

          {/* Response Viewer */}
          <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800 p-4 text-xs font-mono text-slate-200 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span>Live Response Terminal</span>
              <span>
                {apiResponse
                  ? 'Status: 200 OK'
                  : 'Awaiting execution'}
              </span>
            </div>

            <pre className="leading-relaxed text-slate-300 whitespace-pre-wrap break-all">
              <code>
                {verifyResponse
                  ? JSON.stringify(verifyResponse, null, 2)
                  : apiResponse
                  ? JSON.stringify(apiResponse, null, 2)
                  : `// Click "1. Execute POST /api/v1/payment/create" to view live JSON response here.`}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Ready-to-Copy Integration Snippets for Other Websites */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-700" />
              Copy Integration Code for Your Website or App
            </h2>
            <p className="text-xs text-slate-500">
              Select your platform below to copy the ready-to-run integration snippet
            </p>
          </div>

          <button
            onClick={() => {
              const code =
                activeCodeTab === 'html'
                  ? getHtmlSnippet()
                  : activeCodeTab === 'react'
                  ? getReactSnippet()
                  : activeCodeTab === 'node'
                  ? getNodeSnippet()
                  : activeCodeTab === 'python'
                  ? getPythonSnippet()
                  : getCurlSnippet();
              copyToClipboard(code, activeCodeTab);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            {copiedSnippet === activeCodeTab ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedSnippet === activeCodeTab ? 'Copied Code!' : 'Copy Code Snippet'}
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-2 text-xs overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'html', label: 'HTML / JS Website (Drop-in)' },
              { id: 'react', label: 'React / Next.js Component' },
              { id: 'node', label: 'Node.js Backend' },
              { id: 'python', label: 'Python / Flask / Django' },
              { id: 'curl', label: 'cURL Commands' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id)}
              className={`py-3 px-3.5 font-semibold border-b-2 whitespace-nowrap transition ${
                activeCodeTab === tab.id
                  ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content (Full height, no inner scroll box) */}
        <div className="bg-slate-950 p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
          <pre>
            <code>
              {activeCodeTab === 'html' && getHtmlSnippet()}
              {activeCodeTab === 'react' && getReactSnippet()}
              {activeCodeTab === 'node' && getNodeSnippet()}
              {activeCodeTab === 'python' && getPythonSnippet()}
              {activeCodeTab === 'curl' && getCurlSnippet()}
            </code>
          </pre>
        </div>
      </div>

      {/* Clean API Endpoints Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900">API Endpoints Reference</h3>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                POST
              </span>
              <span className="font-mono font-bold text-slate-900">/api/v1/payment/create</span>
            </div>
            <span className="text-slate-500">
              Creates dynamic payment session, generates base64 QR code and UPI URI
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                POST
              </span>
              <span className="font-mono font-bold text-slate-900">/api/v1/payment/verify</span>
            </div>
            <span className="text-slate-500">
              Triggers fampay-verify IMAP check or verifies using 12-digit UTR
            </span>
          </div>

          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[11px]">
                GET
              </span>
              <span className="font-mono font-bold text-slate-900">/api/v1/payment/status/:id</span>
            </div>
            <span className="text-slate-500">
              Polls payment status (returns verified: true/false, UTR, payer name)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
