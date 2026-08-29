'use client';

import React, { useState } from 'react';
import { Key, X, CheckCircle2, Share2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from './ToastContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    _id: string;
    name: string;
    phone: string;
  } | null;
}

export default function ResetPasswordModal({ isOpen, onClose, member }: ResetPasswordModalProps) {
  const { showToast } = useToast();
  const [customPassword, setCustomPassword] = useState('member123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState<{
    newPassword: string;
    whatsAppUrl: string;
    memberName: string;
  } | null>(null);

  if (!isOpen || !member) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member._id,
          customPassword: customPassword.trim() || 'member123',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showToast(`Password reset successfully for ${member.name}`, 'success');
      setResetSuccessData({
        newPassword: data.newPassword,
        whatsAppUrl: data.whatsAppUrl,
        memberName: data.memberName,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error resetting password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setResetSuccessData(null);
    setCustomPassword('member123');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={handleCloseModal}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!resetSuccessData ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy-950">Reset Member Password</h3>
                <p className="text-xs text-slate-500">{member.name} ({member.phone})</p>
              </div>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Set New Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="e.g. member123"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <span className="font-mono font-bold text-slate-700">member123</span>. Member can change this from their Portal settings anytime.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {loading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-navy-950">Password Reset Done!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Password for <span className="font-bold text-slate-800">{resetSuccessData.memberName}</span> is now:
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-base font-black text-brand-700">
                {resetSuccessData.newPassword}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={resetSuccessData.whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Share2 className="w-4 h-4" />
                Send Password on WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
