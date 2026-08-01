'use client';
import { useState, useEffect } from 'react';
import { Users, Share2, Plus, Trash2, CheckCircle2, Circle, DollarSign, Percent, CreditCard, Sparkles, MessageSquare, Check } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function SplitBillView({ onTransactionAdded }) {
  const [splitBills, setSplitBills] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Form State
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

  useEffect(() => {
    fetchSplitBills();
  }, []);

  const fetchSplitBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/split-bill');
      const data = await res.json();
      if (data.success) setSplitBills(data.splitBills || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateSplitBill = async (e) => {
    e.preventDefault();
    if (!title || !totalAmount || validParticipants.length === 0) return;

    const finalParticipants = validParticipants.map((p) => ({
      ...p,
      amount: perPersonAmount,
    }));

    await fetch('/api/split-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        totalAmount: grandTotal,
        taxPercent: parseFloat(taxPercent || 0),
        servicePercent: parseFloat(servicePercent || 0),
        paymentDetails,
        participants: finalParticipants,
      }),
    });

    setTitle('');
    setTotalAmount('');
    fetchSplitBills();
    if (onTransactionAdded) onTransactionAdded();
  };

  const handleToggleParticipantPaid = async (sbId, pIdx) => {
    const sb = splitBills.find((item) => item.id === sbId);
    if (!sb) return;

    let parsed = [];
    try {
      parsed = JSON.parse(sb.participants);
    } catch (e) {
      return;
    }

    parsed[pIdx].paid = !parsed[pIdx].paid;

    await fetch('/api/split-bill', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sbId, participants: parsed }),
    });

    fetchSplitBills();
  };

  const handleDeleteSplitBill = async (id) => {
    await fetch(`/api/split-bill?id=${id}`, { method: 'DELETE' });
    fetchSplitBills();
  };

  const generateWAMessage = (sbTitle, grand, personAmount, paymentInfo, pName) => {
    const text =
      `Halo ${pName || ''}! 👋\n\n` +
      `Ini rincian patungan *${sbTitle}*:\n\n` +
      `• Total Tagihan: *${formatIDR(grand)}*\n` +
      `• Bagian Kamu: *${formatIDR(personAmount)}*\n\n` +
      `Silakan transfer ke:\n💳 *${paymentInfo}*\n\n` +
      `Terima kasih! ✨ (via Catatin AI)`;
    return encodeURIComponent(text);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={12} /> Auto WhatsApp Share Active
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            Kelola Split Bill & Patungan <Users size={24} className="text-blue-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Hitung pembagian tagihan secara otomatis, lacak status pembayaran per orang, dan kirim pesan penagihan langsung ke WhatsApp.
          </p>
        </div>
      </div>

      {/* Grid: Form Buat Split Bill Baru & Daftar Split Bill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Buat Split Bill Baru (lg:col-span-5) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
                <Plus size={18} />
              </div>
              Buat Split Bill Baru
            </h3>
            <span className="text-xs text-slate-400">Kalkulator</span>
          </div>

          <form onSubmit={handleCreateSplitBill} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nama Acara / Tagihan</label>
              <input
                type="text"
                placeholder="misal: Makan Malam Reuni Alumni"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Total Nominal (Rp)</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    placeholder="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Pajak (%)</label>
                <div className="relative">
                  <Percent size={15} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    placeholder="0"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block flex items-center gap-1.5">
                <CreditCard size={14} className="text-indigo-400" /> Rekening / E-Wallet Pembayaran
              </label>
              <input
                type="text"
                placeholder="misal: BCA 1234567890 a.n Catatin"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Participants */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Daftar Anggota ({validParticipants.length} orang)</label>
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Plus size={13} /> Tambah
                </button>
              </div>

              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nama Teman"
                    value={p.name}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[idx].name = e.target.value;
                      setParticipants(updated);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="No WA (opsional)"
                    value={p.phone || ''}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[idx].phone = e.target.value;
                      setParticipants(updated);
                    }}
                    className="w-32 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {participants.length > 1 && (
                    <button type="button" onClick={() => handleRemoveParticipant(idx)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total per person summary */}
            <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-300">Bagian Per Orang:</span>
              <span className="font-extrabold text-indigo-300 text-sm">{formatIDR(perPersonAmount)}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 text-xs flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>Simpan Split Bill Baru</span>
            </button>
          </form>
        </div>

        {/* Right List: Daftar Split Bill Terdaftar (lg:col-span-7) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-blue-400" /> Riwayat Patungan & Status Pembayaran
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Total {splitBills.length} Item
            </span>
          </div>

          {splitBills.length > 0 ? (
            <div className="space-y-4">
              {splitBills.map((sb) => {
                let parsedParticipants = [];
                try {
                  parsedParticipants = JSON.parse(sb.participants);
                } catch (e) {}

                const paidCount = parsedParticipants.filter((p) => p.paid).length;
                const perPerson = parsedParticipants.length > 0 ? sb.totalAmount / parsedParticipants.length : 0;
                const isFullyPaid = paidCount === parsedParticipants.length;

                return (
                  <div key={sb.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{sb.title}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isFullyPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isFullyPaid ? 'LUNAS SEMUA' : `${paidCount}/${parsedParticipants.length} LUNAS`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Total: <strong className="text-white">{formatIDR(sb.totalAmount)}</strong> • Bagian: {formatIDR(perPerson)}/org
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteSplitBill(sb.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                        title="Hapus Split Bill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Participants checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      {parsedParticipants.map((p, pIdx) => {
                        const waUrl = `https://wa.me/${p.phone ? p.phone.replace(/[^0-9]/g, '') : ''}?text=${generateWAMessage(
                          sb.title,
                          sb.totalAmount,
                          perPerson,
                          sb.paymentDetails,
                          p.name
                        )}`;

                        return (
                          <div key={pIdx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => handleToggleParticipantPaid(sb.id, pIdx)}
                                className={`transition ${p.paid ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                                title={p.paid ? 'Tandai Belum Lunas' : 'Tandai Sudah Lunas'}
                              >
                                {p.paid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                              <span className={`font-semibold ${p.paid ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                {p.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-300">{formatIDR(perPerson)}</span>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                              >
                                <Share2 size={12} />
                                <span>Kirim WA</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">Belum ada data Split Bill. Silakan buat di sebelah kiri!</div>
          )}
        </div>
      </div>
    </div>
  );
}
