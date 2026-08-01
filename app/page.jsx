'use client';
import { useState, useEffect } from 'react';
import FinancialDashboard from '@/components/FinancialDashboard';
import GemmaChatbot from '@/components/GemmaChatbot';
import { Plus, ListFilter, Bot, X, Sparkles, Receipt, DollarSign, Calendar, Tag, Database, Cloud } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function Home() {
  const [data, setData] = useState({ transactions: [], summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 } });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', category: 'Food', type: 'EXPENSE', note: '' });
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setForm({ amount: '', category: 'Food', type: 'EXPENSE', note: '' });
    fetchTransactions();
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 relative overflow-x-hidden">
      {/* Top Header Banner */}
      <header className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={12} /> Gemma 4 AI Powered
            </span>
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Live Sync
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            Catatin <span className="text-2xl">💰</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Pencatatan Keuangan Cerdas dengan 2-Way Google Sheets Sync & Asisten Multimodal Gemma 4.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 border border-blue-400/20"
          >
            <Bot size={20} className="animate-bounce" />
            <span>Tanya Gemma AI</span>
          </button>
        </div>
      </header>

      {/* Main Financial Analytics Dashboard */}
      <FinancialDashboard summary={data.summary} transactions={data.transactions} onSync={fetchTransactions} />

      {/* Content Section: Form & Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Manual Add Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl h-fit border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-blue-500/15 text-blue-400 rounded-xl">
                <Plus size={18} />
              </div>
              Tambah Transaksi
            </h3>
            <span className="text-xs text-slate-400">Manual Input</span>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tipe Transaksi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'EXPENSE' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    form.type === 'EXPENSE'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'INCOME' })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    form.type === 'INCOME'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Pemasukan
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nominal (Rp)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Kategori</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="misal: Food, Salary, Transport"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Catatan / Detail</label>
              <input
                type="text"
                placeholder="Catatan tambahan..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-98 flex items-center justify-center gap-2 text-sm mt-2"
            >
              <Receipt size={16} />
              <span>Simpan Transaksi</span>
            </button>
          </form>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl">
                <ListFilter size={18} />
              </div>
              Riwayat Transaksi Terakhir
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Total {data.transactions.length} Item
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 rounded-r-xl">Sumber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.transactions.length > 0 ? (
                  data.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                            t.type === 'INCOME'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{t.category}</td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          t.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {formatIDR(t.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs max-w-[150px] truncate">{t.note || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
                          {t.source === 'GEMMA_AI' ? <Sparkles size={10} className="text-blue-400" /> : <Database size={10} />}
                          {t.source || 'MANUAL'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                      Belum ada transaksi recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border border-blue-400/30"
        aria-label="Toggle Gemma AI Chat"
      >
        <Bot size={28} />
      </button>

      {/* Slide-Over Drawer dari Kanan */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          onClick={() => setIsChatOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-lg bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl transition-transform duration-300 transform ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col p-4 relative">
            <button
              onClick={() => setIsChatOpen(false)}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
            <div className="flex-1 mt-2 h-full">
              <GemmaChatbot onTransactionAdded={fetchTransactions} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

