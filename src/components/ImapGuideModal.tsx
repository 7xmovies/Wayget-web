import React from 'react';
import { X, ExternalLink, ShieldCheck, Key, Lock, CheckCircle2 } from 'lucide-react';

interface ImapGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImapGuideModal: React.FC<ImapGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold">Google App Password Setup Guide</h3>
              <p className="text-xs text-slate-400">Required by fampay-verify for Gmail IMAP access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          <p className="leading-relaxed">
            Google does not allow third-party scripts to log into Gmail with your primary account password.
            Instead, Google provides dedicated <strong className="text-slate-900">16-character App Passwords</strong> specifically for IMAP applications like <code className="font-mono text-amber-600 bg-amber-50 px-1 py-0.5 rounded">fampay-verify</code>.
          </p>

          <div className="space-y-4">
            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Enable 2-Step Verification</h4>
                <p className="text-slate-500 mt-0.5">
                  Visit <strong className="text-slate-800">myaccount.google.com/security</strong> and ensure 2-Step Verification is turned ON for your Google account.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Open App Passwords</h4>
                <p className="text-slate-500 mt-0.5">
                  Search for "App Passwords" in the Google Security settings search bar or navigate directly to{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" />
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Create New App Password</h4>
                <p className="text-slate-500 mt-0.5">
                  Name the app (e.g. <span className="font-mono text-slate-800">"FamPay Gateway"</span>) and click <strong className="text-slate-800">Create</strong>. Google will display a 16-character code (e.g. <code className="font-mono bg-white px-1.5 py-0.5 border rounded">abcd efgh ijkl mnop</code>).
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Paste in Gateway Settings</h4>
                <p className="text-slate-500 mt-0.5">
                  Paste the 16 characters into the FamPay Verify Gateway Settings tab and click <strong className="text-slate-800">Test Gmail IMAP Connection</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-slate-700">
            <span className="font-bold text-blue-900 block mb-0.5">💡 No Gmail App Password ready yet?</span>
            <p className="text-slate-600 text-xs">
              You can still generate UPI QR codes and verify payments seamlessly using the customer's 12-digit bank UTR / UPI reference number until your Gmail IMAP connection is configured.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
