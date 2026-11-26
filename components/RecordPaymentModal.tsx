'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from './ToastContext';
import { ParchiData } from './ParchiModal';

interface MemberOption {
  _id: string;
  name: string;
  phone: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (parchi: ParchiData) => void;
  defaultMemberId?: string;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMemberId,
}: RecordPaymentModalProps) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberId, setMemberId] = useState(defaultMemberId || '');
  const [type, setType] = useState<'monthly' | 'entry' | 'extra'>('monthly');
  const [amount, setAmount] = useState<number>(100);
  const [monthCovered, setMonthCovered] = useState<string>(
    new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/members')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.members) {
            setMembers(data.members);
            if (defaultMemberId) {
              setMemberId(defaultMemberId);
            } else if (data.members.length > 0 && !memberId) {
              setMemberId(data.members[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultMemberId]);

  // Update default amount when payment type changes
  const handleTypeChange = (newType: 'monthly' | 'entry' | 'extra') => {
    setType(newType);
    if (newType === 'monthly') {
      setAmount(100);
    } else if (newType === 'entry') {
      setAmount(500);
    } else {
      setAmount(500);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setError('Please select a member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          type,
          amount: Number(amount),
          monthCovered: type === 'monthly' ? monthCovered : undefined,
          date: paymentDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      showToast('Payment recorded and Parchi generated successfully!', 'success');

      // Construct Parchi Data for instant receipt display
      const selectedMember = members.find((m) => m._id === memberId);
      const parchiPayload: ParchiData = {
        receiptNo: data.payment.receiptNo,
        memberName: selectedMember?.name || data.payment.member?.name || 'Member',
        phone: selectedMember?.phone || data.payment.member?.phone || '',
        type,
        amount: Number(amount),
        date: new Date(paymentDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        monthCovered: type === 'monthly' ? monthCovered : undefined,
      };

      onSuccess(parchiPayload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-base">Record Payment (Adaigi Jama Karein)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Member (Rukn) *
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">-- Choose Member --</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Type (Qism) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('monthly')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  type === 'monthly'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Monthly (Rs 100)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('entry')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  type === 'entry'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Entry Fee (Rs 500)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('extra')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  type === 'extra'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Extra / Donation
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amount (Rs.) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={1}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Month Covered (for monthly) */}
          {type === 'monthly' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Month Covered (Khis Maah Ki Fee)
              </label>
              <input
                type="text"
                value={monthCovered}
                onChange={(e) => setMonthCovered(e.target.value)}
                placeholder="e.g. August 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          )}

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-md shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Generate Parchi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
