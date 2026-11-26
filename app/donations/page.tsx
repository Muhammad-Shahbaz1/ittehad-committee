'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HandHeart,
  PlusCircle,
  MinusCircle,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Trash2,
  Share2,
  X,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

interface DonationRecord {
  _id: string;
  type: 'inflow' | 'aid';
  personName: string;
  phone?: string;
  cnic?: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  receiptNo: string;
}

interface DonationSummary {
  totalDonationsIn: number;
  totalMustaheqeenAid: number;
  donationFundBalance: number;
}

export default function DonationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [records, setRecords] = useState<DonationRecord[]>([]);
  const [summary, setSummary] = useState<DonationSummary>({
    totalDonationsIn: 0,
    totalMustaheqeenAid: 0,
    donationFundBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inflow' | 'aid'>('all');
  const [search, setSearch] = useState('');

  // Modal state
  const [modalType, setModalType] = useState<'inflow' | 'aid' | null>(null);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [category, setCategory] = useState('General Donation');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [recordToDelete, setRecordToDelete] = useState<DonationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else if (data.user?.role !== 'admin') {
          router.push('/portal');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/donations');
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setSummary(data.summary || { totalDonationsIn: 0, totalMustaheqeenAid: 0, donationFundBalance: 0 });
      }
    } catch {
      showToast('Failed to load donation records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchDonations();
    }
  }, [authChecked]);

  const openModal = (type: 'inflow' | 'aid') => {
    setModalType(type);
    setPersonName('');
    setPhone('');
    setCnic('');
    setCategory(type === 'inflow' ? 'General Donation' : 'Ration / Food Aid');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalType,
          personName,
          phone,
          cnic,
          category,
          amount: Number(amount),
          date,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save record');

      showToast(
        modalType === 'inflow'
          ? 'Donation collected and added to Mustaheqeen fund!'
          : 'Mustaheqeen aid disbursed and recorded!',
        'success'
      );
      setModalType(null);
      fetchDonations();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error saving record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/donations?id=${recordToDelete._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      showToast('Record deleted successfully', 'info');
      setRecordToDelete(null);
      fetchDonations();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete error', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareWhatsApp = (r: DonationRecord) => {
    const formattedDate = new Date(r.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const msg =
      r.type === 'inflow'
        ? `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION*\n*DONATION RECEIPT (MUSTAHEQEEN FUND)*\n━━━━━━━━━━━━━━━━━━━━\n📄 *Receipt No:* ${r.receiptNo}\n👤 *Donor Name:* ${r.personName}\n🏷️ *Category:* ${r.category}\n💰 *Donation Amount:* Rs. ${r.amount.toLocaleString()}\n📅 *Date:* ${formattedDate}\n━━━━━━━━━━━━━━━━━━━━\n🤲 _JazakAllah Khair! Aapka atiya mustaheqeen ki madad ke liye mehfooz kar liya gaya hai._`
        : `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION*\n*MUSTAHEQEEN IMDAD RECORD*\n━━━━━━━━━━━━━━━━━━━━\n📄 *Voucher No:* ${r.receiptNo}\n👤 *Mustaheq Name:* ${r.personName}\n🏷️ *Aid Category:* ${r.category}\n💰 *Imdad Amount:* Rs. ${r.amount.toLocaleString()}\n📅 *Date:* ${formattedDate}\n━━━━━━━━━━━━━━━━━━━━\n_Shnai Bunerwal Youth Welfare Organization Mustaheqeen Fund_`;

    window.open(getWhatsAppShareUrl(r.phone || '', msg), '_blank');
  };

  const filteredRecords = records.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.personName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.receiptNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!authChecked) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Verifying Access...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-semibold border border-brand-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Separate Charity & Welfare Pool
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <HandHeart className="w-7 h-7 text-brand-400" />
            Donations & Mustaheqeen Fund
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Alag donation fund jo mustaheqeen (deserving families, rashan, medical & financial aid) ke liye jama aur kharch kiya jata hai.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => openModal('inflow')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Collect Donation (Jama)
          </button>
          <button
            onClick={() => openModal('aid')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm rounded-xl transition transform active:scale-95"
          >
            <MinusCircle className="w-4 h-4 text-amber-300" />
            Give Mustaheqeen Aid
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Donations Collected (Jama)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              Rs. {summary.totalDonationsIn.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mustaheqeen Aid Given</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              Rs. {summary.totalMustaheqeenAid.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-navy-900 to-brand-900 p-5 rounded-2xl text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-wider">Available Donation Balance</p>
            <h3 className="text-2xl font-black text-white mt-1">
              Rs. {summary.donationFundBalance.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 text-brand-300 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by donor/mustaheq name, category, or receipt #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition ${
              filter === 'all' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            All Records
          </button>
          <button
            onClick={() => setFilter('inflow')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition ${
              filter === 'inflow' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Donations (Jama)
          </button>
          <button
            onClick={() => setFilter('aid')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg transition ${
              filter === 'aid' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Mustaheqeen Aid
          </button>
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading donation & mustaheqeen records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <HandHeart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Donation Records Found</h3>
          <p className="text-xs text-slate-500">
            Collect donations or record Mustaheqeen aid using the buttons above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          r.type === 'inflow'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {r.type === 'inflow' ? 'Donation Jama' : 'Mustaheq Aid'}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-500">{r.receiptNo}</span>
                    </div>
                    <h3 className="font-black text-base text-navy-950 mt-1">{r.personName}</h3>
                    <p className="text-xs text-slate-500">
                      Category: <span className="font-semibold text-slate-700">{r.category}</span>
                      {r.phone ? ` • ${r.phone}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {r.type === 'inflow' ? 'Received' : 'Given'}
                    </span>
                    <span
                      className={`font-black text-lg ${
                        r.type === 'inflow' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {r.type === 'inflow' ? '+' : '-'} Rs. {r.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(r.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {r.notes && (
                  <p className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 italic">"{r.notes}"</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleShareWhatsApp(r)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share WhatsApp
                </button>
                <button
                  onClick={() => setRecordToDelete(r)}
                  title="Delete Record"
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Donation / Aid Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base">
                  {modalType === 'inflow' ? 'Collect Donation (Jama)' : 'Give Mustaheqeen Aid (Imdad)'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {modalType === 'inflow' ? 'Donor Name *' : 'Mustaheq / Beneficiary Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder={modalType === 'inflow' ? 'e.g. Haji Akbar Khan' : 'e.g. Widow / Needy Family Name'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {modalType === 'inflow' ? (
                      <>
                        <option value="General Donation">General Donation</option>
                        <option value="Zakat">Zakat</option>
                        <option value="Sadaqah">Sadaqah</option>
                        <option value="Fitrana / Khairat">Fitrana / Khairat</option>
                      </>
                    ) : (
                      <>
                        <option value="Ration / Food Aid">Ration / Food Aid</option>
                        <option value="Medical / Treatment">Medical / Treatment</option>
                        <option value="Cash Assistance">Cash Assistance</option>
                        <option value="Education / Marriage Aid">Education / Marriage Aid</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-950 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Purpose (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-md shadow-brand-600/30"
                >
                  {submitting ? 'Saving...' : modalType === 'inflow' ? 'Save Donation' : 'Disburse Aid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Delete <span className="font-bold text-slate-900">{recordToDelete.receiptNo}</span> ({recordToDelete.personName} — Rs. {recordToDelete.amount.toLocaleString()})?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
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
