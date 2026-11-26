'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  HeartHandshake,
  BookOpenCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Download,
  ShieldCheck,
  UserCircle,
  WifiOff,
  UserCheck,
  FileSpreadsheet,
  Settings,
  HandHeart,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import SettingsModal from './SettingsModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string; phone: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const fetchAuth = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (
            data.user.role === 'member' &&
            ['/', '/members', '/payments', '/claims', '/donations', '/ledger', '/reports'].includes(pathname)
          ) {
            router.push('/portal');
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAuth();
    setMobileMenuOpen(false);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallable(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  // On /login, render page directly without sidebar/topbar
  if (pathname === '/login') {
    return <main className="flex-1">{children}</main>;
  }

  const adminNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members (Arkaan)', href: '/members', icon: Users },
    { name: 'Payments & Parchi', href: '/payments', icon: Receipt },
    { name: 'Claims & Benefits', href: '/claims', icon: HeartHandshake },
    { name: 'Donations Fund', href: '/donations', icon: HandHeart },
    { name: 'Fund Ledger', href: '/ledger', icon: BookOpenCheck },
    { name: 'Meeting Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  const memberNavItems = [
    { name: 'My Portal', href: '/portal', icon: UserCheck },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  const navItems = user?.role === 'member' ? memberNavItems : adminNavItems;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Left Sidebar (Desktop Fixed + Mobile Slide-Over) */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-950 text-white border-r border-navy-800/80 shadow-2xl transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-navy-800/80 shrink-0">
          <Link
            href={user?.role === 'member' ? '/portal' : '/'}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="text-white font-black text-base">SB</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-black text-sm leading-tight text-white truncate">
                  Shnai Bunerwal
                </p>
                <p className="text-[10px] text-brand-300 font-semibold truncate">
                  Youth Welfare Org
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vertical Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {user?.role === 'member' ? 'Member Menu' : 'Navigation'}
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  collapsed ? 'lg:justify-center lg:px-0' : ''
                } ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-brand-400/80'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Account Quick Actions */}
        <div className="p-3 border-t border-navy-800/80 space-y-2 shrink-0">
          {user && (
            <button
              onClick={() => setSettingsOpen(true)}
              title="Account Settings"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-navy-900/90 hover:bg-navy-800 border border-navy-800 transition text-left ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <Settings className="w-4 h-4 text-brand-400 shrink-0" />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">Settings</p>
                  <p className="text-[10px] text-slate-400 truncate">Change Password</p>
                </div>
              )}
            </button>
          )}

          {user && (
            <button
              onClick={handleLogout}
              title="Logout"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition text-xs font-bold ${
                collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          )}

          {!collapsed && (
            <p className="text-[10px] text-center text-slate-500 pt-1">
              Shnai Bunerwal Welfare PWA
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area (Top Bar + Page Content) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Offline Status Top Bar */}
        {isOffline && (
          <div className="no-print bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode: Internet disconnected. Showing cached organization data.</span>
          </div>
        )}

        {/* Clean Top Header Bar */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-900 transition shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-navy-900 transition shrink-0"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Organization Full Title */}
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base text-navy-950 truncate">
                Shnai Bunerwal Youth Welfare Organization
              </h2>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200 shrink-0">
                {user?.role === 'member' ? 'Member Portal' : 'Welfare Portal'}
              </span>
            </div>
          </div>

          {/* Right User Status & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {installable && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition shadow-sm"
                title="Install App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                >
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <UserCircle className="w-4 h-4 text-brand-600 shrink-0" />
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-navy-950 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {user.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 pb-16">{children}</main>
      </div>

      {/* Account Settings Modal */}
      {user && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
