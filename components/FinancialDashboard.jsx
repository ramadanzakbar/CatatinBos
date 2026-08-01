'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownRight, Layers, Sparkles, ShieldCheck, Target, AlertTriangle, Download } from 'lucide-react';
import BudgetGoalManager from '@/components/BudgetGoalManager';

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function FinancialDashboard({ summary, transactions, onSync }) {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchBudgetsAndGoals();
  }, [transactions]);

  const fetchBudgetsAndGoals = async () => {
    try {
      const [resB, resG] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/goals')
      ]);
      const dataB = await resB.json();
      const dataG = await resG.json();
      if (dataB.success) setBudgets(dataB.budgets || []);
      if (dataG.success) setGoals(dataG.goals || []);
    } catch (e) {
      console.warn('Error fetching budgets/goals:', e);
    }
  };

  // Calculate 50/30/20 Allocation based on total income
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const idealNeeds = totalIncome * 0.5;
  const idealWants = totalIncome * 0.3;
  const idealSavings = totalIncome * 0.2;

  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : 0;
  const healthStatus = savingsRate >= 20 ? 'SEHAT' : savingsRate >= 10 ? 'CUKUP' : 'PERLU PERHATIAN';
  const healthColor = savingsRate >= 20 ? 'emerald' : savingsRate >= 10 ? 'amber' : 'rose';

  // Aggregate expenses by category for Pie Chart
  const expenseByCategory = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  const barData = [
    { name: 'Ringkasan', Pemasukan: summary.totalIncome, Pengeluaran: summary.totalExpense },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-300">{payload[0].name}</p>
          <p className="text-blue-400 font-bold">{formatIDR(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Saldo Bersih</span>
            <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/20">
              <Wallet size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {formatIDR(summary.netBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Layers size={14} className="text-blue-400" />
            <span>Update otomatis dari DB & Sheets</span>
          </div>
        </div>

        {/* Card 2: Pemasukan */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pemasukan</span>
            <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-1">
            {formatIDR(summary.totalIncome)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400/80">
            <ArrowUpRight size={14} />
            <span>Arus Kas Masuk</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pengeluaran</span>
            <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/20">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight flex items-center gap-1">
            {formatIDR(summary.totalExpense)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-400/80">
            <ArrowDownRight size={14} />
            <span>Total Beban Biaya</span>
          </div>
        </div>

        {/* Card 4: Google Sheets Sync & Ekspor CSV */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Google Sheets & CSV</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onSync}
                title="Sinkronkan Sekarang"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition active:scale-95 flex items-center gap-1 text-xs"
              >
                <RefreshCw size={13} />
                <span>Sync</span>
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 size={16} />
              <span>2-Way Sync Active</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">SQLite ↔ Google Sheets Cloud</p>
          </div>
        </div>
      </div>

      {/* GEMMA AI FINANCIAL PLANNER & 50/30/20 WIDGET */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Gemma AI Financial Planner & Advisor</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Aturan 50/30/20
                </span>
              </div>
              <p className="text-xs text-slate-400">Analisis alokasi pemasukan & proyeksi tabungan otonom powered by Gemma 4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              healthColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
              healthColor === 'amber' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
              'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <ShieldCheck size={16} />
              <span>Status Keuangan: {healthStatus} ({savingsRate}% Tabungan)</span>
            </div>
          </div>
        </div>

        {/* 50/30/20 Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Needs (50%) */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-blue-400">50% Kebutuhan (Needs)</span>
              <span className="text-slate-400">Ideal: {formatIDR(idealNeeds)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalExpense / (idealNeeds || 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400">Tagihan, bahan makanan, sewa & transportasi pokok.</p>
          </div>

          {/* Wants (30%) */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-purple-400">30% Keinginan (Wants)</span>
              <span className="text-slate-400">Ideal: {formatIDR(idealWants)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalExpense / (idealWants || 1)) * 50)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400">Hiburan, belanja barang impian, jalan-jalan.</p>
          </div>

          {/* Savings (20%) */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-400">20% Tabungan (Savings)</span>
              <span className="text-slate-400">Target: {formatIDR(idealSavings)}</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (netSavings / (idealSavings || 1)) * 100)}%` }} />
            </div>
            <p className="text-[11px] text-slate-400">Dana darurat, investasi & pencapaian masa depan.</p>
          </div>
        </div>

        {/* Cashflow Forecast Projections */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-indigo-400" />
            <span><strong>Proyeksi Cash Flow 6 Bulan:</strong> Estimasi akumulasi tabungan sebesar <strong>{formatIDR(netSavings * 6)}</strong>.</span>
          </div>
          <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
            Tanya Gemma Chatbot untuk menyusun anggaran detail!
          </span>
        </div>
      </div>

      {/* BUDGET & SAVINGS GOALS MANAGER */}
      <BudgetGoalManager onUpdate={onSync} />

      {/* Financial Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Pengeluaran per Kategori
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {expenseByCategory.length} Kategori
            </span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(15,23,42,0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
                <PieChart size={32} className="opacity-40" />
                <p>Belum ada transaksi pengeluaran</p>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Perbandingan Income vs Expense
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Rasio Keuangan
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [formatIDR(value), '']}
                  contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Legend formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
