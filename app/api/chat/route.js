import { NextResponse } from 'next/server';
import { callGemmaAgent } from '@/lib/gemmaAgent';
import { prisma } from '@/lib/prisma';
import { getGoogleSheetsClient } from '@/lib/sheets';

const toolsDeclarations = [
  {
    name: 'add_transaction',
    description: 'Menambahkan transaksi keuangan baru (pemasukan atau pengeluaran) ke database dan Google Sheets.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'NUMBER', description: 'Nominal uang/jumlah transaksi.' },
        category: { type: 'STRING', description: 'Kategori transaksi (misal: Food, Transport, Salary, Bills).' },
        type: { type: 'STRING', description: 'Jenis transaksi: INCOME atau EXPENSE.' },
        note: { type: 'STRING', description: 'Catatan tambahan transaksi.' },
      },
      required: ['amount', 'type'],
    },
  },
  {
    name: 'sync_to_google_sheets',
    description: 'Memicu sinkronisasi 2-arah antara SQLite lokal dan Google Sheets.',
    parameters: { type: 'OBJECT', properties: {} },
  },
];

export async function POST(req) {
  try {
    const { message, image } = await req.json();

    // Call Gemma Agent via Google ADK integration
    const agentResponse = await callGemmaAgent({
      prompt: message || 'Silakan analisis resi/catatan transaksi ini.',
      imageBase64: image,
      tools: toolsDeclarations,
    });

    let executedToolResult = null;

    // Check if Gemma Agent triggered tool calling
    if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
      for (const call of agentResponse.toolCalls) {
        if (call.name === 'add_transaction') {
          const args = call.args || {};
          const createdTx = await prisma.transaction.create({
            data: {
              amount: parseFloat(args.amount || 0),
              category: args.category || 'General',
              type: (args.type || 'EXPENSE').toUpperCase(),
              note: args.note || 'Ditambahkan via Gemma AI Chatbot',
              source: 'CHATBOT',
            },
          });

          // Sync to Sheets
          try {
            const sheets = await getGoogleSheetsClient();
            const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
            if (sheets && spreadsheetId) {
              await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Transactions!A:F',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                  values: [[createdTx.id, createdTx.date.toISOString(), createdTx.type, createdTx.amount, createdTx.category, createdTx.note]],
                },
              });
            }
          } catch (e) {
            console.warn('Sheets sync error:', e.message);
          }

          executedToolResult = `[Tool Executed: add_transaction] Berhasil menambahkan transaksi Rp ${createdTx.amount.toLocaleString()} (${createdTx.category}).`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      reply: executedToolResult
        ? `${executedToolResult}\n\n${agentResponse.text}`
        : agentResponse.text,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
