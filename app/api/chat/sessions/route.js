import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/chat/sessions - Fetch all chat sessions
export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/chat/sessions - Create a new chat session
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body?.title || 'Sesi Chat Baru';

    const newSession = await prisma.chatSession.create({
      data: {
        title,
        messages: {
          create: {
            role: 'assistant',
            text: 'Halo! Saya **Gemma 4 AI Financial Planner & Personal Wealth Advisor** 💡\n\nAda yang bisa saya bantu hari ini?',
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ success: true, data: newSession });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
