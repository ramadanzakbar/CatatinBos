'use client';
import { useState, useEffect } from 'react';
import { X, Users, Share2, DollarSign, Percent, Check, Plus, Trash2, CreditCard, MessageSquare, Sparkles } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function SplitBillModal({ isOpen, onClose, onTransactionAdded }) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('0');
  const [servicePercent, setServicePercent] = useState('0');
  const [paymentDetails, setPaymentDetails] = useState('BCA 1234567890 a.n Catatin');
  const [participants, setParticipants] = useState([
    { name: 'Saya', phone: '', paid: true },
    { name: 'Budi', phone: '', paid: false },
    { name: 'Ani', phone: '', paid: false },
  ]);
  const [savedSplitBills, setSavedSplitBills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchSplitBills();
  }, [isOpen]);

  const fetchSplitBills = async () => {
    try {
      const res = await fetch('/api/split-bill');
      const data = await res.json();
      if (data.success) setSavedSplitBills(data.splitBills || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const rawAmount = parseFloat(totalAmount || 0);
  const taxVal = (rawAmount * parseFloat(taxPercent || 0)) / 100;
  const serviceVal = (rawAmount * parseFloat(servicePercent || 0)) / 100;
  const grandTotal = rawAmount + taxVal + serviceVal;

  const validParticipants = participants.filter((p) => p.name.trim() !== '');
  const perPersonAmount = validParticipants.length > 0 ? grandTotal / validParticipants.length : 0;

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: '', phone: '', paid: false }]);
  };

  const handleRemoveParticipant = (idx) => {
    setParticipants(participants.filter((_, i) => i !== idx));
  };

  const handleSaveSplitBill = async () => {
    if (!title || !totalAmount || validParticipants.length === 0) return;
    setLoading(true);

    try {
      const updatedParticipants = validParticipants.map((p) => ({
        ...p,
        amount: perPersonAmount,
      }));

      const res = await fetch('/api/split-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          totalAmount: grandTotal,
          taxPercent: parseFloat(taxPercent || 0),
          servicePercent: parseFloat(servicePercent || 0),
          paymentDetails,
          participants: updatedParticipants,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSplitBills();
        if (onTransactionAdded) onTransactionAdded();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppMessage = (participantName, amount) => {
    const text = `Halo ${participantName}! 👋\n\nIni rincian patungan *${title || 'Split Bill'}*:\n\n` +
      `• Total Tagihan: *${formatIDR(grandTotal)}*\n` +
      `• Bagian Kamu (${validParticipants.length} orang): *${formatIDR(amount)}*\n\n` +
      `Silakan transfer ke:\n💳 *${paymentDetails}*\n\n` +
      `Terima kasih banyak! ✨\n_(Catatan via Catatin AI Financial Agent)_`;
    return encodeURIComponent(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Auto Split Bill & Kirim WhatsApp <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">Hitung pembagian tagihan otomatis dan bagi langsung via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Form Split Bill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nama Acara / Tagihan</label>
              <input
                type="text"
                placeholder="misal: Makan Malam Budi & Ani"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Total Tagihan Dasar (Rp)</label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Pajak / Tax (%)</label>
              <div className="relative">
                <Percent size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  placeholder="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Service Charge (%)</label>
              <div className="relative">
                <Percent size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  placeholder="0"
                  value={servicePercent}
                  onChange={(e) => setServicePercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-400" /> Nomor Rekening / E-Wallet Pembayaran
              </label>
              <input
                type="text"
                placeholder="misal: BCA 1234567890 a.n Catatin / GOPAY 08123456789"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Participant Breakdown Section */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} className="text-blue-400" /> Daftar Anggota Patungan ({validParticipants.length} Orang)
              </h4>
              <button
                onClick={handleAddParticipant}
                className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs px-2.5 py-1 rounded-lg border border-blue-500/30 transition"
              >
                <Plus size={13} /> Tambah Anggota
              </button>
            </div>

            <div className="space-y-2">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Nama (misal: Budi)"
                    value={p.name}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[idx].name = e.target.value;
                      setParticipants(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />

                  <input
                    type="text"
                    placeholder="No. WA (Opsional)"
                    value={p.phone || ''}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[idx].phone = e.target.value;
                      setParticipants(updated);
                    }}
                    className="w-32 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />

                  <div className="text-xs font-bold text-emerald-400 px-2 min-w-[90px] text-right">
                    {formatIDR(perPersonAmount)}
                  </div>

                  {p.name.trim() && (
                    <a
                      href={`https://wa.me/${p.phone ? p.phone.replace(/[^0-9]/g, '') : ''}?text=${generateWhatsAppMessage(p.name, perPersonAmount)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center gap-1 text-[11px] font-semibold"
                      title="Kirim Pesan WhatsApp"
                    >
                      <Share2 size={13} />
                      <span className="hidden sm:inline">WA</span>
                    </a>
                  )}

                  {participants.length > 1 && (
                    <button
                      onClick={() => handleRemoveParticipant(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Tagihan (Termasuk Pajak & Service):</div>
              <div className="text-xl font-black text-white">{formatIDR(grandTotal)}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                Bagian per orang: {formatIDR(perPersonAmount)} ({validParticipants.length} orang)
              </div>
            </div>

            <button
              onClick={handleSaveSplitBill}
              disabled={loading || !title || !totalAmount}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>Simpan Split Bill</span>
            </button>
          </div>

          {/* History of Saved Split Bills */}
          {savedSplitBills.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Split Bill Terimpan</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedSplitBills.map((sb) => {
                  let parsed = [];
                  try {
                    parsed = JSON.parse(sb.participants);
                  } catch (e) {}

                  const waGlobalMsg = encodeURIComponent(
                    `Halo Semuanya! 👋\n\nIni rincian patungan *${sb.title}*:\n` +
                    `Total Tagihan: *${formatIDR(sb.totalAmount)}*\n` +
                    `Bagian per orang (${parsed.length} org): *${formatIDR(sb.totalAmount / (parsed.length || 1))}*\n\n` +
                    `Transfer ke:\n💳 *${sb.paymentDetails}*\n\n` +
                    `Terima kasih! (via Catatin)`
                  );

                  return (
                    <div key={sb.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white">{sb.title}</div>
                        <div className="text-[11px] text-slate-400">
                          Total {formatIDR(sb.totalAmount)} • {parsed.length} Orang ({formatIDR(sb.totalAmount / (parsed.length || 1))}/org)
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/?text=${waGlobalMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <MessageSquare size={13} />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
