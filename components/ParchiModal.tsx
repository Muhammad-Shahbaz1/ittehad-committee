'use client';

import React, { useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  CreditCard,
  Building2,
} from 'lucide-react';
import { formatReceiptWhatsAppMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

export interface ParchiData {
  receiptNo: string;
  memberName: string;
  phone: string;
  cnic?: string;
  type: 'entry' | 'monthly' | 'extra';
  amount: number;
  date: string;
  monthCovered?: string;
}

interface ParchiModalProps {
  parchi: ParchiData | null;
  onClose: () => void;
}

export default function ParchiModal({ parchi, onClose }: ParchiModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (parchi) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [parchi, onClose]);

  if (!parchi) return null;

  const typeLabels = {
    entry: 'Dakhla Fee (One-Time Entry Fee)',
    monthly: `Mahana Fee (${parchi.monthCovered || 'Monthly'})`,
    extra: 'Atiya / Voluntary Extra Contribution',
  };

  const handlePrint = () => {
    // Small delay ensures the browser finishes rendering the modal before triggering print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleWhatsAppDirectShare = () => {
    const message = formatReceiptWhatsAppMessage(parchi);
    const url = getWhatsAppShareUrl(parchi.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={(e) => {
        // Close if clicking outside the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto transition-all transform scale-100">
        
        {/* Prominent Floating Close (X) Icon Button */}
        <button
          onClick={onClose}
          aria-label="Close Receipt"
          title="Close (Esc)"
          className="no-print absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition border border-slate-200 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Body */}
        <div id="printable-parchi" ref={receiptRef} className="p-6 sm:p-8 bg-white text-slate-900">
          {/* Islamic Header */}
          <div className="text-center border-b-2 border-dashed border-slate-200 pb-5 pr-8">
            <p className="text-sm font-serif text-slate-600 mb-1">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-brand-700" />
              <h2 className="text-2xl font-black tracking-tight text-navy-950 uppercase">
                ITTEHAD COMMITTEE
              </h2>
            </div>
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-widest">
              Community Welfare & Funeral Support Fund
            </p>
            <div className="inline-block mt-3 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full">
              <p className="text-xs font-bold text-brand-800 tracking-wide">
                RECEIPT NO: <span className="font-mono text-slate-900">{parchi.receiptNo}</span>
              </p>
            </div>
          </div>

          {/* Details Table / Grid */}
          <div className="py-6 space-y-4 text-sm">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span className="font-medium text-xs">Date of Payment:</span>
              </div>
              <span className="font-bold text-slate-900">{parchi.date}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="w-4 h-4 text-slate-400" />
                <span>Member Name:</span>
              </div>
              <span className="font-bold text-base text-navy-950">{parchi.memberName}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Phone:</span>
              </div>
              <span className="font-medium font-mono text-slate-800">{parchi.phone}</span>
            </div>

            {parchi.cnic && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">CNIC:</span>
                <span className="font-mono text-slate-800">{parchi.cnic}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-500">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Payment Category:</span>
              </div>
              <span className="font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg text-xs">
                {typeLabels[parchi.type]}
              </span>
            </div>

            {/* Total Amount Box */}
            <div className="mt-6 bg-gradient-to-r from-brand-900 to-navy-900 text-white rounded-2xl p-5 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-brand-200 font-semibold tracking-wider">Amount Paid (Adaigi)</p>
                <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                  Rs. {parchi.amount.toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                VERIFIED PAID
              </div>
            </div>

            {/* Committee Verification Stamp Effect */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Digitally Verified Document</p>
                <p>Ittehad Welfare Committee Online Portal</p>
              </div>
              <div className="border border-brand-600 text-brand-800 px-3 py-1 rounded rotate-[-4deg] font-bold text-[10px] uppercase bg-brand-50/50">
                Official Parchi
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleWhatsAppDirectShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20"
          >
            <Share2 className="w-4 h-4" />
            Share to WhatsApp
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-sm transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
