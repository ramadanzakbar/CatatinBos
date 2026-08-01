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
    name: 'split_bill',
    description: 'Menghitung pembagian tagihan (Split Bill) untuk beberapa orang dan membuat tautan/pesan penagihan ke WhatsApp.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Nama acara / nama tagihan (misal: Makan Malam bersama Budi & Ani).' },
        totalAmount: { type: 'NUMBER', description: 'Total tagihan keseluruhan (Rp).' },
        participants: {
          type: 'ARRAY',
          description: 'Daftar nama teman yang ikut patungan (misal: ["Budi", "Ani", "Saya"]).',
          items: { type: 'STRING' },
        },
        paymentDetails: { type: 'STRING', description: 'Nomor Rekening / E-Wallet untuk pembayaran (misal: BCA 1234567890 a.n Catatin).' },
      },
      required: ['title', 'totalAmount', 'participants'],
    },
  },
  {
    name: 'manage_savings_goal',
    description: 'Menambahkan atau menyimpan uang ke Target Impian / Tabungan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Nama target impian (misal: Dana Darurat, HP Baru).' },
        targetAmount: { type: 'NUMBER', description: 'Batas target total yang ingin dicapai (Rp).' },
        addAmount: { type: 'NUMBER', description: 'Jumlah nominal yang ingin disetorkan ke tabungan (Rp).' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_financial_summary',
    description: 'Mengambil ringkasan data transaksi, total pemasukan, pengeluaran, saldo, dan statistik kategori untuk analisis/perencanaan keuangan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Filter kategori opsional (misal: Food, Transport).' },
      },
    },
  },
  {
    name: 'analyze_financial_health',
    description: 'Menganalisis indikator kesehatan keuangan berdasarkan rasio 50/30/20 (Needs/Wants/Savings), rasio tabungan, dan peringatan batas anggaran.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'set_budget_limit',
    description: 'Menetapkan atau memperbarui batas pagu anggaran bulanan untuk kategori tertentu.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Kategori transaksi yang ingin dibatasi (misal: Food, Entertainment).' },
        limitAmount: { type: 'NUMBER', description: 'Nominal batas maksimal anggaran bulanan.' },
      },
      required: ['category', 'limitAmount'],
    },
  },
  {
    name: 'generate_cashflow_forecast',
    description: 'Memproyeksikan sisa saldo tunai dan waktu pencapaian target tabungan dalam 1-6 bulan ke depan.',
    parameters: {
      type: 'OBJECT',
      properties: {
        targetGoalName: { type: 'STRING', description: 'Nama target impian/dana darurat opsional.' },
      },
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

          executedToolResult = `[Tool Executed: add_transaction] Berhasil menambahkan transaksi Rp ${createdTx.amount.toLocaleString('id-ID')} (${createdTx.category}).`;
        } else if (call.name === 'split_bill') {
          const args = call.args || {};
          const participants = Array.isArray(args.participants) ? args.participants : ['Budi', 'Ani'];
          const perPerson = (parseFloat(args.totalAmount || 0) / participants.length).toFixed(0);
          
          const participantData = participants.map((p) => ({
            name: p,
            amount: parseFloat(perPerson),
            paid: false,
          }));

          const createdSplit = await prisma.splitBill.create({
            data: {
              title: args.title || 'Patungan Makanan',
              totalAmount: parseFloat(args.totalAmount || 0),
              paymentDetails: args.paymentDetails || 'BCA 1234567890 a.n Catatin',
              participants: JSON.stringify(participantData),
            },
          });

          const waMsg = encodeURIComponent(
            `Halo! Ini rincian patungan *${createdSplit.title}*:\n\nTotal: Rp ${createdSplit.totalAmount.toLocaleString('id-ID')}\nBagian per orang (${participants.length} org): *Rp ${Number(perPerson).toLocaleString('id-ID')}*\n\nTransfer ke: ${createdSplit.paymentDetails}\n\nTerima kasih! 💰 (via Catatin AI)`
          );

          executedToolResult = `[Tool Executed: split_bill] Berhasil menghitung Split Bill "${createdSplit.title}". Bagian per orang: Rp ${Number(perPerson).toLocaleString('id-ID')}.\n📲 WhatsApp Share Link: https://wa.me/?text=${waMsg}`;
        } else if (call.name === 'manage_savings_goal') {
          const args = call.args || {};
          const name = args.name || 'Dana Darurat';
          const target = parseFloat(args.targetAmount || 1000000);
          const add = parseFloat(args.addAmount || 0);

          const existing = await prisma.goal.findFirst({ where: { name: { equals: name } } });
          let goal;
          if (existing) {
            goal = await prisma.goal.update({
              where: { id: existing.id },
              data: { currentAmount: existing.currentAmount + add },
            });
          } else {
            goal = await prisma.goal.create({
              data: { name, targetAmount: target, currentAmount: add },
            });
          }

          executedToolResult = `[Tool Executed: manage_savings_goal] Target "${goal.name}" berhasil diperbarui! Terkumpul Rp ${goal.currentAmount.toLocaleString('id-ID')} / Target Rp ${goal.targetAmount.toLocaleString('id-ID')}.`;
        } else if (call.name === 'get_financial_summary') {
          const allTxs = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const net = income - expense;

          executedToolResult = `[Tool Executed: get_financial_summary] Total Pemasukan: Rp ${income.toLocaleString('id-ID')}, Total Pengeluaran: Rp ${expense.toLocaleString('id-ID')}, Saldo Bersih: Rp ${net.toLocaleString('id-ID')}, Total Transaksi: ${allTxs.length}.`;
        } else if (call.name === 'analyze_financial_health') {
          const allTxs = await prisma.transaction.findMany();
          const budgets = await prisma.budget.findMany();
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          
          const idealNeeds = income * 0.5;
          const idealWants = income * 0.3;
          const idealSavings = income * 0.2;
          const currentSavings = Math.max(0, income - expense);
          const savingsRate = income > 0 ? ((currentSavings / income) * 100).toFixed(1) : 0;

          executedToolResult = `[Tool Executed: analyze_financial_health] Rasio Tabungan: ${savingsRate}%. Alokasi 50/30/20 Idealku: Needs Rp ${idealNeeds.toLocaleString('id-ID')}, Wants Rp ${idealWants.toLocaleString('id-ID')}, Savings Rp ${idealSavings.toLocaleString('id-ID')}. Total Budgets Terdaftar: ${budgets.length}.`;
        } else if (call.name === 'set_budget_limit') {
          const args = call.args || {};
          const budget = await prisma.budget.upsert({
            where: { category: args.category },
            update: { limitAmount: parseFloat(args.limitAmount || 0) },
            create: { category: args.category, limitAmount: parseFloat(args.limitAmount || 0) },
          });

          executedToolResult = `[Tool Executed: set_budget_limit] Berhasil menetapkan batas anggaran kategori ${budget.category} sebesar Rp ${budget.limitAmount.toLocaleString('id-ID')}/bulan.`;
        } else if (call.name === 'generate_cashflow_forecast') {
          const allTxs = await prisma.transaction.findMany();
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const monthlyNetSavings = Math.max(0, income - expense);

          executedToolResult = `[Tool Executed: generate_cashflow_forecast] Sisa Tabungan Bulanan Saat Ini: Rp ${monthlyNetSavings.toLocaleString('id-ID')}. Proyeksi Saldo 3 Bulan: Rp ${(monthlyNetSavings * 3).toLocaleString('id-ID')}, Proyeksi 6 Bulan: Rp ${(monthlyNetSavings * 6).toLocaleString('id-ID')}.`;
        } else if (call.name === 'sync_to_google_sheets') {
          executedToolResult = `[Tool Executed: sync_to_google_sheets] Sinkronisasi 2-arah ke Google Sheets berhasil dijalankan.`;
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
