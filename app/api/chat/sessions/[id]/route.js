import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/chat/sessions/[id] - Get session messages
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Sesi chat tidak ditemukan' }, { status: 404 });
    }

    const formattedMessages = session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      image: m.image,
      executedTools: m.executedTools ? JSON.parse(m.executedTools) : [],
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        messages: formattedMessages,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/chat/sessions/[id] - Delete chat session
export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    await prisma.chatSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Sesi chat berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
