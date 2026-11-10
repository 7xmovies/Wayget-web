import React from 'react';
import { CheckCircle2, Printer, X, ShieldCheck } from 'lucide-react';
import { PaymentSession, GatewayConfig } from '../types';

interface ReceiptModalProps {
  session: PaymentSession | null;
  config: GatewayConfig | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ session, config, onClose }) => {
  if (!session) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptDate = session.verifiedAt
    ? new Date(session.verifiedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : new Date(session.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Receipt Header Actions */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">Official Transaction Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-8 space-y-6 text-slate-800" id="printable-receipt">
          {/* Top Brand & Status */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-600 font-mono">
                FamPay Verified Payment
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {config?.merchantName || 'Apex Cloud & Tech'}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                UPI: {config?.merchantUpiId || 'merchant@fam'}
              </p>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VERIFIED
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {session.orderId}
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount Received</span>
            <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
              ₹{session.payableAmount.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Indian Rupees · Fully Settled
            </span>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-3 text-xs border-b border-slate-200 pb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Ref / UTR:</span>
              <span className="font-mono font-bold text-slate-900">{session.utr || 'FAM-SIMULATED'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Payer Name:</span>
              <span className="font-semibold text-slate-800">
                {session.senderName || session.customerName || 'UPI User'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Item / Note:</span>
              <span className="text-slate-700">{session.note || 'Product Order'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Verification Source:</span>
              <span className="font-mono text-slate-700">{session.verificationSource || 'fampay-verify'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Timestamp (IST):</span>
              <span className="text-slate-700">{receiptDate}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[11px] text-slate-400 pt-2">
            <p>This is a computer-generated proof of payment verified via fampay-verify email automation.</p>
            <p className="mt-1 font-mono">Session ID: {session.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
