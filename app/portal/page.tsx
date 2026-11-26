'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Calendar,
  Receipt,
  Heart,
  Wallet,
  Bell,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import ParchiModal, { ParchiData } from '@/components/ParchiModal';
import { formatReceiptWhatsAppMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

interface MemberData {
  _id: string;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  dependents: { _id: string; name: string; relation: string }[];
  payments: {
    _id: string;
    type: 'entry' | 'monthly' | 'extra';
    amount: number;
    date: string;
    receiptNo: string;
    monthCovered?: string;
  }[];
  totalPaid: number;
}

export default function MemberPortalPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeParchi, setActiveParchi] = useState<ParchiData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
          return;
        }
        setAuthChecked(true);
        if (data.user?.memberId) {
          fetch(`/api/members/${data.user.memberId}`)
            .then((r) => r.json())
            .then((mRes) => {
              if (mRes.success) setMember(mRes.member);
            });
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleShareReceipt = (p: MemberData['payments'][0]) => {
    if (!member) return;
    const parchiData: ParchiData = {
      receiptNo: p.receiptNo,
      memberName: member.name,
      phone: member.phone,
      type: p.type,
      amount: p.amount,
      date: new Date(p.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      monthCovered: p.monthCovered,
    };
    const message = formatReceiptWhatsAppMessage(parchiData);
    const url = getWhatsAppShareUrl(member.phone, message);
    window.open(url, '_blank');
  };

  const handleViewReceipt = (p: MemberData['payments'][0]) => {
    if (!member) return;
    const parchiData: ParchiData = {
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
    };
    setActiveParchi(parchiData);
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading Member Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      {/* Member Hero Banner */}
      <div className="bg-gradient-to-r from-brand-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center font-black text-xl">
            {member ? member.name.charAt(0) : 'M'}
          </div>
          <div>
            <h1 className="text-2xl font-black">{member ? member.name : 'Member Portal'}</h1>
            <p className="text-xs text-brand-200 mt-0.5">
              Phone: {member ? member.phone : '-'} • Status:{' '}
              <span className="font-bold text-emerald-300 uppercase">
                {member?.status || 'Active'}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
          <span className="text-[10px] uppercase font-bold text-brand-200 block">Total Contributed</span>
          <span className="text-xl font-black text-white">
            Rs. {member ? member.totalPaid.toLocaleString() : '0'}
          </span>
        </div>
      </div>

      {/* Member Benefits Policy */}
      <div className="bg-white rounded-3xl p-6 border border-brand-200/80 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-navy-950">
          Member Benefits (Kafan-Dafan & Mayet Support)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl">
            <p className="text-[11px] font-bold text-brand-700 uppercase">Mayet Transport</p>
            <p className="text-lg font-black text-navy-950 mt-0.5">Rs. 100,000</p>
            <p className="text-[11px] text-slate-500">Mayet ko lejane ke liye</p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Karachi (Adults)</p>
            <p className="text-lg font-black text-navy-950 mt-0.5">Rs. 20,000</p>
            <p className="text-[11px] text-slate-500">Barhon ke warsa ke liye</p>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-[11px] font-bold text-slate-600 uppercase">Karachi (Children)</p>
            <p className="text-lg font-black text-navy-950 mt-0.5">Rs. 10,000</p>
            <p className="text-[11px] text-slate-500">Bachon ke kafan-dafan ke liye</p>
          </div>
        </div>
      </div>

      {/* Dependents Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Covered Household Dependents
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {member && member.dependents?.length > 0 ? (
            member.dependents.map((d) => (
              <div key={d._id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="font-bold text-sm text-slate-800">{d.name}</p>
                <p className="text-xs text-slate-500 font-medium">{d.relation}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">No dependents listed</p>
          )}
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand-600" />
          My Official Digital Receipts ("Parchi")
        </h3>

        {member && member.payments?.length > 0 ? (
          <div className="space-y-2.5">
            {member.payments.map((p) => (
              <div
                key={p._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-brand-700">{p.receiptNo}</span>
                      <span className="capitalize font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {p.type} {p.monthCovered ? `(${p.monthCovered})` : ''}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      {new Date(p.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                  <span className="font-black text-sm text-slate-900">
                    Rs. {p.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewReceipt(p)}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Parchi
                    </button>
                    <button
                      onClick={() => handleShareReceipt(p)}
                      title="Share to WhatsApp"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">No receipts on record yet.</p>
        )}
      </div>

      <ParchiModal parchi={activeParchi} onClose={() => setActiveParchi(null)} />
    </div>
  );
}
