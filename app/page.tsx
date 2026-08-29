'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Receipt,
  HeartHandshake,
  UserPlus,
  Clock,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import ParchiModal, { ParchiData } from '@/components/ParchiModal';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import AddMemberModal from '@/components/AddMemberModal';
import RecordClaimModal from '@/components/RecordClaimModal';

interface DashboardStats {
  totalCollected: number;
  thisMonthCollected: number;
  totalPaidOut: number;
  thisMonthPaidOut: number;
  currentBalance: number;
  totalMembers: number;
  activeMembers: number;
  paidMembersCount: number;
  unpaidMembersCount: number;
  currentMonthName: string;
}

interface MonthlyTrendItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface RecentLedgerItem {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendItem[]>([]);
  const [recentLedger, setRecentLedger] = useState<RecentLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Check user role: If member, redirect to /portal
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else if (data.user?.role === 'member') {
          router.push('/portal');
        }
      })
      .catch(() => {});
  }, [router]);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [activeParchi, setActiveParchi] = useState<ParchiData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTrend(data.monthlyTrend || []);
        setRecentLedger(data.recentLedger || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch and auto-seed if empty
    fetch('/api/auth/seed')
      .then(() => fetchDashboardData())
      .catch(() => fetchDashboardData());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Welcome Banner / Header */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-semibold border border-brand-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Ittehad Welfare Committee • Kafan-Dafan Fund
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Financial & Committee Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Real-time digital oversight for membership payments, claims disbursement, and fund transparency.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white text-xs sm:text-sm font-bold rounded-xl border border-navy-700 transition"
          >
            <UserPlus className="w-4 h-4 text-brand-400" />
            Add Member
          </button>
          <button
            onClick={() => setClaimModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-bold rounded-xl transition"
          >
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            File Claim
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Net Fund Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Current Net Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-navy-950">
              Rs. {stats ? stats.currentBalance.toLocaleString() : '0'}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Available in Committee Fund
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Inflow (Jama)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Rs. {stats ? stats.totalCollected.toLocaleString() : '0'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              This Month: <span className="font-bold text-slate-800">Rs. {stats ? stats.thisMonthCollected.toLocaleString() : '0'}</span>
            </p>
          </div>
        </div>

        {/* Total Paid Out (Claims) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Funeral Claims Paid
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Rs. {stats ? stats.totalPaidOut.toLocaleString() : '0'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              This Month: <span className="font-bold text-slate-800">Rs. {stats ? stats.thisMonthPaidOut.toLocaleString() : '0'}</span>
            </p>
          </div>
        </div>

        {/* Active Members & Monthly Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Members (Arkaan)
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats ? stats.activeMembers : 0} <span className="text-sm font-semibold text-slate-400">Families</span>
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                {stats ? stats.paidMembersCount : 0} Paid
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                {stats ? stats.unpaidMembersCount : 0} Unpaid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Income vs Payout Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Income vs Funeral Claims Trend
              </h2>
              <p className="text-xs text-slate-500">Monthly breakdown of collection vs expense</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
              Last 6 Months
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income (Rs.)" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Claims (Rs.)" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading financial chart...
              </div>
            )}
          </div>
        </div>

        {/* Recent Ledger Transactions Feed (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Recent Ledger
              </h2>
              <Link
                href="/ledger"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentLedger.length > 0 ? (
                recentLedger.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'credit'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.type === 'credit' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{item.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-black shrink-0 ${
                        item.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.type === 'credit' ? '+' : '-'} Rs. {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No recent transactions</p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <Link
              href="/payments"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Receipt className="w-4 h-4 text-brand-600" />
              Manage All Payments & Parchis
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(parchi) => {
          fetchDashboardData();
          setActiveParchi(parchi);
        }}
      />

      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onSuccess={(parchi) => {
          fetchDashboardData();
          if (parchi) setActiveParchi(parchi);
        }}
      />

      <RecordClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      {/* Active Parchi Modal */}
      <ParchiModal parchi={activeParchi} onClose={() => setActiveParchi(null)} />
    </div>
  );
}
