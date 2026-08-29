'use client';

import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, Share2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useToast } from './ToastContext';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

interface MemberWithDeps {
  _id: string;
  name: string;
  phone: string;
}

interface DependentOption {
  _id: string;
  name: string;
  relation: string;
}

interface RecordClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordClaimModal({ isOpen, onClose, onSuccess }: RecordClaimModalProps) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberWithDeps[]>([]);
  const [memberId, setMemberId] = useState('');
  const [dependents, setDependents] = useState<DependentOption[]>([]);
  const [deceasedType, setDeceasedType] = useState<'member' | 'dependent'>('member');
  const [dependentId, setDependentId] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState<number>(10000);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAnnouncementText, setCreatedAnnouncementText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/members')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.members) {
            setMembers(data.members);
            if (data.members.length > 0 && !memberId) {
              setMemberId(data.members[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, memberId]);

  // Fetch dependents when member changes
  useEffect(() => {
    if (memberId) {
      fetch(`/api/members/${memberId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.member?.dependents) {
            setDependents(data.member.dependents);
            if (data.member.dependents.length > 0) {
              setDependentId(data.member.dependents[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [memberId]);

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
      const selectedMember = members.find((m) => m._id === memberId);
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          dependentId: deceasedType === 'dependent' ? dependentId : null,
          deceasedName: deceasedType === 'member' ? selectedMember?.name : deceasedName,
          dateOfDeath,
          amountPaid: Number(amountPaid) || 0,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record claim');
      }

      showToast('Claim recorded and ledger updated!', 'success');
      setCreatedAnnouncementText(data.whatsAppMessage);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppBroadcast = () => {
    if (createdAnnouncementText) {
      const url = getWhatsAppShareUrl('', createdAnnouncementText);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base">Record Funeral Claim (Kafan Dafan Imdad)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If claim successfully submitted, show WhatsApp Announcement preview */}
        {createdAnnouncementText ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Claim Recorded Successfully!</h4>
            <p className="text-xs text-slate-500">
              Claim amount of Rs. {Number(amountPaid).toLocaleString()} has been debited from the fund ledger.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left font-mono text-xs whitespace-pre-wrap text-slate-700 max-h-56 overflow-y-auto">
              {createdAnnouncementText}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleWhatsAppBroadcast}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Share2 className="w-4 h-4" />
                Share Announcement to WhatsApp
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Main Claim Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Member Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Member Family *
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

            {/* Deceased Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Marhoom (Deceased Individual) *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDeceasedType('member')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    deceasedType === 'member'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Member Himself/Herself
                </button>
                <button
                  type="button"
                  onClick={() => setDeceasedType('dependent')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    deceasedType === 'dependent'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Household Dependent (Ahle Khana)
                </button>
              </div>

              {deceasedType === 'dependent' && (
                <div className="space-y-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {dependents.length > 0 ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Select Registered Dependent:
                      </label>
                      <select
                        value={dependentId}
                        onChange={(e) => setDependentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500"
                      >
                        {dependents.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.relation})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Dependent Name:
                      </label>
                      <input
                        type="text"
                        value={deceasedName}
                        onChange={(e) => setDeceasedName(e.target.value)}
                        placeholder="Enter Deceased Person Name"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date of Death */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Death (Tareekh-e-Wafat) *
              </label>
              <input
                type="date"
                value={dateOfDeath}
                onChange={(e) => setDateOfDeath(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Payout Amount Section with Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payout Amount (Kafan Dafan Imdad / Kharcha)
                </label>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10000, 15000, 20000, 25000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountPaid(preset)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                      amountPaid === preset
                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rs. {preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min={0}
                placeholder="Enter custom amount or 0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-950 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Note: Aap abhi estimated ya fixed imdad darj karein, baad me actual bills ke mutabiq kisi bhi waqt <b>Edit</b> kar sakte hain.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notes / Details (Namaz-e-Janaza / Qabristan)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Namaz-e-Janaza baad Namaz-e-Asar Jama Masjid..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm transition shadow-md shadow-rose-700/30 flex items-center justify-center gap-2"
              >
                {loading ? 'Recording...' : 'Disburse & Record Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
