'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, HeartHandshake, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from './ToastContext';

interface EditClaimModalProps {
  claim: {
    _id: string;
    deceasedName?: string;
    dateOfDeath: string;
    amountPaid: number;
    notes?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditClaimModal({
  claim,
  isOpen,
  onClose,
  onSuccess,
}: EditClaimModalProps) {
  const { showToast } = useToast();
  const [deceasedName, setDeceasedName] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(10000);
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (claim) {
      setDeceasedName(claim.deceasedName || '');
      setAmountPaid(claim.amountPaid || 10000);
      setDateOfDeath(
        claim.dateOfDeath ? new Date(claim.dateOfDeath).toISOString().split('T')[0] : ''
      );
      setNotes(claim.notes || '');
      setError('');
    }
  }, [claim]);

  if (!isOpen || !claim) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: claim._id,
          deceasedName,
          amountPaid: Number(amountPaid),
          dateOfDeath,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update claim');
      }

      showToast('Claim updated successfully!', 'success');
      onSuccess();
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
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base">Edit Funeral Claim</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Marhoom Name (Deceased Individual) *
            </label>
            <input
              type="text"
              required
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payout Amount (Rs.) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-950 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Death *
              </label>
              <input
                type="date"
                required
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Update Claim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
