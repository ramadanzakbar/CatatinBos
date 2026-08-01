'use client';
import { useState } from 'react';
import { X, QrCode, Copy, Check, ShieldCheck, Download, Share2, Sparkles } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function QRISModal({ isOpen, onClose, title, amount, paymentDetails }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(paymentDetails || 'BCA 1234567890 a.n Catatin');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col items-center">
        {/* Header Bar */}
        <div className="w-full p-4 bg-gradient-to-r from-rose-900/40 via-purple-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <QrCode size={18} />
            </span>
            <span className="font-bold text-sm text-white flex items-center gap-1">
              Pembayaran QRIS Dynamic <Sparkles size={13} className="text-amber-400" />
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* QRIS Display Container */}
        <div className="p-6 flex flex-col items-center w-full space-y-4">
          {/* QRIS Header Mockup */}
          <div className="w-full bg-white text-slate-900 rounded-2xl p-4 flex flex-col items-center border border-slate-200 shadow-xl relative">
            {/* Top QRIS Banner */}
            <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="font-black text-xs text-rose-600 tracking-wider">QRIS</div>
              <div className="text-[10px] font-semibold text-slate-500">GPN • Standar Nasional</div>
            </div>

            <div className="text-center mb-3">
              <div className="text-xs font-bold text-slate-800">{title || 'Pembayaran Patungan Catatin'}</div>
              <div className="text-xl font-black text-rose-600 mt-0.5">{formatIDR(amount)}</div>
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-emerald-500" /> Verifikasi Pembayaran Real-time
              </div>
            </div>

            {/* Generated QR Code SVG */}
            <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center relative">
              <svg className="w-44 h-44 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                {/* Outer positioning squares */}
                <rect x="5" y="5" width="25" height="25" fill="black" />
                <rect x="8" y="8" width="19" height="19" fill="white" />
                <rect x="11" y="11" width="13" height="13" fill="black" />

                <rect x="70" y="5" width="25" height="25" fill="black" />
                <rect x="73" y="8" width="19" height="19" fill="white" />
                <rect x="76" y="11" width="13" height="13" fill="black" />

                <rect x="5" y="70" width="25" height="25" fill="black" />
                <rect x="8" y="73" width="19" height="19" fill="white" />
                <rect x="11" y="76" width="13" height="13" fill="black" />

                {/* Random Data Patterns */}
                <rect x="35" y="10" width="6" height="6" />
                <rect x="45" y="10" width="6" height="6" />
                <rect x="55" y="15" width="6" height="6" />
                <rect x="35" y="25" width="6" height="6" />
                <rect x="50" y="25" width="6" height="6" />
                <rect x="40" y="35" width="6" height="6" />
                <rect x="60" y="35" width="6" height="6" />

                <rect x="10" y="35" width="6" height="6" />
                <rect x="20" y="45" width="6" height="6" />
                <rect x="30" y="50" width="6" height="6" />
                <rect x="15" y="55" width="6" height="6" />

                <rect x="75" y="35" width="6" height="6" />
                <rect x="85" y="45" width="6" height="6" />
                <rect x="70" y="55" width="6" height="6" />

                <rect x="35" y="70" width="6" height="6" />
                <rect x="45" y="75" width="6" height="6" />
                <rect x="55" y="70" width="6" height="6" />
                <rect x="40" y="85" width="6" height="6" />
                <rect x="60" y="85" width="6" height="6" />
                <rect x="75" y="80" width="6" height="6" />
                <rect x="85" y="85" width="6" height="6" />

                {/* Center Catatin Logo Badge */}
                <rect x="40" y="40" width="20" height="20" fill="white" rx="3" />
                <text x="50" y="54" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#2563eb">💰</text>
              </svg>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              NMID: ID102026889421
            </div>
          </div>

          {/* Copy Account Details Bar */}
          <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Transfer Bank / E-Wallet Alternatif:</span>
              <button
                onClick={handleCopyDetails}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition text-[11px]"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <div className="text-xs font-bold text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 font-mono truncate">
              {paymentDetails || 'BCA 1234567890 a.n Catatin'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
