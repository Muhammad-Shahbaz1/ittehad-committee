'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Share2,
  Calendar,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Receipt,
  Edit,
  AlertTriangle,
  X,
  Key,
} from 'lucide-react';
import AddMemberModal from '@/components/AddMemberModal';
import EditMemberModal from '@/components/EditMemberModal';
import RecordPaymentModal from '@/components/RecordPaymentModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import ParchiModal, { ParchiData } from '@/components/ParchiModal';
import { useToast } from '@/components/ToastContext';
import { formatMonthlyReminderMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

interface DependentItem {
  _id: string;
  name: string;
  relation: string;
}

interface PaymentHistoryItem {
  _id: string;
  type: 'entry' | 'monthly' | 'extra';
  amount: number;
  date: string;
  receiptNo: string;
  monthCovered?: string;
}

interface MemberItem {
  _id: string;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  isPaidForMonth: boolean;
  dependentsCount: number;
}

export default function MembersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [loading, setLoading] = useState(true);
  const [targetMonth, setTargetMonth] = useState('');

  const [authChecked, setAuthChecked] = useState(false);

  // Check user role
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
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  // Expandable Member Details state
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [memberDetails, setMemberDetails] = useState<{
    dependents: DependentItem[];
    payments: PaymentHistoryItem[];
    totalPaid: number;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Dependent input inside expanded card
  const [newDepName, setNewDepName] = useState('');
  const [newDepRelation, setNewDepRelation] = useState('Farzand (Son)');

  // Modals
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<MemberItem | null>(null);

  // Reset Password Modal
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [memberForPasswordReset, setMemberForPasswordReset] = useState<MemberItem | null>(null);

  // Delete Member Confirm Dialog
  const [memberToDelete, setMemberToDelete] = useState<MemberItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<string | undefined>(undefined);
  const [activeParchi, setActiveParchi] = useState<ParchiData | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setTargetMonth(data.targetMonth || '');
      }
    } catch {
      showToast('Error loading members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const toggleExpandMember = async (memberId: string) => {
    if (expandedMemberId === memberId) {
      setExpandedMemberId(null);
      setMemberDetails(null);
      return;
    }

    setExpandedMemberId(memberId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/members/${memberId}`);
      const data = await res.json();
      if (data.success && data.member) {
        setMemberDetails({
          dependents: data.member.dependents || [],
          payments: data.member.payments || [],
          totalPaid: data.member.totalPaid || 0,
        });
      }
    } catch {
      showToast('Error fetching member details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddDependent = async (memberId: string) => {
    if (!newDepName.trim()) return;

    try {
      const res = await fetch('/api/dependents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          name: newDepName.trim(),
          relation: newDepRelation.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Dependent added successfully', 'success');
        setNewDepName('');
        // Refresh details
        toggleExpandMember(memberId);
        // Refresh count
        fetchMembers();
      }
    } catch {
      showToast('Failed to add dependent', 'error');
    }
  };

  const handleDeleteDependent = async (depId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/dependents?id=${depId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Dependent removed', 'info');
        toggleExpandMember(memberId);
        fetchMembers();
      }
    } catch {
      showToast('Failed to delete dependent', 'error');
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/members/${memberToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }

      showToast(`Member ${memberToDelete.name} deleted successfully!`, 'info');
      setMemberToDelete(null);
      if (expandedMemberId === memberToDelete._id) {
        setExpandedMemberId(null);
      }
      fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting member';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendReminder = (m: MemberItem) => {
    const text = formatMonthlyReminderMessage({
      memberName: m.name,
      phone: m.phone,
      month: targetMonth || 'This Month',
      amount: 300,
    });
    const url = getWhatsAppShareUrl(m.phone, text);
    window.open(url, '_blank');
  };

  const filteredMembers = members.filter((m) => {
    if (paidFilter === 'paid') return m.isPaidForMonth;
    if (paidFilter === 'unpaid') return !m.isPaidForMonth;
    return true;
  });

  if (!authChecked) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading Members...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-600" />
            Committee Members (Arkaan)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered families, household dependents, and monthly status for {targetMonth}.
          </p>
        </div>

        <button
          onClick={() => setAddMemberOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-600/30 transition transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add New Member
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Paid / Unpaid Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPaidFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                paidFilter === 'all' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setPaidFilter('paid')}
              className={`px-3 py-1 rounded-lg transition ${
                paidFilter === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              Paid ({members.filter((m) => m.isPaidForMonth).length})
            </button>
            <button
              onClick={() => setPaidFilter('unpaid')}
              className={`px-3 py-1 rounded-lg transition ${
                paidFilter === 'unpaid' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700'
              }`}
            >
              Unpaid ({members.filter((m) => !m.isPaidForMonth).length})
            </button>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm">
          Loading committee members...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Members Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or add a new member.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const isExpanded = expandedMemberId === member._id;

            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-300 transition overflow-hidden"
              >
                {/* Main Member Summary Row */}
                <div
                  onClick={() => toggleExpandMember(member._id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-800 to-navy-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-navy-950">{member.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {member.phone}
                        </span>
                        {member.cnic && (
                          <span className="hidden sm:inline font-mono">
                            CNIC: {member.cnic}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-brand-700 font-semibold">
                          <Heart className="w-3 h-3 text-rose-500" />
                          {member.dependentsCount} Dependents
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Action Pill */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Monthly Paid / Unpaid Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide ${
                          member.isPaidForMonth
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {member.isPaidForMonth ? '✓ PAID' : '✕ UNPAID'}
                      </span>

                      {!member.isPaidForMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendReminder(member);
                          }}
                          title="Send WhatsApp Reminder"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs flex items-center gap-1 transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Remind</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Pay Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMemberForPayment(member._id);
                        setPaymentModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                      Pay
                    </button>

                    {/* Quick Reset Password Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberForPasswordReset(member);
                        setResetPasswordModalOpen(true);
                      }}
                      title="Reset Member Password"
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    {/* Quick Edit Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberToEdit(member);
                        setEditMemberModalOpen(true);
                      }}
                      title="Edit Member"
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Quick Delete Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberToDelete(member);
                      }}
                      title="Delete Member"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Member Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-5 text-xs">
                    {loadingDetails ? (
                      <p className="text-center py-4 text-slate-400">Loading details...</p>
                    ) : (
                      <>
                        {/* Member Metadata Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span>
                            <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {member.address || 'Not Provided'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Join Date</span>
                            <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {new Date(member.joinDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Contributed</span>
                            <span className="font-black text-brand-700 text-sm mt-0.5 block">
                              Rs. {memberDetails?.totalPaid.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setMemberForPasswordReset(member);
                                setResetPasswordModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg flex items-center gap-1"
                            >
                              <Key className="w-3.5 h-3.5" />
                              Reset Pass
                            </button>
                            <button
                              onClick={() => {
                                setMemberToEdit(member);
                                setEditMemberModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Profile
                            </button>
                            <button
                              onClick={() => setMemberToDelete(member)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Registered Dependents Section */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <Heart className="w-4 h-4 text-rose-500" />
                              Covered Household Dependents ({memberDetails?.dependents.length || 0})
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {memberDetails?.dependents.map((dep) => (
                              <div
                                key={dep._id}
                                className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                              >
                                <div>
                                  <p className="font-bold text-slate-800">{dep.name}</p>
                                  <p className="text-[10px] text-slate-500">{dep.relation}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteDependent(dep._id, member._id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add Dependent Inline Form */}
                          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              placeholder="New Dependent Name"
                              value={newDepName}
                              onChange={(e) => setNewDepName(e.target.value)}
                              className="w-full sm:flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Relation (e.g. Son, Wife)"
                              value={newDepRelation}
                              onChange={(e) => setNewDepRelation(e.target.value)}
                              className="w-full sm:w-40 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <button
                              onClick={() => handleAddDependent(member._id)}
                              className="w-full sm:w-auto px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Payment Receipts History */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-brand-600" />
                            Recent Payment Parchis ({memberDetails?.payments.length || 0})
                          </h4>

                          {memberDetails && memberDetails.payments.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                                    <th className="pb-2">Receipt #</th>
                                    <th className="pb-2">Date</th>
                                    <th className="pb-2">Category</th>
                                    <th className="pb-2">Month</th>
                                    <th className="pb-2">Amount</th>
                                    <th className="pb-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {memberDetails.payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-50">
                                      <td className="py-2 font-mono font-bold text-brand-700">{p.receiptNo}</td>
                                      <td className="py-2 text-slate-600">
                                        {new Date(p.date).toLocaleDateString('en-GB', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </td>
                                      <td className="py-2 capitalize font-medium">{p.type}</td>
                                      <td className="py-2 text-slate-600">{p.monthCovered || '-'}</td>
                                      <td className="py-2 font-bold text-slate-900">Rs. {p.amount.toLocaleString()}</td>
                                      <td className="py-2 text-right">
                                        <button
                                          onClick={() =>
                                            setActiveParchi({
                                              receiptNo: p.receiptNo,
                                              memberName: member.name,
                                              phone: member.phone,
                                              cnic: member.cnic,
                                              type: p.type,
                                              amount: p.amount,
                                              date: new Date(p.date).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              }),
                                              monthCovered: p.monthCovered,
                                            })
                                          }
                                          className="text-xs font-bold text-brand-600 hover:text-brand-800 underline"
                                        >
                                          View Parchi
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-2">No payments recorded yet.</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-900">{memberToDelete.name}</span>? Unke registered dependents aur login access bhi delete ho jayenge.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteMember}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSuccess={(parchi) => {
          fetchMembers();
          if (parchi) setActiveParchi(parchi);
        }}
      />

      <EditMemberModal
        member={memberToEdit}
        isOpen={editMemberModalOpen}
        onClose={() => {
          setEditMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        onSuccess={() => {
          fetchMembers();
          if (expandedMemberId) toggleExpandMember(expandedMemberId);
        }}
      />

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedMemberForPayment(undefined);
        }}
        defaultMemberId={selectedMemberForPayment}
        onSuccess={(parchi) => {
          fetchMembers();
          if (expandedMemberId) toggleExpandMember(expandedMemberId);
          setActiveParchi(parchi);
        }}
      />

      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setMemberForPasswordReset(null);
        }}
        member={memberForPasswordReset}
      />

      <ParchiModal parchi={activeParchi} onClose={() => setActiveParchi(null)} />
    </div>
  );
}

