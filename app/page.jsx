'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import FinancialDashboard from '@/components/FinancialDashboard';
import TransactionsView from '@/components/TransactionsView';
import SplitBillView from '@/components/SplitBillView';
import FinancialAnalysisView from '@/components/FinancialAnalysisView';
import GemmaChatbot from '@/components/GemmaChatbot';
import SplitBillModal from '@/components/SplitBillModal';
import MultimodalScanModal from '@/components/MultimodalScanModal';
import { Plus, ListFilter, Bot, X, Sparkles, Receipt, DollarSign, Calendar, Tag, Database, Menu, Users, Download, Camera, Mic } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function Home() {
  const [data, setData] = useState({ transactions: [], summary: { totalIncome: 0, totalExpense: 0, netBalance: 0 } });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', category: 'Food', type: 'EXPENSE', note: '' });
  
  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [splitBillInitialData, setSplitBillInitialData] = useState(null);

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

  const handleExportCSV = () => {
    if (!data.transactions || data.transactions.length === 0) return;
    const headers = ['ID', 'Tanggal', 'Jenis', 'Nominal', 'Kategori', 'Catatan', 'Sumber'];
    const rows = data.transactions.map((t) => [
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
    link.setAttribute('download', `Catatin_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenSplitBillWithData = (ocrData) => {
    setSplitBillInitialData(ocrData);
    setIsSplitBillOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* COLUMN 1: LEFT SIDEBAR (Desktop sticky, Mobile drawer) */}
      <div className="hidden lg:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileSidebarOpen(false);
              }}
              isCollapsed={false}
              setIsCollapsed={() => {}}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTAINER: CENTER CONTENT + RIGHT GEMMA CHATBOT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header Bar */}
        <header className="lg:hidden p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              <Menu size={20} />
            </button>
            <span className="font-black text-lg text-white flex items-center gap-1">
              Catatin <span className="text-sm">💰</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30"
              title="Scan Struk / Suara"
            >
              <Camera size={18} />
            </button>

            <button
              onClick={() => setIsMobileChatOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md"
            >
              <Bot size={16} />
              <span>AI Chat</span>
            </button>
          </div>
        </header>

        {/* 2-COLUMN MAIN BODY GRID: CENTER CONTENT & RIGHT EMBEDDED CHATBOT */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 sm:p-6 lg:p-8 max-w-[1800px] w-full mx-auto">
          {/* COLUMN 2 (CENTER): DYNAMIC CONTENT BASED ON ACTIVETAB */}
          <main className="xl:col-span-8 space-y-6 min-w-0">
            {activeTab === 'dashboard' && (
              <>
                {/* Top Header Banner */}
                <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-slate-800 shadow-2xl">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Sparkles size={12} /> Gemma 4 AI Multimodal
                      </span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Live 2-Way Sync
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                      Financial Dashboard <span className="text-xl">📊</span>
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                      Kelola transaksi keuangan secara real-time dengan OCR Struk Multimodal, Suara, Google Sheets & kecerdasan Gemma 4.
                    </p>
                  </div>

                  {/* Action Buttons: AI Scan Struk/Suara, Auto Split Bill & Ekspor CSV */}
                  <div className="relative z-10 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsScanModalOpen(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 border border-blue-400/30"
                    >
                      <Camera size={16} />
                      <span>Scan Struk & Suara</span>
                    </button>

                    <button
                      onClick={() => { setSplitBillInitialData(null); setIsSplitBillOpen(true); }}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 border border-indigo-400/20"
                    >
                      <Users size={16} />
                      <span>Auto Split Bill</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-2xl border border-slate-700 transition hover:scale-105"
                      title="Unduh Laporan Transaksi CSV"
                    >
                      <Download size={15} />
                      <span>Ekspor CSV</span>
                    </button>
                  </div>
                </div>

                {/* Financial Analytics Dashboard Metrics & Charts */}
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
                      <span className="text-xs text-slate-400">Manual</span>
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
                            placeholder="misal: Food, Salary"
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Catatan</label>
                        <input
                          type="text"
                          placeholder="Catatan..."
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
              </>
            )}

            {activeTab === 'transactions' && (
              <TransactionsView transactions={data.transactions} onRefresh={fetchTransactions} />
            )}

            {activeTab === 'splitbill' && (
              <SplitBillView onTransactionAdded={fetchTransactions} />
            )}

            {activeTab === 'analytics' && (
              <FinancialAnalysisView summary={data.summary} transactions={data.transactions} />
            )}
          </main>

          {/* COLUMN 3 (RIGHT): EMBEDDED GEMMA CHATBOT */}
          <aside className="hidden xl:block xl:col-span-4 h-[calc(100vh-3rem)] sticky top-6">
            <GemmaChatbot onTransactionAdded={fetchTransactions} />
          </aside>
        </div>
      </div>

      {/* Multimodal AI Scan Modal (OCR Struk & Voice) */}
      <MultimodalScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onTransactionAdded={fetchTransactions}
        onOpenSplitBillWithData={handleOpenSplitBillWithData}
      />

      {/* Auto Split Bill Interactive Modal */}
      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
        onTransactionAdded={fetchTransactions}
        initialData={splitBillInitialData}
      />

      {/* Mobile Gemma Chatbot Drawer */}
      {isMobileChatOpen && (
        <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileChatOpen(false)} />
          <div className="relative z-10 w-full max-w-md h-full p-3 bg-slate-950">
            <GemmaChatbot onTransactionAdded={fetchTransactions} onClose={() => setIsMobileChatOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
