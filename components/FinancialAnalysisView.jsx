'use client';
import { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  BarChart3,
  LineChart,
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function FinancialAnalysisView() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analysis');
      const result = await res.json();
      if (result.success && result.data) {
        setAnalysisData(result.data);
      } else {
        setError(result.error || 'Gagal mengambil data analisis dari server');
      }
    } catch (e) {
      setError('Terjadi kesalahan koneksi sistem: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-400" size={32} />
        <p className="text-xs text-slate-400 font-medium animate-pulse">
          Gemma 4 AI sedang mengalkulasi indikator 50/30/20 dari database...
        </p>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-4">
        <AlertTriangle className="mx-auto text-rose-400" size={32} />
        <p className="text-xs text-rose-300 font-semibold">{error || 'Data analisis tidak tersedia'}</p>
        <button
          onClick={fetchAnalysisData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 border border-slate-700 transition"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, rule503020, topExpenseCategory, primaryGoal, forecastData } = analysisData;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={12} /> Gemma 4 Financial Intelligence Report
            </span>
            <button
              onClick={fetchAnalysisData}
              className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Analisis Backend"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Laporan & Rekomendasi Analisis Finansial</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Analisis dinamis kesehatan portofolio keuangan Anda berdasarkan aturan rasio ideal 50/30/20, proyeksi cash flow, serta data transaksi terverifikasi dari database.
          </p>
        </div>

        {/* Health Score Badge Card */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/40 bg-slate-900/90 text-center min-w-[200px] relative z-10 shadow-xl">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Skor Kesehatan Finansial</div>
          <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 my-1">
            {summary.healthScore}/100
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck size={14} /> Rasio Tabungan {summary.savingsRate}%
          </div>
        </div>
      </div>

      {/* SECTION 1: DETAILED 50/30/20 BUDGET RULE ANALYSIS (100% DYNAMIC) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" /> Analisis Alokasi Anggaran 50/30/20 (Real DB Data)
            </h3>
            <p className="text-xs text-slate-400">
              Perbandingan alokasi pendapatan riil Anda ({formatIDR(summary.totalIncome)}) dengan standar baku Financial Planning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Needs Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">50% Kebutuhan Pokok</span>
              <span className="text-xs font-bold text-white">{formatIDR(rule503020.needs.ideal)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (rule503020.needs.actual / (rule503020.needs.ideal || 1)) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Pengeluaran Pokok Riil:</strong> <strong>{formatIDR(rule503020.needs.actual)}</strong>.</p>
              <p className="text-slate-400">
                {rule503020.needs.actual <= rule503020.needs.ideal
                  ? 'Sangat baik! Pengeluaran pokok (makan, sewa, tagihan, bensin) berada di bawah batas ideal 50%.'
                  : 'Perhatian: Pengeluaran pokok melebihi batas ideal 50%. Evaluasi tagihan bulanan Anda.'}
              </p>
            </div>
          </div>

          {/* Wants Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">30% Keinginan (Wants)</span>
              <span className="text-xs font-bold text-white">{formatIDR(rule503020.wants.ideal)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (rule503020.wants.actual / (rule503020.wants.ideal || 1)) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Gaya Hidup Riil:</strong> <strong>{formatIDR(rule503020.wants.actual)}</strong>.</p>
              <p className="text-slate-400">
                {rule503020.wants.actual <= rule503020.wants.ideal
                  ? 'Gaya hidup (hiburan, belanja hobi) terkendali sangat baik di bawah batas 30%.'
                  : 'Peringatan: Porsi belanja non-esensial atau hiburan mendekati/melebihi batas 30%.'}
              </p>
            </div>
          </div>

          {/* Savings Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">20% Tabungan & Investasi</span>
              <span className="text-xs font-bold text-white">{formatIDR(rule503020.savings.ideal)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (summary.netSavings / (rule503020.savings.ideal || 1)) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Tabungan Bersih Riil:</strong> <strong>{formatIDR(summary.netSavings)}</strong> ({summary.savingsRate}%).</p>
              <p className="text-slate-400">
                {Number(summary.savingsRate) >= 20
                  ? 'Sangat luar biasa! Anda memenuhi ambang batas aman 20% untuk pertumbuhan tabungan bersih.'
                  : 'Tingkatkan rasio tabungan dengan menekan pengeluaran kategori non-esensial.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI NARRATIVE RECOMMENDATION CARDS (GEMMA FINANCIAL ADVISORY - DYNAMIC) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" /> Rekomendasi Strategis Gemma 4 AI
          </h3>
          <p className="text-xs text-slate-400">Langkah nyata & saran otomatis berbasis data transaksi database Catatin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <CheckCircle2 size={16} /> Optimasi Kategori Pengeluaran Terbesar
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengeluaran terbesar Anda berada pada kategori <strong>"{topExpenseCategory.category}"</strong> sebesar <strong>{formatIDR(topExpenseCategory.amount)}</strong>. Disarankan menetapkan pagu anggaran maksimal sebesar <strong>{formatIDR(topExpenseCategory.amount * 0.85)}</strong> pada bulan berikutnya.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp size={16} /> Alokasi Otomatis ke Tabungan & Investasi
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sisa arus kas bersih tercatat <strong>{formatIDR(summary.netSavings)}</strong>. Alokasikan minimal 60% (<strong>{formatIDR(summary.netSavings * 0.6)}</strong>) secara otomatis ke instrumen berisiko rendah seperti Reksa Dana Pasar Uang.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Target size={16} /> Proyeksi Target: {primaryGoal.name}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Target <strong>"{primaryGoal.name}"</strong> (Terkumpul {formatIDR(primaryGoal.currentAmount)} / Target {formatIDR(primaryGoal.targetAmount)}) diproyeksikan tercapai penuh dalam <strong>{primaryGoal.monthsToGoal} bulan</strong> dengan tren tabungan riil saat ini.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle size={16} /> Pengawasan Pagu Anggaran
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manfaatkan integrasi <strong>Tool Calling Gemma Chatbot</strong> untuk pencatatan transaksi harian via foto struk agar porsi 50/30/20 Anda selalu terkontrol secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: 12-MONTH CASHFLOW FORECAST PROJECTION CHART */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LineChart size={20} className="text-emerald-400" /> Proyeksi Pertumbuhan Saldo Riil (12 Bulan)
            </h3>
            <p className="text-xs text-slate-400">
              Estimasi akumulasi kekayaan bersih berbasis sisa tabungan bulanan ({formatIDR(summary.netSavings)}/bln)
            </p>
          </div>
        </div>

        <div className="h-72 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(val) => [formatIDR(val), '']}
                contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="Saldo" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="Target" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
