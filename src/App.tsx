import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { ApiHub } from './components/ApiHub';
import { CheckoutTerminal } from './components/CheckoutTerminal';
import { TransactionLedger } from './components/TransactionLedger';
import { GatewaySettings } from './components/GatewaySettings';
import { AdminConsole } from './components/AdminConsole';
import { LandingPage } from './components/LandingPage';
import { ReceiptModal } from './components/ReceiptModal';
import { ImapGuideModal } from './components/ImapGuideModal';
import { AuthModal } from './components/AuthModal';
import { GatewayConfig, PaymentSession, LedgerStats } from './types';
import { insforge, InsForgeUser } from './lib/insforge';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'api' | 'checkout' | 'ledger' | 'settings' | 'admin'>('landing');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [user, setUser] = useState<InsForgeUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [activeSession, setActiveSession] = useState<PaymentSession | null>(null);
  const [transactions, setTransactions] = useState<PaymentSession[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [receiptSession, setReceiptSession] = useState<PaymentSession | null>(null);
  const [isImapGuideOpen, setIsImapGuideOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user's merchant profile and transactions from InsForge backend
  const fetchUserData = useCallback(async (token?: string) => {
    try {
      const activeToken =
        token ||
        (insforge.auth as any).tokenManager?.getSession()?.accessToken ||
        (window as any).insforgeUserSession?.accessToken ||
        '';

      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      // 1. Fetch Merchant Profile
      const merchantRes = await fetch(activeToken ? '/api/user/merchant' : '/api/gateway/config', { headers });
      if (merchantRes.ok) {
        const merchantData = await merchantRes.json();
        const m = merchantData.merchant || merchantData;
        setConfig({
          merchantUpiId: m.merchantUpiId || m.merchant_upi_id || 'user@fam',
          merchantName: m.merchantName || m.merchant_name || 'My Store',
          gmail: m.gmail || '',
          hasGmailPassword: Boolean(m.hasGmailPassword),
          mode: m.mode || 'simulation',
          enableDynamicAmount: m.enableDynamicAmount ?? m.enable_dynamic_amount ?? true,
          webhookUrl: m.webhookUrl || m.webhook_url || '',
          sessionTimeoutMinutes: m.sessionTimeoutMinutes || m.session_timeout_minutes || 15,
          activeSessionsCount: m.activeSessionsCount || 0,
          apiKey: m.apiKey || m.api_key || 'fp_live_default',
          isAdmin: Boolean(m.isAdmin ?? m.is_admin),
        });
      }

      // 2. Fetch User Payments & Stats
      const paymentsRes = await fetch('/api/user/payments', { headers });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setTransactions(paymentsData.transactions || []);
        setStats(paymentsData.stats || null);
      }
    } catch (err) {
      console.warn('Failed to load user data:', err);
    }
  }, []);

  // Initial authentication check & OAuth callback handling
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        // Check if there is an active user session in InsForge (automatically handles OAuth redirect)
        const { data: authData } = await insforge.auth.getCurrentUser();
        if (authData?.user) {
          const authenticatedUser: InsForgeUser = {
            id: authData.user.id,
            email: authData.user.email,
            name: (authData.user as any).name || (authData.user as any).profile?.name || authData.user.email?.split('@')[0],
          };
          setUser(authenticatedUser);
          const session = (insforge.auth as any).tokenManager?.getSession();
          if (session) {
            (window as any).insforgeUserSession = session;
          }
          await fetchUserData(session?.accessToken);
          setActiveTab('api');
        } else {
          // Unauthenticated public visitor: land on landing page
          setActiveTab('landing');
          await fetchUserData();
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
        await fetchUserData();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const unsubscribe = insforge.auth.onAuthStateChange(async () => {
      const session = (insforge.auth as any).tokenManager?.getSession();
      (window as any).insforgeUserSession = session;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: (session.user as any).name || (session.user as any).profile?.name || session.user.email?.split('@')[0],
        });
        await fetchUserData(session.accessToken);
      } else {
        setUser(null);
        await fetchUserData();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchUserData]);

  const handleSignOut = async () => {
    try {
      await insforge.auth.signOut();
      (window as any).insforgeUserSession = null;
      setUser(null);
      setActiveTab('landing');
      await fetchUserData();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  const handleOpenNewPayment = () => {
    setActiveTab('checkout');
    if (activeSession && (activeSession.status === 'VERIFIED' || activeSession.status === 'EXPIRED')) {
      setActiveSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col lg:flex-row selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        user={user}
        onOpenNewPayment={handleOpenNewPayment}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <TopHeader
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          config={config}
          user={user}
          onOpenNewPayment={handleOpenNewPayment}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Tab Views (Natural full page scrolling, NO inner scrollboxes!) */}
        <main className="flex-1 min-w-0">
          {activeTab === 'landing' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <LandingPage
                user={user}
                config={config}
                onGetStarted={() => {
                  if (user) {
                    setActiveTab('api');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                onOpenTerminal={() => setActiveTab('checkout')}
                onOpenApi={() => setActiveTab('api')}
              />
            </div>
          )}

          {activeTab === 'api' && (
            <ApiHub
              config={config}
              user={user}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onKeyRegenerated={() => fetchUserData()}
            />
          )}

          {activeTab === 'checkout' && (
            <CheckoutTerminal
              config={config}
              activeSession={activeSession}
              setActiveSession={setActiveSession}
              onViewReceipt={(session) => setReceiptSession(session)}
              onSessionUpdated={() => fetchUserData()}
            />
          )}

          {activeTab === 'ledger' && (
            <TransactionLedger
              transactions={transactions}
              stats={stats}
              onRefresh={() => fetchUserData()}
              onViewReceipt={(session) => setReceiptSession(session)}
            />
          )}

          {activeTab === 'settings' && (
            <GatewaySettings
              config={config}
              user={user}
              onConfigUpdated={() => fetchUserData()}
              onOpenImapGuide={() => setIsImapGuideOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'admin' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AdminConsole />
            </div>
          )}
        </main>

        {/* Clean, Non-intrusive Footer */}
        <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500 no-print mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">FamPay SaaS Gateway</span>
              <span className="text-slate-300">·</span>
              <span>Multi-Tenant InsForge BaaS</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <button
                onClick={() => setIsImapGuideOpen(true)}
                className="hover:text-slate-900 transition"
              >
                Gmail IMAP Guide
              </button>
              <a
                href="https://www.npmjs.com/package/fampay-verify"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 transition underline decoration-dotted"
              >
                fampay-verify npm
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal (Sign In, Sign Up, 6-digit Code, Google, GitHub) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          if (activeTab === 'landing') {
            setActiveTab('api');
          }
          fetchUserData();
        }}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        session={receiptSession}
        config={config}
        onClose={() => setReceiptSession(null)}
      />

      {/* IMAP Setup Guide Modal */}
      <ImapGuideModal
        isOpen={isImapGuideOpen}
        onClose={() => setIsImapGuideOpen(false)}
      />
    </div>
  );
}
