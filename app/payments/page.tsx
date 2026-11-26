'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Search,
  PlusCircle,
  Share2,
  Calendar,
  User,
  Filter,
  Download,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import ParchiModal, { ParchiData } from '@/components/ParchiModal';
import { formatReceiptWhatsAppMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

interface PaymentItem {
  _id: string;
  type: 'entry' | 'monthly' | 'extra';
  amount: number;
  date: string;
  receiptNo: string;
  monthCovered?: string;
  memberId?: {
    _id: string;
    name: string;
    phone: string;
    cnic?: string;
    address?: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState('');
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

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [activeParchi, setActiveParchi] = useState<ParchiData | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [typeFilter]);

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    const memName = p.memberId?.name?.toLowerCase() || '';
    const recNo = p.receiptNo?.toLowerCase() || '';
    const phone = p.memberId?.phone || '';
    return memName.includes(term) || recNo.includes(term) || phone.includes(term);
  });

  const totalAmountInView = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleShareWhatsApp = (p: PaymentItem) => {
    const parchiData: ParchiData = {
      receiptNo: p.receiptNo,
      memberName: p.memberId?.name || 'Member',
      phone: p.memberId?.phone || '',
      type: p.type,
      amount: p.amount,
      date: new Date(p.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      monthCovered: p.monthCovered,
    };

    const message = formatReceiptWhatsAppMessage(parchiData);
    const url = getWhatsAppShareUrl(parchiData.phone, message);
    window.open(url, '_blank');
  };

  const handleViewReceipt = (p: PaymentItem) => {
    const parchiData: ParchiData = {
      receiptNo: p.receiptNo,
      memberName: p.memberId?.name || 'Member',
      phone: p.memberId?.phone || '',
      cnic: p.memberId?.cnic,
      type: p.type,
      amount: p.amount,
      date: new Date(p.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      monthCovered: p.monthCovered,
    };
    setActiveParchi(parchiData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-600" />
            Payments & Digital Receipts ("Parchi")
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of entry fees, monthly subscriptions, and extra donations.
          </p>
        </div>

        <button
          onClick={() => setRecordModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/30 transition transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Record New Payment
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt #, member name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                typeFilter === 'all' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Payments
            </button>
            <button
              onClick={() => setTypeFilter('monthly')}
              className={`px-3 py-1 rounded-lg transition ${
                typeFilter === 'monthly' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Monthly (Rs 100)
            </button>
            <button
              onClick={() => setTypeFilter('entry')}
              className={`px-3 py-1 rounded-lg transition ${
                typeFilter === 'entry' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Entry (Rs 500)
            </button>
            <button
              onClick={() => setTypeFilter('extra')}
              className={`px-3 py-1 rounded-lg transition ${
                typeFilter === 'extra' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Extra / Donation
            </button>
          </div>

          <span className="text-xs font-bold text-slate-700 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200">
            Total: Rs. {totalAmountInView.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payments Table / Card List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading receipts and payment ledger...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Payments Found</h3>
          <p className="text-xs text-slate-500">Record a new payment to generate the first digital receipt.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3.5 px-4 sm:px-6">Receipt No</th>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Month Covered</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-brand-700">
                      {p.receiptNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-navy-950">{p.memberId?.name || 'Member'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.memberId?.phone || '-'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.type === 'entry'
                            ? 'bg-purple-100 text-purple-800'
                            : p.type === 'monthly'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.monthCovered || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(p.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      Rs. {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReceipt(p)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Parchi
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(p)}
                          title="Share to WhatsApp"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordPaymentModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSuccess={(parchi) => {
          fetchPayments();
          setActiveParchi(parchi);
        }}
      />

      <ParchiModal parchi={activeParchi} onClose={() => setActiveParchi(null)} />
    </div>
  );
}
