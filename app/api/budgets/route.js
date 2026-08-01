import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const budgets = await prisma.budget.findMany();
    return NextResponse.json({ success: true, budgets });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { category, limitAmount } = await req.json();
    if (!category || limitAmount === undefined) {
      return NextResponse.json({ success: false, error: 'Category & limitAmount required' }, { status: 400 });
    }

    const budget = await prisma.budget.upsert({
      where: { category },
      update: { limitAmount: parseFloat(limitAmount) },
      create: { category, limitAmount: parseFloat(limitAmount) },
    });

    return NextResponse.json({ success: true, budget });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
