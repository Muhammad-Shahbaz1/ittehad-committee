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
} from 'lucide-react';
import SettingsModal from './SettingsModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string; phone: string } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Check initial online status
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
          // If member tries to access admin-only root pages, redirect to /portal
          if (
            data.user.role === 'member' &&
            ['/', '/members', '/payments', '/claims', '/ledger', '/reports'].includes(pathname)
          ) {
            router.push('/portal');
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAuth();

    // PWA BeforeInstallPrompt listener
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

  // Skip rendering main navigation on /login
  if (pathname === '/login') {
    return null;
  }

  // Strict Role-Based Navigation Items
  const adminNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Payments & Parchi', href: '/payments', icon: Receipt },
    { name: 'Claims', href: '/claims', icon: HeartHandshake },
    { name: 'Fund Ledger', href: '/ledger', icon: BookOpenCheck },
    { name: 'Meeting Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  const memberNavItems = [
    { name: 'My Portal', href: '/portal', icon: UserCheck },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  // If user is logged in as member, show ONLY member items; otherwise if admin show admin items
  const navItems = user?.role === 'member' ? memberNavItems : adminNavItems;

  return (
    <>
      {/* Offline Status Top Bar */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode: Internet disconnected. Showing cached committee data.</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-navy-900 text-white border-b border-navy-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link
              href={user?.role === 'member' ? '/portal' : '/'}
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">IC</span>
              </div>
              <div>
                <div className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                  Ittehad Committee
                  <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">
                    {user?.role === 'member' ? 'Member Portal' : 'PWA'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Welfare & Kafan Dafan Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation (Role-Filtered) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-navy-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons & User Status */}
            <div className="hidden sm:flex items-center gap-2.5">
              {installable && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 rounded-lg hover:bg-brand-500/30 transition shadow-sm animate-pulse"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-1.5">
                  <div
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-2 bg-navy-800/80 px-2.5 py-1.5 rounded-lg border border-navy-700 cursor-pointer hover:bg-navy-700 transition"
                  >
                    {user.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <UserCircle className="w-4 h-4 text-brand-400" />
                    )}
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-[9px] text-slate-400 capitalize">
                        {user.role === 'admin' ? 'Committee Head (Admin)' : 'Verified Member'}
                      </p>
                    </div>
                  </div>

                  {/* Settings Button */}
                  <button
                    onClick={() => setSettingsOpen(true)}
                    title="Account Settings"
                    className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-navy-800 rounded-lg transition"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition shadow-sm"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-1.5">
              {installable && (
                <button
                  onClick={handleInstallClick}
                  className="p-1.5 text-brand-400 hover:bg-navy-800 rounded-lg"
                  title="Install App"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu (Role-Filtered) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-navy-950 border-b border-navy-800 px-4 pt-2 pb-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {user.role === 'admin' ? 'Admin' : 'Member'} • {user.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setSettingsOpen(true);
                      }}
                      className="p-2 bg-navy-800 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold hover:bg-rose-500/30"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-sm"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Settings & Password Change Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />
    </>
  );
}
