'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  PlusCircle,
  Share2,
  Calendar,
  User,
  Heart,
  AlertCircle,
  FileText,
  Clock,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import RecordClaimModal from '@/components/RecordClaimModal';
import EditClaimModal from '@/components/EditClaimModal';
import { useToast } from '@/components/ToastContext';
import { formatDeathAnnouncementMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

interface ClaimItem {
  _id: string;
  deceasedName?: string;
  dateOfDeath: string;
  amountPaid: number;
  notes?: string;
  memberId?: {
    _id: string;
    name: string;
    phone: string;
  };
  dependentId?: {
    _id: string;
    name: string;
    relation: string;
  };
}

export default function ClaimsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
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
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimToEdit, setClaimToEdit] = useState<ClaimItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Delete Confirm
  const [claimToDelete, setClaimToDelete] = useState<ClaimItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/claims');
      const data = await res.json();
      if (data.success) {
        setClaims(data.claims || []);
      }
    } catch {
      showToast('Error loading funeral claims', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const totalPayout = claims.reduce((sum, c) => sum + c.amountPaid, 0);

  const handleDeleteClaim = async () => {
    if (!claimToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/claims?id=${claimToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete claim');
      }

      showToast('Claim deleted and fund balance reversed!', 'info');
      setClaimToDelete(null);
      fetchClaims();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting claim';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareAnnouncement = (c: ClaimItem) => {
    const deceased = c.deceasedName || c.dependentId?.name || c.memberId?.name || 'Marhoom';
    const memberName = c.memberId?.name || 'Member Family';
    const relation = c.dependentId?.relation || (c.deceasedName === c.memberId?.name ? 'Member Himself' : 'Family Member');
    const formattedDate = new Date(c.dateOfDeath).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const msg = formatDeathAnnouncementMessage({
      deceasedName: deceased,
      memberName,
      relation,
      dateOfDeath: formattedDate,
      amountPaid: c.amountPaid,
    });

    const url = getWhatsAppShareUrl('', msg);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-rose-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-semibold border border-rose-500/30 mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Kafan-Dafan & Funeral Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Claims & Funeral Disbursals
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Prompt financial support for deceased committee members and registered household dependents.
          </p>
        </div>

        <button
          onClick={() => setClaimModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition transform active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          File Funeral Claim
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Claims Processed</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{claims.length} Claims</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Support Disbursed</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">Rs. {totalPayout.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading funeral claims record...
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Funeral Claims Recorded</h3>
          <p className="text-xs text-slate-500">
            When a death occurs in a member family, record the claim here to disburse fund support.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {claims.map((c) => {
            const deceased = c.deceasedName || c.dependentId?.name || c.memberId?.name || 'Marhoom';
            const relation = c.dependentId?.relation || (c.deceasedName === c.memberId?.name ? 'Member Himself' : 'Family Member');

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-navy-950">Marhoom {deceased}</h3>
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
                          {relation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Member Family: <span className="font-semibold text-slate-800">{c.memberId?.name || 'Shan Khan'}</span> {c.memberId?.phone ? `(${c.memberId.phone})` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 block uppercase">Disbursed</span>
                      <span className="font-black text-rose-700 text-base">
                        Rs. {c.amountPaid.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date of Death: {new Date(c.dateOfDeath).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {c.notes && (
                    <p className="text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600 italic">
                      "{c.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions (Share WhatsApp, Edit, Delete) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleShareAnnouncement(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Announcement
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setClaimToEdit(c);
                        setEditModalOpen(true);
                      }}
                      title="Edit Claim"
                      className="p-2 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition border border-slate-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setClaimToDelete(c)}
                      title="Delete Claim"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {claimToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Funeral Claim?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete claim for <span className="font-bold text-slate-900">Marhoom {claimToDelete.deceasedName}</span>? Disbursed amount of Rs. {claimToDelete.amountPaid.toLocaleString()} fund balance me reverse ho jayegi.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClaimToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteClaim}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={() => fetchClaims()}
      />

      <EditClaimModal
        claim={claimToEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setClaimToEdit(null);
        }}
        onSuccess={() => fetchClaims()}
      />
    </div>
  );
}
