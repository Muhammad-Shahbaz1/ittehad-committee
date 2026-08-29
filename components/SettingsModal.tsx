'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
  KeyRound,
} from 'lucide-react';
import { useToast } from './ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; role: string; phone: string } | null;
}

export default function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing password';
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
        <div className="bg-navy-950 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-base">Account Settings & Security</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-navy-900 text-white flex items-center justify-center font-black text-lg shadow-md">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-navy-950">{user.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Phone: {user.phone}</p>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-brand-600" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Change Password (Password Tabdeel Karein)
            </h4>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Password successfully updated! Closing...</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Current Password (Mojooda Password) *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              New Password (Naya Password) *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirm New Password (Dobara Likhein) *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
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
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Updating...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
