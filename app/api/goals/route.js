import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, targetAmount, currentAmount, deadline } = await req.json();

    if (!name || !targetAmount) {
      return NextResponse.json({ success: false, error: 'Nama & Target nominal diperlukan' }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, addAmount, currentAmount, name, targetAmount } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID goal diperlukan' }, { status: 400 });
    }

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Goal tidak ditemukan' }, { status: 404 });
    }

    let updatedCurrentAmount = existing.currentAmount;
    if (addAmount !== undefined) {
      updatedCurrentAmount += parseFloat(addAmount);
    } else if (currentAmount !== undefined) {
      updatedCurrentAmount = parseFloat(currentAmount);
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        currentAmount: updatedCurrentAmount,
        ...(name && { name }),
        ...(targetAmount && { targetAmount: parseFloat(targetAmount) }),
      },
    });

    return NextResponse.json({ success: true, goal: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID goal diperlukan' }, { status: 400 });
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
