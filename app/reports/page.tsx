'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Printer,
  Share2,
  Calendar,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Users,
  HeartHandshake,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

interface ReportPayment {
  _id: string;
  receiptNo: string;
  type: string;
  amount: number;
  date: string;
  monthCovered?: string;
  memberId?: {
    name: string;
    phone: string;
  };
}

interface ReportClaim {
  _id: string;
  deceasedName: string;
  amountPaid: number;
  dateOfDeath: string;
  notes?: string;
  memberId?: {
    name: string;
    phone: string;
  };
}

interface ReportData {
  periodTitle: string;
  summary: {
    totalMembers: number;
    entryFeeTotal: number;
    monthlyFeeTotal: number;
    extraDonationsTotal: number;
    totalInflow: number;
    totalOutflow: number;
    netPeriodBalance: number;
    overallNetBalance: number;
  };
  payments: ReportPayment[];
  claims: ReportClaim[];
}

export default function MeetingReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user role
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else if (data.user?.role !== 'admin') {
          router.push('/portal');
        }
      })
      .catch(() => {});
  }, [router]);

  const months = [
    'all',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedMonth !== 'all') {
        params.append('month', selectedMonth);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReport(data);
      }
    } catch {
      showToast('Error generating financial report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsAppSummary = () => {
    if (!report) return;
    const msg =
      `📋 *ITTEHAD COMMITTEE — FINANCIAL MEETING REPORT*\n` +
      `🗓️ *Period:* ${report.periodTitle}\n` +
      `👥 *Active Members:* ${report.summary.totalMembers}\n\n` +
      `📥 *TOTAL INFLOW (Jama):* Rs. ${report.summary.totalInflow.toLocaleString()}\n` +
      `   • Dakhla Fee: Rs. ${report.summary.entryFeeTotal.toLocaleString()}\n` +
      `   • Mahana Subscription: Rs. ${report.summary.monthlyFeeTotal.toLocaleString()}\n` +
      `   • Atiya / Extra: Rs. ${report.summary.extraDonationsTotal.toLocaleString()}\n\n` +
      `📤 *TOTAL OUTFLOW (Kafan-Dafan Kharch):* Rs. ${report.summary.totalOutflow.toLocaleString()} (${report.claims.length} Claims)\n\n` +
      `💰 *NET SURPLUS/DEFICIT FOR PERIOD:* Rs. ${report.summary.netPeriodBalance.toLocaleString()}\n` +
      `🏦 *CURRENT COMMITTEE NET BALANCE:* Rs. ${report.summary.overallNetBalance.toLocaleString()}\n\n` +
      `_Official Digital Audit Record — Ittehad Committee Welfare Portal_`;

    const url = getWhatsAppShareUrl('', msg);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Top Filter Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
            Committee Meeting Financial Report (Ijlaas Report)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official monthly & annual financial audit sheet with printable signature section.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="all">Full Year (Salana)</option>
            {months.slice(1).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={handleShareWhatsAppSummary}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share WhatsApp
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Main Printable Audit Report Sheet */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-sm">
          Compiling financial meeting report...
        </div>
      ) : report ? (
        <div id="printable-parchi" className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-900">
          
          {/* Formal Islamic & Committee Header */}
          <div className="text-center border-b-2 border-slate-900 pb-6">
            <p className="text-sm font-serif text-slate-600 mb-1">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <Building2 className="w-7 h-7 text-brand-700" />
              <h2 className="text-3xl font-black text-navy-950 uppercase tracking-tight">
                ITTEHAD COMMITTEE WELFARE & FUNERAL FUND
              </h2>
            </div>
            <p className="text-xs font-bold text-brand-800 uppercase tracking-widest">
              General Body & Executive Committee Financial Meeting Report
            </p>
            <div className="mt-3 inline-block px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <p className="text-xs font-bold text-navy-950">
                AUDIT PERIOD: <span className="font-extrabold text-brand-700">{report.periodTitle}</span>
              </p>
            </div>
          </div>

          {/* 4 Core Financial Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Inflow (Jama)</span>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                Rs. {report.summary.totalInflow.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {report.payments.length} Payments Collected
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Funeral Support (Kharch)</span>
              <h3 className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
                Rs. {report.summary.totalOutflow.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {report.claims.length} Death Claims Paid
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Period Net Surplus</span>
              <h3 className={`text-xl sm:text-2xl font-black mt-1 ${
                report.summary.netPeriodBalance >= 0 ? 'text-brand-700' : 'text-rose-700'
              }`}>
                Rs. {report.summary.netPeriodBalance.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Inflow - Outflow</p>
            </div>

            <div className="bg-gradient-to-tr from-brand-900 to-navy-950 text-white p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase text-brand-200 block">Total Net Fund Balance</span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                Rs. {report.summary.overallNetBalance.toLocaleString()}
              </h3>
              <p className="text-[10px] text-brand-300 mt-0.5">{report.summary.totalMembers} Active Families</p>
            </div>
          </div>

          {/* Detailed Inflow Sub-Categories Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Inflow Breakdown by Category (Aamdani ki Tafseel)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Dakhla Fee (One-Time Entry):</span>
                <span className="font-bold text-slate-900">Rs. {report.summary.entryFeeTotal.toLocaleString()}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Mahana Fee (Monthly Subs):</span>
                <span className="font-bold text-slate-900">Rs. {report.summary.monthlyFeeTotal.toLocaleString()}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Atiya / Voluntary Extra:</span>
                <span className="font-bold text-slate-900">Rs. {report.summary.extraDonationsTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Funeral Claims (Outflows) Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <HeartHandshake className="w-4 h-4 text-rose-600" />
              1. Kafan-Dafan & Funeral Support Claims Paid ({report.claims.length})
            </h4>

            {report.claims.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Alhamdulillah, no death claims during this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Marhoom / Deceased Name</th>
                      <th className="py-2.5 px-3">Member Family</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Amount Disbursed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.claims.map((c) => (
                      <tr key={c._id}>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {new Date(c.dateOfDeath).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{c.deceasedName}</td>
                        <td className="py-2 px-3 text-slate-600">{c.memberId?.name || 'Member Family'}</td>
                        <td className="py-2 px-3 text-slate-500 italic">{c.notes || '-'}</td>
                        <td className="py-2 px-3 font-black text-rose-700 text-right whitespace-nowrap">
                          Rs. {c.amountPaid.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Collection Receipts (Inflows) Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Funds Collected & Receipts Issued ({report.payments.length})
            </h4>

            {report.payments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No collections recorded during this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.payments.map((p) => (
                      <tr key={p._id}>
                        <td className="py-2 px-3 font-mono font-bold text-brand-700">{p.receiptNo}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {new Date(p.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{p.memberId?.name || 'Member'}</td>
                        <td className="py-2 px-3 capitalize font-medium">{p.type}</td>
                        <td className="py-2 px-3 text-slate-600">{p.monthCovered || '-'}</td>
                        <td className="py-2 px-3 font-black text-emerald-700 text-right whitespace-nowrap">
                          Rs. {p.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Verification Signatures Section for Printing */}
          <div className="pt-10 border-t-2 border-slate-900 mt-10">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-600 mb-8">
              Verification & Approval of Committee Executive Body
            </p>
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-8">
                <div className="border-b border-slate-400 pb-1"></div>
                <div>
                  <p className="font-bold text-slate-900">Sadr (President)</p>
                  <p className="text-[10px] text-slate-500">Ittehad Welfare Committee</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-b border-slate-400 pb-1"></div>
                <div>
                  <p className="font-bold text-slate-900">General Secretary</p>
                  <p className="text-[10px] text-slate-500">Ittehad Welfare Committee</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-b border-slate-400 pb-1"></div>
                <div>
                  <p className="font-bold text-slate-900">Khazanchi (Treasurer)</p>
                  <p className="text-[10px] text-slate-500">Finance & Audit Record</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
