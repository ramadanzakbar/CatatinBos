import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGoogleSheetsClient } from '@/lib/sheets';

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

// API POST: Add new transaction & Sync to Google Sheets
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

    // Background / Immediate Sync to Google Sheets if configured
    try {
      const sheets = await getGoogleSheetsClient();
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

      if (sheets && spreadsheetId) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Transactions!A:F',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                newTx.id,
                newTx.date.toISOString(),
                newTx.type,
                newTx.amount,
                newTx.category,
                newTx.note || '',
              ],
            ],
          },
        });
      }
    } catch (syncError) {
      console.warn('Google Sheets sync skipped/failed:', syncError.message);
    }

    return NextResponse.json({ success: true, data: newTx });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
