import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// API GET: Fetch all transactions & summary
export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalIncome: income,
          totalExpense: expense,
          netBalance: income - expense,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// API POST: Add new transaction
export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, category, type, note, date, source } = body;

    const newTx = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        category: category || 'General',
        type: type ? type.toUpperCase() : 'EXPENSE',
        note: note || '',
        date: date ? new Date(date) : new Date(),
        source: source || 'WEB',
      },
    });

    return NextResponse.json({ success: true, data: newTx });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

