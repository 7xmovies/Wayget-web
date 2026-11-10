import React, { useState } from 'react';
import { Code2, Copy, CheckCircle2, Play, ExternalLink, Terminal } from 'lucide-react';
import { GatewayConfig } from '../types';

interface ApiDocsProps {
  config: GatewayConfig | null;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({ config }) => {
  const [activeEndpoint, setActiveEndpoint] = useState<'create' | 'verify' | 'status'>('create');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      id: 'create' as const,
      method: 'POST',
      path: '/api/payment/create',
      title: 'Create Payment Session & QR',
      description: 'Generates a unique dynamic UPI checkout session, base64 QR code, and UPI deep-link.',
      body: JSON.stringify(
        {
          amount: 199,
          orderId: 'ORD-10928',
          customerName: 'Aman Verma',
          note: 'Pro Plan Subscription',
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          success: true,
          session: {
            id: 'pay_lv08a_8f3d',
            orderId: 'ORD-10928',
            baseAmount: 199,
            payableAmount: 199.04,
            dynamicOffset: 0.04,
            status: 'PENDING',
            upiUri: 'upi://pay?pa=apextech@fam&pn=Apex&am=199.04&cu=INR&tn=ORD-10928',
            qrCodeUrl: 'data:image/png;base64,iVBORw0KGgo...',
            expiresAt: 1731195600000,
          },
        },
        null,
        2
      ),
    },
    {
      id: 'verify' as const,
      method: 'POST',
      path: '/api/payment/verify',
      title: 'Verify Payment via fampay-verify',
      description: 'Connects to Gmail IMAP via fampay-verify to match incoming credit alert or checks manual UTR.',
      body: JSON.stringify(
        {
          sessionId: 'pay_lv08a_8f3d',
          utr: '412890562391', // optional
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          verified: true,
          status: 'VERIFIED',
          message: 'Verified! Received ₹199.04 from AMAN VERMA',
          transactionId: 'FAM41289056',
          utr: '412890562391',
          amount: 199.04,
          senderName: 'AMAN VERMA',
          verifiedAt: 1731192300000,
        },
        null,
        2
      ),
    },
    {
      id: 'status' as const,
      method: 'GET',
      path: '/api/payment/status/:id',
      title: 'Get Session Status',
      description: 'Fetch the latest real-time status of a payment session.',
      body: null,
      response: JSON.stringify(
        {
          session: {
            id: 'pay_lv08a_8f3d',
            orderId: 'ORD-10928',
            status: 'VERIFIED',
            payableAmount: 199.04,
            utr: '412890562391',
          },
        },
        null,
        2
      ),
    },
  ];

  const current = endpoints.find((e) => e.id === activeEndpoint)!;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Developer API & Integration Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Integrate <code className="font-mono text-amber-600 font-semibold">fampay-verify</code> into your
          Telegram bots, websites, and backend systems.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Endpoints Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setActiveEndpoint(ep.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition ${
                activeEndpoint === ep.id
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    ep.method === 'POST'
                      ? activeEndpoint === ep.id
                        ? 'bg-slate-950 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                      : activeEndpoint === ep.id
                      ? 'bg-slate-950 text-white'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="text-xs truncate">{ep.path}</span>
              </div>
              <p
                className={`text-[11px] mt-1 line-clamp-1 ${
                  activeEndpoint === ep.id ? 'text-slate-900 font-normal' : 'text-slate-500'
                }`}
              >
                {ep.title}
              </p>
            </button>
          ))}

          {/* Quick NPM Info */}
          <div className="p-4 bg-slate-900 text-white rounded-xl mt-6 space-y-2">
            <span className="text-xs text-amber-400 font-mono font-bold">npm package</span>
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg font-mono text-xs">
              <code>npm i fampay-verify</code>
              <button
                onClick={() => copyText('npm i fampay-verify', 'npm')}
                className="text-slate-400 hover:text-white"
              >
                {copied === 'npm' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <a
              href="https://www.npmjs.com/package/fampay-verify"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 pt-1"
            >
              View on npmjs.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Endpoint Documentation Details */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                {current.method}
              </span>
              <span className="font-mono text-base font-bold text-slate-900">{current.path}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">{current.title}</h3>
            <p className="text-xs text-slate-600 mt-1">{current.description}</p>
          </div>

          {current.body && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Request Body (JSON)</span>
                <button
                  onClick={() => copyText(current.body!, 'body')}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  {copied === 'body' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
                <code>{current.body}</code>
              </pre>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">Response (200 OK)</span>
              <button
                onClick={() => copyText(current.response, 'resp')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                {copied === 'resp' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs overflow-x-auto">
              <code>{current.response}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
