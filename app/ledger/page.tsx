'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  DollarSign,
  Wallet,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';

interface LedgerTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  date: string;
  description: string;
}

interface LedgerSummary {
  totalCredit: number;
  totalDebit: number;
  currentBalance: number;
}

export default function LedgerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
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

  // Delete Confirm
  const [itemToDelete, setItemToDelete] = useState<LedgerTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/ledger?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        setSummary(data.summary || null);
      }
    } catch {
      showToast('Error loading ledger records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [typeFilter]);

  const handleDeleteEntry = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/ledger?id=${itemToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete ledger entry');
      }

      showToast('Ledger entry deleted successfully', 'info');
      setItemToDelete(null);
      fetchLedger();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting entry';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Description', 'Amount (PKR)'];
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString('en-GB'),
      t.type.toUpperCase(),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === 'credit' ? t.amount : -t.amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ittehad_committee_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Ledger exported to CSV successfully!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <BookOpenCheck className="w-6 h-6 text-brand-600" />
            General Fund Ledger (Khaata & Audit)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            100% transparent audit log of all financial inflows and payouts.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition"
        >
          <Download className="w-4 h-4 text-brand-400" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Credits (Inflow)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-800 mt-2">
            Rs. {summary ? summary.totalCredit.toLocaleString() : '0'}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Total Debits (Payouts)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-800 mt-2">
            Rs. {summary ? summary.totalDebit.toLocaleString() : '0'}
          </h3>
        </div>

        <div className="bg-gradient-to-tr from-brand-900 to-navy-950 text-white p-5 rounded-2xl shadow-md border border-brand-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-brand-200">Current Net Balance</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            Rs. {summary ? summary.currentBalance.toLocaleString() : '0'}
          </h3>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm w-fit text-xs font-semibold">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-xl transition ${
            typeFilter === 'all' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Entries ({transactions.length})
        </button>
        <button
          onClick={() => setTypeFilter('credit')}
          className={`px-4 py-2 rounded-xl transition ${
            typeFilter === 'credit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Credits Only (Jama)
        </button>
        <button
          onClick={() => setTypeFilter('debit')}
          className={`px-4 py-2 rounded-xl transition ${
            typeFilter === 'debit' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Debits Only (Kharch)
        </button>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading general ledger records...
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Ledger Records</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-4 sm:px-6">Type</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description / Reference</th>
                  <th className="py-3.5 px-4">Amount (PKR)</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                          t.type === 'credit'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {t.type === 'credit' ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            Credit (Jama)
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            Debit (Kharch)
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-md">
                      {t.description}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm whitespace-nowrap">
                      <span
                        className={t.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'}
                      >
                        {t.type === 'credit' ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setItemToDelete(t)}
                        title="Delete Ledger Entry"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Ledger Entry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-900">{itemToDelete.description}</span>? Fund balance accordingly update ho jayega.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteEntry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
