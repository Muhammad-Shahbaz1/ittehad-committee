'use client';

import React, { useState } from 'react';
import { X, UserPlus, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from './ToastContext';
import { ParchiData } from './ParchiModal';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (parchi?: ParchiData) => void;
}

interface DependentInput {
  name: string;
  relation: string;
}

export default function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [collectEntryFee, setCollectEntryFee] = useState(true);
  const [dependents, setDependents] = useState<DependentInput[]>([
    { name: '', relation: 'Ahliya (Wife)' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddDependentRow = () => {
    setDependents([...dependents, { name: '', relation: 'Farzand (Son)' }]);
  };

  const handleRemoveDependentRow = (index: number) => {
    setDependents(dependents.filter((_, i) => i !== index));
  };

  const handleDependentChange = (index: number, field: 'name' | 'relation', val: string) => {
    const updated = [...dependents];
    updated[index][field] = val;
    setDependents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const filteredDeps = dependents.filter((d) => d.name.trim() !== '');

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          cnic,
          address,
          dependents: filteredDeps,
          collectEntryFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      showToast(`Member ${name} added successfully!`, 'success');

      let parchiData: ParchiData | undefined;
      if (data.receipt) {
        parchiData = {
          receiptNo: data.receipt.receiptNo,
          memberName: name,
          phone,
          cnic,
          type: 'entry',
          amount: 1000,
          date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        };
      }

      onSuccess(parchiData);
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
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-base">Add New Member (Naya Rukn Shamil Karein)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name (Pura Naam) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Muhammad Aslam"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number (Mobile) *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. 03001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CNIC (Optional)
                </label>
                <input
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="e.g. 42101-1234567-1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Residential Address (Pata)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House # 12, Street 4, Area"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Entry Fee Checkbox */}
          <div className="p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-900">Collect Entry Fee (Rs. 1,000)</p>
              <p className="text-[11px] text-brand-700">Auto-creates Dakhla Fee receipt & credits ledger</p>
            </div>
            <input
              type="checkbox"
              checked={collectEntryFee}
              onChange={(e) => setCollectEntryFee(e.target.checked)}
              className="w-5 h-5 text-brand-600 rounded-lg focus:ring-brand-500 focus:ring-offset-0 cursor-pointer"
            />
          </div>

          {/* Dependents Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Family Dependents (Ahle-Khana)
              </label>
              <button
                type="button"
                onClick={handleAddDependentRow}
                className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Dependent
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {dependents.map((dep, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Dependent Name"
                    value={dep.name}
                    onChange={(e) => handleDependentChange(idx, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Relation (e.g. Wife, Son)"
                    value={dep.relation}
                    onChange={(e) => handleDependentChange(idx, 'relation', e.target.value)}
                    className="w-32 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {dependents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDependentRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex gap-3">
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
                <span>Adding...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
