import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Copy,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import { PaymentSession, LedgerStats } from '../types';

interface TransactionLedgerProps {
  transactions: PaymentSession[];
  stats: LedgerStats | null;
  onRefresh: () => void;
  onViewReceipt: (session: PaymentSession) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  stats,
  onRefresh,
  onViewReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'EXPIRED'>('ALL');
  const [selectedTx, setSelectedTx] = useState<PaymentSession | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      tx.orderId.toLowerCase().includes(term) ||
      tx.customerName.toLowerCase().includes(term) ||
      (tx.utr && tx.utr.toLowerCase().includes(term)) ||
      (tx.transactionId && tx.transactionId.toLowerCase().includes(term)) ||
      (tx.senderName && tx.senderName.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const exportCsv = () => {
    const headers = ['Order ID', 'Status', 'Base Amount', 'Payable Amount', 'UTR', 'Sender', 'Customer', 'Date IST'];
    const rows = filtered.map((tx) => [
      tx.orderId,
      tx.status,
      tx.baseAmount,
      tx.payableAmount,
      tx.utr || 'N/A',
      `"${tx.senderName || tx.customerName || ''}"`,
      `"${tx.customerName || ''}"`,
      new Date(tx.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fampay_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const successRate = stats && stats.totalCount > 0 
    ? Math.round((stats.verifiedCount / stats.totalCount) * 100) 
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Settled Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{(stats?.totalVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Real-time verified credits
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Verified Payments</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {stats?.verifiedCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            Matched via IMAP & UTR
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Checkouts</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {stats?.pendingCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            Awaiting customer payment
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Success Rate</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 font-mono">
            {successRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            Verification accuracy rate
          </span>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search UTR, Order ID, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {(['ALL', 'VERIFIED', 'PENDING', 'EXPIRED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UTR / Ref No.</th>
                <th className="py-3 px-4">Payer / Customer</th>
                <th className="py-3 px-4">Date (IST)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{tx.orderId}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{tx.note}</div>
                    </td>

                    <td className="py-3 px-4">
                      {tx.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : tx.status === 'EXPIRED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-900 text-sm">₹{tx.payableAmount.toFixed(2)}</span>
                      {tx.dynamicOffset > 0 && (
                        <span className="block text-[10px] text-slate-400">
                          base ₹{tx.baseAmount.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {tx.utr ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{tx.utr}</span>
                          <button
                            onClick={() => copyUtr(tx.utr!)}
                            className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition"
                            title="Copy UTR"
                          >
                            {copiedUtr === tx.utr ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Waiting...</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {tx.senderName || tx.customerName || 'Anonymous Payer'}
                      </div>
                      {tx.customerPhone && (
                        <div className="text-[11px] text-slate-400">{tx.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="Inspect details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {tx.status === 'VERIFIED' && (
                          <button
                            onClick={() => onViewReceipt(tx)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Print Tax Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No transactions match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <span className="text-xs text-amber-400 font-mono">{selectedTx.orderId}</span>
                <h3 className="text-base font-bold">Transaction Audit Record</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Status</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedTx.status}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Payable Amount</span>
                  <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                    ₹{selectedTx.payableAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Session ID:</span>
                  <span className="font-mono text-slate-700">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Bank UTR Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTx.utr || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Sender / Account Name:</span>
                  <span className="font-medium text-slate-800">{selectedTx.senderName || selectedTx.customerName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Verification Source:</span>
                  <span className="font-mono text-amber-600">{selectedTx.verificationSource || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Created At:</span>
                  <span className="text-slate-700">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
                {selectedTx.verifiedAt && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Verified At:</span>
                    <span className="text-slate-700">{new Date(selectedTx.verifiedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                {selectedTx.status === 'VERIFIED' && (
                  <button
                    onClick={() => {
                      onViewReceipt(selectedTx);
                      setSelectedTx(null);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center"
                  >
                    View Tax Receipt
                  </button>
                )}
                <button
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
