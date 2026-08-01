'use client';
import { useState } from 'react';
import { Search, Filter, Calendar, Tag, Database, Sparkles, Plus, Download, ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function TransactionsView({ transactions, onRefresh }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Extract unique categories
  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      (t.note || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const totalFilteredIncome = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalFilteredExpense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const netFiltered = totalFilteredIncome - totalFilteredExpense;

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['ID', 'Tanggal', 'Jenis', 'Nominal', 'Kategori', 'Catatan', 'Sumber'];
    const rows = filtered.map((t) => [
      t.id,
      new Date(t.date).toISOString(),
      t.type,
      t.amount,
      `"${t.category}"`,
      `"${t.note || ''}"`,
      t.source || 'MANUAL',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Catatin_Daftar_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Kelola & Riwayat Transaksi <Receipt size={24} className="text-blue-400" />
          </h2>
          <p className="text-xs text-slate-400">Daftar lengkap seluruh transaksi keuangan dengan filter interaktif & pencarian.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-2xl border border-slate-700 transition"
        >
          <Download size={15} />
          <span>Ekspor Hasil Filter (CSV)</span>
        </button>
      </div>

      {/* Stats Cards for Filtered Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Pemasukan</div>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight size={18} /> {formatIDR(totalFilteredIncome)}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Pengeluaran</div>
          <div className="text-xl font-bold text-rose-400 flex items-center gap-1 mt-1">
            <ArrowDownRight size={18} /> {formatIDR(totalFilteredExpense)}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">Arus Kas Bersih</div>
          <div className="text-xl font-bold text-white mt-1">{formatIDR(netFiltered)}</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Cari transaksi atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Type Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  typeFilter === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'Semua' : t === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Full Transactions Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Tabel Transaksi Lengkap
          </h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Menampilkan {filtered.length} dari {transactions.length} item
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Catatan / Detail</th>
                <th className="py-3 px-4 rounded-r-xl">Sumber Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" />
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                          t.type === 'INCOME'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {t.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}
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
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{t.note || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-slate-900 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
                        {t.source === 'GEMMA_AI' ? <Sparkles size={11} className="text-blue-400" /> : <Database size={11} />}
                        {t.source || 'MANUAL'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
