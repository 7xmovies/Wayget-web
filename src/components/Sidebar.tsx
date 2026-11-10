import React from 'react';
import { 
  Code2, 
  Terminal, 
  Receipt, 
  Sliders, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  Sparkles, 
  ExternalLink,
  Store,
  ChevronRight,
  ShieldCheck,
  X,
  Home
} from 'lucide-react';
import { GatewayConfig } from '../types';
import { InsForgeUser } from '../lib/insforge';

interface SidebarProps {
  activeTab: 'landing' | 'api' | 'checkout' | 'ledger' | 'settings' | 'admin';
  setActiveTab: (tab: 'landing' | 'api' | 'checkout' | 'ledger' | 'settings' | 'admin') => void;
  config: GatewayConfig | null;
  user: InsForgeUser | null;
  onOpenNewPayment: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  config,
  user,
  onOpenNewPayment,
  onOpenAuth,
  onSignOut,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const isLive = config?.hasGmailPassword;

  const navItems = [
    {
      id: 'landing' as const,
      label: 'Home & Overview',
      description: 'Platform & Architecture',
      icon: Home,
    },
    {
      id: 'api' as const,
      label: 'API Gateway',
      description: 'Endpoints, Keys & SDK',
      icon: Code2,
    },
    {
      id: 'checkout' as const,
      label: 'Pay Terminal',
      description: 'Generate UPI QR & Pay',
      icon: Terminal,
    },
    {
      id: 'ledger' as const,
      label: 'Transactions',
      description: 'Payment Records & UTR',
      icon: Receipt,
    },
    {
      id: 'settings' as const,
      label: 'Credentials',
      description: 'UPI ID & Gmail IMAP',
      icon: Sliders,
    },
  ];

  const handleSelectTab = (tab: 'landing' | 'api' | 'checkout' | 'ledger' | 'settings' | 'admin') => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-white select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <span className="font-extrabold text-base text-slate-950 font-mono tracking-tighter">FP</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white truncate">FamPay SaaS</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">UPI & IMAP Gateway</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Merchant Quick Banner */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            {user ? 'My Store' : 'Public Gateway'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${user && isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {user ? (isLive ? 'IMAP Live' : 'Active') : 'Demo Mode'}
            </span>
          </div>
        </div>
        <p className="font-semibold text-white text-sm truncate">
          {user ? (config?.merchantName || 'My Store') : 'FamPay Demo'}
        </p>
        <p className="text-xs font-mono text-amber-400/90 truncate mt-0.5">
          {user ? (config?.merchantUpiId || 'user@fam') : 'Sign in to connect UPI'}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Core Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight">{item.label}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-slate-900/80 font-normal' : 'text-slate-500'}`}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}

        {/* Admin Console Nav Item - Strictly protected: NEVER displayed to public or unauthenticated visitors */}
        {Boolean(user && config?.isAdmin) && (
          <div className="pt-3">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-400">
              Administration
            </div>
            <button
              onClick={() => handleSelectTab('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all group ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/60 border border-purple-900/40'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'admin' ? 'text-white' : 'text-purple-400'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold leading-tight">Admin Console</div>
                <div className={`text-[10px] truncate ${activeTab === 'admin' ? 'text-purple-200' : 'text-purple-400/80'}`}>
                  Tenants, Volume & Audit
                </div>
              </div>
            </button>
          </div>
        )}
      </nav>

      {/* Quick Action Button */}
      <div className="p-3 border-t border-slate-800/60">
        <button
          onClick={() => {
            onOpenNewPayment();
            setIsMobileOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Payment QR</span>
        </button>
      </div>

      {/* User / Authentication Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.name || user.email?.split('@')[0]}
                </p>
                {config?.isAdmin && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            <button
              onClick={onSignOut}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onOpenAuth();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <LogIn className="w-3.5 h-3.5 text-amber-400" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
