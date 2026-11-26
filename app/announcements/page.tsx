'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  PlusCircle,
  Share2,
  Calendar,
  Trash2,
  Sparkles,
  AlertTriangle,
  HeartHandshake,
  CheckCircle,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ToastContext';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

interface AnnouncementItem {
  _id: string;
  title?: string;
  message: string;
  type: 'death' | 'reminder' | 'general';
  date: string;
  createdBy: string;
}

export default function AnnouncementsPage() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Announcement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'general' | 'death' | 'reminder'>('general');
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch {
      showToast('Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Announcement posted successfully!', 'success');
        setTitle('');
        setMessage('');
        setIsModalOpen(false);
        fetchAnnouncements();
      }
    } catch {
      showToast('Failed to post announcement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Announcement deleted', 'info');
        fetchAnnouncements();
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleWhatsAppShare = (a: AnnouncementItem) => {
    const formatted = `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION — ANNOUNCEMENT*
━━━━━━━━━━━━━━━━━━━━
📢 *${a.title || 'Important Notice'}*

${a.message}

📅 Date: ${new Date(a.date).toLocaleDateString('en-GB')}
━━━━━━━━━━━━━━━━━━━━
_Shnai Bunerwal Youth Welfare Organization Management_`;

    const url = getWhatsAppShareUrl('', formatted);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-600" />
            Announcements & Notices (Ilaanat)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast emergency alerts, funeral updates, and committee news directly to members.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/30 transition transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading notice board...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Announcements Yet</h3>
          <p className="text-xs text-slate-500">Post an update to keep members informed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              className={`rounded-3xl p-6 border transition shadow-sm ${
                a.type === 'death'
                  ? 'bg-rose-50/50 border-rose-200'
                  : a.type === 'reminder'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        a.type === 'death'
                          ? 'bg-rose-100 text-rose-800'
                          : a.type === 'reminder'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-brand-100 text-brand-800'
                      }`}
                    >
                      {a.type === 'death'
                        ? 'Ilaan-e-Wafat'
                        : a.type === 'reminder'
                        ? 'Monthly Reminder'
                        : 'General Notice'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(a.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {a.title && (
                    <h3 className="text-lg font-bold text-navy-950">{a.title}</h3>
                  )}

                  <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {a.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleWhatsAppShare(a)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>

                  <button
                    onClick={() => handleDeleteAnnouncement(a._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base">New Announcement (Naya Ilaan)</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Type of Notice
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'general' | 'death' | 'reminder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="general">General Committee Notice</option>
                  <option value="reminder">Monthly Fee Due Reminder</option>
                  <option value="death">Condolence / Death Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title (Unwan)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Committee Meeting / Mahana Chanda Reminder"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Content (Paigham) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write notice details here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md"
                >
                  {saving ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
