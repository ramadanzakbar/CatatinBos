'use client';
import { useState, useEffect } from 'react';
import { Target, PieChart, Plus, Trash2, CheckCircle2, TrendingUp, AlertTriangle, Sparkles, DollarSign, Calendar } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function BudgetGoalManager({ onUpdate }) {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Budget Form
  const [newCategory, setNewCategory] = useState('Food');
  const [newLimit, setNewLimit] = useState('');

  // New Goal Form
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalInitial, setGoalInitial] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resB, resG] = await Promise.all([fetch('/api/budgets'), fetch('/api/goals')]);
      const dataB = await resB.json();
      const dataG = await resG.json();

      if (dataB.success) setBudgets(dataB.budgets || []);
      if (dataG.success) setGoals(dataG.goals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!newCategory || !newLimit) return;

    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCategory, limitAmount: parseFloat(newLimit) }),
    });

    setNewLimit('');
    fetchData();
    if (onUpdate) onUpdate();
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;

    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: goalName,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalInitial || 0),
      }),
    });

    setGoalName('');
    setGoalTarget('');
    setGoalInitial('');
    fetchData();
    if (onUpdate) onUpdate();
  };

  const handleAddDepositToGoal = async (id, addAmount) => {
    if (!addAmount) return;
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, addAmount: parseFloat(addAmount) }),
    });
    fetchData();
    if (onUpdate) onUpdate();
  };

  const handleDeleteGoal = async (id) => {
    await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
    fetchData();
    if (onUpdate) onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SECTION 1: PAGU ANGGARAN BULANAN (BUDGET LIMITS) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/15 text-purple-400 rounded-xl">
              <PieChart size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pagu Anggaran Bulanan</h3>
              <p className="text-xs text-slate-400">Batas pengeluaran maksimal per kategori</p>
            </div>
          </div>
        </div>

        {/* Form Tambah Budget */}
        <form onSubmit={handleAddBudget} className="flex gap-2">
          <input
            type="text"
            placeholder="Kategori (Food, Transport...)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="number"
            placeholder="Batas Rp"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-32 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-purple-600/20"
          >
            Set
          </button>
        </form>

        {/* List Budget Limits */}
        <div className="space-y-3">
          {budgets.length > 0 ? (
            budgets.map((b) => (
              <div key={b.id} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">{b.category}</span>
                  <span className="text-purple-400 font-bold">{formatIDR(b.limitAmount)}/bulan</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full w-2/3" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">Belum ada pagu anggaran. Silakan atur di atas atau tanya Gemma AI.</p>
          )}
        </div>
      </div>

      {/* SECTION 2: TARGET IMPIAN & SAVINGS GOALS */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Target Impian & Tabungan</h3>
              <p className="text-xs text-slate-400">Pantau progres pencapaian dana darurat/impian</p>
            </div>
          </div>
        </div>

        {/* Form Tambah Goal */}
        <form onSubmit={handleAddGoal} className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Nama Impian (misal: Laptop)"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            placeholder="Target Total Rp"
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-600/20"
          >
            + Target
          </button>
        </form>

        {/* List Savings Goals */}
        <div className="space-y-3">
          {goals.length > 0 ? (
            goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
              return (
                <div key={g.id} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{pct}%</span>
                      <button onClick={() => handleDeleteGoal(g.id)} className="text-slate-500 hover:text-rose-400 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Terkumpul: <strong>{formatIDR(g.currentAmount)}</strong></span>
                    <span>Target: <strong>{formatIDR(g.targetAmount)}</strong></span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const val = prompt(`Setor dana tabungan untuk ${g.name} (Rp):`);
                        if (val) handleAddDepositToGoal(g.id, val);
                      }}
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg py-1 text-[11px] font-semibold transition flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> Setor Tabungan
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">Belum ada target impian. Tambahkan di atas!</p>
          )}
        </div>
      </div>
    </div>
  );
}
