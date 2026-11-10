import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  IndianRupee, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Search,
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import { insforge } from '../lib/insforge';

interface AdminStats {
  totalMerchants: number;
  totalPayments: number;
  totalVolume: number;
  verifiedCount: number;
  pendingCount: number;
  expiredCount: number;
}

interface AdminMerchant {
  id: string;
  user_id: string;
  merchant_upi_id: string;
  merchant_name: string;
  gmail: string;
  api_key: string;
  mode: string;
  is_admin: boolean;
  created_at: string;
}

interface AdminPayment {
  id: string;
  user_id: string;
  order_id: string;
  customer_name: string;
  base_amount: number;
  payable_amount: number;
  status: string;
  utr?: string;
  verification_source?: string;
  created_at: string;
  verified_at?: string;
}

export const AdminConsole: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = (insforge.auth as any).tokenManager?.getSession?.();
      const token = session?.accessToken;

      const res = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. This console is restricted to platform administrators.');
        }
        throw new Error(`Failed to load admin overview (${res.status})`);
      }

      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setMerchants(data.merchants || []);
        setPayments(data.recentPayments || []);
      } else {
        throw new Error(data.error || 'Failed to fetch admin data');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to admin overview API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredMerchants = merchants.filter((m) =>
    (m.merchant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.merchant_upi_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.api_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.gmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="p-6 bg-slate-900 border border-purple-900/60 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                Root Administrator Access
              </span>
              <span className="text-xs text-slate-400 font-mono">
                InsForge Cloud Postgres
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Platform Master Console & Tenant Overview
            </h1>
            <p className="text-xs text-slate-300">
              Real-time monitoring of all registered merchants, API credentials, and global payment verification volume.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminOverview}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-purple-200 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Metrics
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-950/30 border border-red-900/50 rounded-2xl text-center space-y-2">
          <p className="text-sm font-semibold text-red-400">{error}</p>
          <p className="text-xs text-slate-400">
            Ensure you are logged in with the administrator account.
          </p>
        </div>
      ) : null}

      {/* Global Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Registered Merchants</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '...' : stats?.totalMerchants ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Multi-tenant store accounts</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Global Verified GMV</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {loading ? '...' : `₹${(stats?.totalVolume ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </div>
          <p className="text-[11px] text-slate-400">Verified platform volume</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Invoices</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {loading ? '...' : stats?.totalPayments ?? 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{stats?.verifiedCount ?? 0} paid</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{stats?.pendingCount ?? 0} pending</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Verification Health</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">
            {stats && stats.totalPayments > 0 
              ? `${Math.round((stats.verifiedCount / stats.totalPayments) * 100)}%`
              : '100%'}
          </div>
          <p className="text-[11px] text-slate-400">fampay-verify reconciliation</p>
        </div>
      </div>

      {/* Tenants & Merchants List */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              All Registered Tenants & Merchant Credentials
            </h2>
            <p className="text-xs text-slate-400">
              Inspect active store credentials, API keys, and operational modes.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search name, UPI, or API key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Store Name</th>
                <th className="px-4 py-3">Merchant UPI ID</th>
                <th className="px-4 py-3">Gmail Account</th>
                <th className="px-4 py-3">API Key</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No merchants found.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white font-sans">
                      {m.merchant_name || 'Unnamed Merchant'}
                    </td>
                    <td className="px-4 py-3 text-amber-300">
                      {m.merchant_upi_id}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      {m.gmail || <span className="text-slate-600 italic">Not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 truncate max-w-[140px]">
                          {m.api_key}
                        </span>
                        <button
                          onClick={() => handleCopy(m.api_key, m.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          title="Copy API Key"
                        >
                          {copiedKey === m.id ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.mode === 'live' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {m.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {m.is_admin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          Admin
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Merchant</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] font-sans">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Payment Audit Log */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            Global Platform Payment Invoices
          </h2>
          <p className="text-xs text-slate-400">
            Recent payments created across all merchant portals in the InsForge database.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payable Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">UTR Reference</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-amber-400 font-bold">
                      {p.order_id}
                    </td>
                    <td className="px-4 py-3 text-white font-sans">
                      {p.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="px-4 py-3 text-white font-bold">
                      ₹{Number(p.payable_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {p.utr || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans text-[11px]">
                      {p.verification_source || 'simulation'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] font-sans">
                      {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
