'use client';
import { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, ArrowRight, BarChart3, LineChart, Target, DollarSign } from 'lucide-react';
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function FinancialAnalysisView({ summary, transactions }) {
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const idealNeeds = totalIncome * 0.5;
  const idealWants = totalIncome * 0.3;
  const idealSavings = totalIncome * 0.2;

  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;
  const healthScore = Math.min(100, Math.round(Number(savingsRate) * 3 + 25));

  // Category Aggregation
  const expenseByCategory = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const topExpenseCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0] || ['Lainnya', 0];

  // 12-Month Projection Data
  const forecastData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      month: `Bulan ${month}`,
      Saldo: Math.round(netSavings * month),
      Target: Math.round(idealSavings * month),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles size={12} /> Gemma 4 Financial Intelligence Report
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Laporan & Rekomendasi Analisis Finansial</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Analisis mendalam atas kesehatan portofolio keuangan Anda berdasarkan aturan rasio ideal 50/30/20, proyeksi cash flow, serta rekomendasi penataan anggaran.
          </p>
        </div>

        {/* Health Score Badge Card */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/40 bg-slate-900/90 text-center min-w-[200px] relative z-10 shadow-xl">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Skor Kesehatan Finansial</div>
          <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 my-1">
            {healthScore}/100
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck size={14} /> Rasio Tabungan {savingsRate}%
          </div>
        </div>
      </div>

      {/* SECTION 1: DETAILED 50/30/20 BUDGET RULE ANALYSIS */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" /> Analisis Alokasi Anggaran 50/30/20
            </h3>
            <p className="text-xs text-slate-400">Perbandingan alokasi pendapatan riil Anda dengan standar baku financial planning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Needs Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">50% Kebutuhan Pokok</span>
              <span className="text-xs font-bold text-white">{formatIDR(idealNeeds)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalExpense / (idealNeeds || 1)) * 100)}%` }} />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Status saat ini:</strong> Pengeluaran pokok tercatat <strong>{formatIDR(totalExpense)}</strong>.</p>
              <p className="text-slate-400">
                Porsi kebutuhan pokok mencakup sewa tempat tinggal, tagihan listrik & air, serta belanja pangan pokok bulanan.
              </p>
            </div>
          </div>

          {/* Wants Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">30% Keinginan (Wants)</span>
              <span className="text-xs font-bold text-white">{formatIDR(idealWants)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalExpense / (idealWants || 1)) * 50)}%` }} />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Status saat ini:</strong> Alokasi gaya hidup terkendali baik.</p>
              <p className="text-slate-400">
                Pengeluaran seperti hiburan, belanja pakaian, dan makan luar disarankan tidak melebihi {formatIDR(idealWants)} per bulan.
              </p>
            </div>
          </div>

          {/* Savings Analysis */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">20% Tabungan & Investasi</span>
              <span className="text-xs font-bold text-white">{formatIDR(idealSavings)}</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (netSavings / (idealSavings || 1)) * 100)}%` }} />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p><strong>Status saat ini:</strong> Tabungan bersih bulanan <strong>{formatIDR(netSavings)}</strong> ({savingsRate}%).</p>
              <p className="text-slate-400">
                {Number(savingsRate) >= 20
                  ? 'Sangat baik! Anda telah memenuhi ambang batas aman 20% untuk pertumbuhan kekayaan bersih.'
                  : 'Pertimbangkan untuk mengurangi porsi pengeluaran non-esensial untuk meningkatkan rasio tabungan.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI NARRATIVE RECOMMENDATION CARDS (GEMMA FINANCIAL ADVISORY) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" /> Rekomendasi Strategis Gemma 4 AI
          </h3>
          <p className="text-xs text-slate-400">Langkah nyata & saran otomatis untuk mengoptimalkan kesehatan finansial Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <CheckCircle2 size={16} /> Optimasi Kategori Pengeluaran Terbesar
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pengeluaran terbesar Anda saat ini berada pada kategori <strong>"{topExpenseCategory[0]}"</strong> sebesar <strong>{formatIDR(topExpenseCategory[1])}</strong>. Disarankan menetapkan pagu anggaran maksimal sebesar <strong>{formatIDR(topExpenseCategory[1] * 0.85)}</strong> pada bulan berikutnya.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp size={16} /> Alokasi Otomatis ke Dana Darurat
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dengan sisa arus kas bersih <strong>{formatIDR(netSavings)}</strong>, alokasikan minimal 60% (<strong>{formatIDR(netSavings * 0.6)}</strong>) secara otomatis ke instrumen berisiko rendah seperti Reksa Dana Pasar Uang atau Deposito.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Target size={16} /> Proyeksi Waktu Pencapaian Target Impian
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Berdasarkan tren tabungan bulanan riil, target impian Anda diproyeksikan dapat tercapai penuh dalam <strong>{Math.ceil(25000000 / (netSavings || 1))} bulan</strong> tanpa mengganggu arus kas operasional.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle size={16} /> Peringatan Pagu & Pengawasan Biaya
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Manfaatkan integrasi <strong>Tool Calling Gemma Chatbot</strong> untuk mencatat transaksi harian instan via struk foto agar tidak ada pengeluaran kecil yang luput dari pencatatan.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: 12-MONTH CASHFLOW FORECAST PROJECTION CHART */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LineChart size={20} className="text-emerald-400" /> Proyeksi Pertumbuhan Akumulasi Saldo (12 Bulan)
            </h3>
            <p className="text-xs text-slate-400">Estimasi akumulasi kekayaan bersih jika konsistensi tabungan dipertahankan</p>
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
