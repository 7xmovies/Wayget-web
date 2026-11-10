import React from 'react';
import { Menu, Sparkles, LogIn, User } from 'lucide-react';
import { GatewayConfig } from '../types';
import { InsForgeUser } from '../lib/insforge';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  config: GatewayConfig | null;
  user: InsForgeUser | null;
  onOpenNewPayment: () => void;
  onOpenAuth: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  config,
  user,
  onOpenNewPayment,
  onOpenAuth,
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-20 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-mono font-bold text-slate-950 text-xs">
            FP
          </div>
          <span className="font-bold text-sm tracking-tight text-white">FamPay SaaS</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNewPayment}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pay QR</span>
        </button>

        {!user && (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
