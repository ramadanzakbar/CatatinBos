'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, CheckCircle2, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function FinancialDashboard({ summary, transactions, onSync }) {
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

        {/* Card 4: Google Sheets Sync */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Google Sheets Sync</span>
            <button
              onClick={onSync}
              title="Sinkronkan Sekarang"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <RefreshCw size={14} />
              <span>Sync</span>
            </button>
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

