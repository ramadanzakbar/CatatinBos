import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const splitBills = await prisma.splitBill.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, splitBills });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, totalAmount, taxPercent, servicePercent, paymentDetails, participants } = await req.json();

    if (!title || !totalAmount || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ success: false, error: 'Data split bill tidak lengkap' }, { status: 400 });
    }

    const created = await prisma.splitBill.create({
      data: {
        title,
        totalAmount: parseFloat(totalAmount),
        taxPercent: parseFloat(taxPercent || 0),
        servicePercent: parseFloat(servicePercent || 0),
        paymentDetails: paymentDetails || '',
        participants: JSON.stringify(participants),
      },
    });

    return NextResponse.json({ success: true, splitBill: created });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, participants, title, paymentDetails } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID split bill diperlukan' }, { status: 400 });
    }

    const updated = await prisma.splitBill.update({
      where: { id },
      data: {
        ...(participants && { participants: JSON.stringify(participants) }),
        ...(title && { title }),
        ...(paymentDetails && { paymentDetails }),
      },
    });

    return NextResponse.json({ success: true, splitBill: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID split bill diperlukan' }, { status: 400 });
    }

    await prisma.splitBill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
