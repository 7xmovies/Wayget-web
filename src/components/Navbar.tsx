import React from 'react';
import { 
  Terminal, 
  Receipt, 
  Sliders, 
  Code2, 
  Sparkles,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { GatewayConfig } from '../types';
import { InsForgeUser } from '../lib/insforge';

interface NavbarProps {
  activeTab: 'api' | 'checkout' | 'ledger' | 'settings' | 'admin';
  setActiveTab: (tab: 'api' | 'checkout' | 'ledger' | 'settings' | 'admin') => void;
  config: GatewayConfig | null;
  user: InsForgeUser | null;
  onOpenNewPayment: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  user,
  onOpenNewPayment,
  onOpenAuth,
  onSignOut,
}) => {
  const isLive = config?.mode === 'live' && config.hasGmailPassword;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <span className="font-extrabold text-base text-slate-950 font-mono tracking-tighter">FP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">FamPay SaaS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">
                  InsForge BaaS
                </span>
              </div>
            </div>
          </div>

          {/* Clean Navigation */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'api'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              API Gateway
            </button>

            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'checkout'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Pay Terminal
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'ledger'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Ledger
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              My Credentials
            </button>

            {config?.isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/60 border border-purple-800/50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                Admin Console
              </button>
            )}
          </nav>

          {/* Right User Actions & Auth Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {isLive ? 'Live IMAP' : 'Sandbox'}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                    {config?.isAdmin && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </span>
                </div>

                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg transition shadow-sm active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              onClick={onOpenNewPayment}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Pay QR</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800/80 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1 whitespace-nowrap rounded-md font-medium ${
              activeTab === 'api' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            API Gateway
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-3 py-1 whitespace-nowrap rounded-md font-medium ${
              activeTab === 'checkout' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Checkout
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1 whitespace-nowrap rounded-md font-medium ${
              activeTab === 'ledger' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 whitespace-nowrap rounded-md font-medium ${
              activeTab === 'settings' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Credentials
          </button>
          {config?.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1 whitespace-nowrap rounded-md font-medium ${
                activeTab === 'admin' ? 'bg-purple-600 text-white font-bold' : 'text-purple-400 border border-purple-800/60'
              }`}
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
