import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper for auto-seeding if DB is completely empty
async function autoSeedIfEmpty() {
  const count = await prisma.transaction.count();
  if (count === 0) {
    console.log('🌱 DB is empty. Running auto-seeder for financial analysis...');
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // 1. Transactions
    await prisma.transaction.createMany({
      data: [
        { type: 'INCOME', amount: 15000000, category: 'Salary', note: 'Gaji Bulanan Utama PT Tech', source: 'MANUAL', date: daysAgo(25) },
        { type: 'INCOME', amount: 3500000, category: 'Freelance', note: 'Proyek Desain Web Client A', source: 'MANUAL', date: daysAgo(18) },
        { type: 'INCOME', amount: 1200000, category: 'Investment', note: 'Dividen Reksa Dana Saham', source: 'MANUAL', date: daysAgo(10) },
        { type: 'EXPENSE', amount: 3200000, category: 'Bills', note: 'Sewa Apartemen & Air Listrik', source: 'MANUAL', date: daysAgo(24) },
        { type: 'EXPENSE', amount: 850000, category: 'Food', note: 'Belanja Bulanan Supermarket', source: 'MANUAL', date: daysAgo(22) },
        { type: 'EXPENSE', amount: 150000, category: 'Transport', note: 'Isi Bensin & Tol Minggu 1', source: 'MANUAL', date: daysAgo(20) },
        { type: 'EXPENSE', amount: 450000, category: 'Food', note: 'Makan Malam Resto bersama Tim', source: 'CHATBOT', date: daysAgo(16) },
        { type: 'EXPENSE', amount: 250000, category: 'Entertainment', note: 'Langganan Netflix & Spotify', source: 'MANUAL', date: daysAgo(15) },
        { type: 'EXPENSE', amount: 1200000, category: 'Shopping', note: 'Beli Sepatu Olahraga Baru', source: 'MANUAL', date: daysAgo(12) },
        { type: 'EXPENSE', amount: 350000, category: 'Food', note: 'Kopi & Snack Co-working Space', source: 'CHATBOT', date: daysAgo(9) },
        { type: 'EXPENSE', amount: 180000, category: 'Transport', note: 'Voucher Grab & Gojek', source: 'MANUAL', date: daysAgo(7) },
        { type: 'EXPENSE', amount: 650000, category: 'Food', note: 'Struk Belanja Sayur & Daging Segar', source: 'CHATBOT', date: daysAgo(4) },
        { type: 'EXPENSE', amount: 300000, category: 'Entertainment', note: 'Tiket Nonton Bioskop & Popcorn', source: 'MANUAL', date: daysAgo(2) },
        { type: 'EXPENSE', amount: 120000, category: 'Transport', note: 'Servis Ringan Motor', source: 'MANUAL', date: daysAgo(1) },
      ],
    });

    // 2. Budgets
    const budgetCount = await prisma.budget.count();
    if (budgetCount === 0) {
      await prisma.budget.createMany({
        data: [
          { category: 'Food', limitAmount: 2500000 },
          { category: 'Transport', limitAmount: 1000000 },
          { category: 'Entertainment', limitAmount: 800000 },
          { category: 'Shopping', limitAmount: 1500000 },
        ],
      });
    }

    // 3. Goals
    const goalCount = await prisma.goal.count();
    if (goalCount === 0) {
      await prisma.goal.createMany({
        data: [
          { name: 'Dana Darurat 6 Bulan', targetAmount: 25000000, currentAmount: 12500000 },
          { name: 'Laptop MacBook Pro M3', targetAmount: 22000000, currentAmount: 8800000 },
          { name: 'Liburan Akhir Tahun Bali', targetAmount: 7500000, currentAmount: 3200000 },
        ],
      });
    }
  }
}

export async function GET() {
  try {
    await autoSeedIfEmpty();

    const transactions = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
    const budgets = await prisma.budget.findMany();
    const goals = await prisma.goal.findMany();

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = Math.max(0, totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // Categorization into 50/30/20 buckets
    const needsCategories = ['Food', 'Transport', 'Bills', 'Utilities', 'Rent', 'Health', 'General'];
    const wantsCategories = ['Entertainment', 'Shopping', 'Travel', 'Hobbies', 'Cafe'];

    const actualNeeds = transactions
      .filter((t) => t.type === 'EXPENSE' && needsCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const actualWants = transactions
      .filter((t) => t.type === 'EXPENSE' && wantsCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const actualSavings = netSavings;

    const idealNeeds = totalIncome * 0.5;
    const idealWants = totalIncome * 0.3;
    const idealSavings = totalIncome * 0.2;

    // Health Score calculation (0 - 100)
    const healthScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          Number(savingsRate) * 2.5 +
            (actualNeeds <= idealNeeds && totalIncome > 0 ? 30 : 15) +
            (actualWants <= idealWants && totalIncome > 0 ? 20 : 10)
        )
      )
    );

    // Expense breakdown by category
    const expenseByCategory = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    const topExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0] || ['Lainnya', 0];

    // Primary goal & completion estimate
    const primaryGoal = goals[0] || { name: 'Dana Darurat', targetAmount: 25000000, currentAmount: 0 };
    const remainingGoalAmount = Math.max(0, primaryGoal.targetAmount - primaryGoal.currentAmount);
    const monthsToGoal = netSavings > 0 ? Math.ceil(remainingGoalAmount / netSavings) : 0;

    // 12-Month Forecast
    const forecastData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month: `Bulan ${month}`,
        Saldo: Math.round(netSavings * month),
        Target: Math.round(idealSavings * month),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate,
          healthScore,
        },
        rule503020: {
          needs: { ideal: idealNeeds, actual: actualNeeds },
          wants: { ideal: idealWants, actual: actualWants },
          savings: { ideal: idealSavings, actual: actualSavings },
        },
        topExpenseCategory: {
          category: topExpense[0],
          amount: topExpense[1],
        },
        primaryGoal: {
          ...primaryGoal,
          remainingGoalAmount,
          monthsToGoal,
        },
        budgets,
        goals,
        forecastData,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
