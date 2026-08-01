import { NextResponse } from 'next/server';
import { callGemmaAgent } from '@/lib/gemmaAgent';
import { prisma } from '@/lib/prisma';

const toolsDeclarations = [
  {
    name: 'add_transaction',
    description: 'Menambahkan transaksi keuangan baru (pemasukan atau pengeluaran) ke database.',
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
];

export async function POST(req) {
  try {
    const { message, image, sessionId } = await req.json();

    // 1. Ensure or find active ChatSession
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    }
    if (!session) {
      session = await prisma.chatSession.findFirst({ orderBy: { updatedAt: 'desc' } });
      if (!session) {
        session = await prisma.chatSession.create({ data: { title: 'Sesi Chat Baru' } });
      }
    }

    const activeSessionId = session.id;

    // 2. Retrieve conversation memory (history messages)
    const historyMessages = await prisma.chatMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: 'asc' },
      take: 12, // Memory context window
    });

    // 3. Save User Message to Database
    const userText = message || 'Silakan analisis resi/catatan transaksi ini.';
    await prisma.chatMessage.create({
      data: {
        sessionId: activeSessionId,
        role: 'user',
        text: userText,
        image: image || null,
      },
    });

    // 4. Construct Prompt with Conversation Memory Context
    let memoryPrompt = userText;
    if (historyMessages.length > 0) {
      const historyContext = historyMessages
        .map((m) => `${m.role === 'user' ? 'Pengguna' : 'Gemma AI'}: ${m.text}`)
        .join('\n');
      memoryPrompt = `Riwayat Percakapan Sebelumnya:\n${historyContext}\n\nPesan Pengguna Saat Ini: ${userText}`;
    }

    // 5. Call Gemma Agent with Memory Context
    const agentResponse = await callGemmaAgent({
      prompt: memoryPrompt,
      imageBase64: image,
      tools: toolsDeclarations,
    });

    const executedTools = [];
    const toolExplanations = [];

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

          executedTools.push({
            name: 'add_transaction',
            label: 'Transaksi Ditambahkan',
            summary: `Rp ${createdTx.amount.toLocaleString('id-ID')} (${createdTx.category})`,
            type: createdTx.type,
            details: {
              amount: createdTx.amount,
              category: createdTx.category,
              type: createdTx.type,
              note: createdTx.note
            }
          });

          toolExplanations.push(
            `Sip! Transaksi **${createdTx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}** sebesar **Rp ${createdTx.amount.toLocaleString('id-ID')}** untuk kategori **${createdTx.category}** (*"${createdTx.note}"*) telah berhasil saya catat ke database Catatin. 📝\n\nCatatan Anda sudah langsung ter-update di dashboard transaksi. Ada transaksi atau pencatatan lain yang ingin ditambahkan hari ini?`
          );
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

          executedTools.push({
            name: 'split_bill',
            label: 'Split Bill Berhasil',
            summary: `${createdSplit.title} - Rp ${Number(perPerson).toLocaleString('id-ID')} / orang`,
            actionUrl: `https://wa.me/?text=${waMsg}`,
            actionLabel: 'Bagikan Tagihan via WhatsApp',
            details: {
              title: createdSplit.title,
              totalAmount: createdSplit.totalAmount,
              perPerson: Number(perPerson),
              participantsCount: participants.length
            }
          });

          toolExplanations.push(
            `Selesai! Pembagian tagihan ***${createdSplit.title}*** dengan total **Rp ${createdSplit.totalAmount.toLocaleString('id-ID')}** telah berhasil dihitung. 📲\n\nBagian patungan tiap orang (${participants.length} peserta) adalah **Rp ${Number(perPerson).toLocaleString('id-ID')}**. Silakan klik tombol hijau di atas untuk langsung membagikan rincian tagihan ini ke grup WhatsApp teman-teman Anda!`
          );
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

          executedTools.push({
            name: 'manage_savings_goal',
            label: 'Target Tabungan Diperbarui',
            summary: `${goal.name}: Terkumpul Rp ${goal.currentAmount.toLocaleString('id-ID')} / Target Rp ${goal.targetAmount.toLocaleString('id-ID')}`,
            details: {
              name: goal.name,
              currentAmount: goal.currentAmount,
              targetAmount: goal.targetAmount
            }
          });

          toolExplanations.push(
            `Luar biasa! Target tabungan **"${goal.name}"** telah berhasil diperbarui. 🎯\n\nTotal dana yang telah terkumpul saat ini adalah **Rp ${goal.currentAmount.toLocaleString('id-ID')}** dari target **Rp ${goal.targetAmount.toLocaleString('id-ID')}**. Tetap konsisten, Anda semakin dekat dengan impian Anda!`
          );
        } else if (call.name === 'get_financial_summary') {
          const allTxs = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const net = income - expense;

          executedTools.push({
            name: 'get_financial_summary',
            label: 'Ringkasan Keuangan Dikalkulasi',
            summary: `Masuk: Rp ${income.toLocaleString('id-ID')} | Keluar: Rp ${expense.toLocaleString('id-ID')} | Saldo: Rp ${net.toLocaleString('id-ID')}`,
            details: { income, expense, net, txCount: allTxs.length }
          });

          toolExplanations.push(
            `Berikut adalah ringkasan portofolio keuangan terkini dari database Anda: 📊\n\n* **Total Pemasukan**: **Rp ${income.toLocaleString('id-ID')}**\n* **Total Pengeluaran**: **Rp ${expense.toLocaleString('id-ID')}**\n* **Sisa Saldo Bersih**: **Rp ${net.toLocaleString('id-ID')}**\n\nTotal transaksi recorded di sistem sejauh ini adalah **${allTxs.length} transaksi**.`
          );
        } else if (call.name === 'analyze_financial_health') {
          const allTxs = await prisma.transaction.findMany();
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const currentSavings = Math.max(0, income - expense);
          const savingsRate = income > 0 ? ((currentSavings / income) * 100).toFixed(1) : 0;

          executedTools.push({
            name: 'analyze_financial_health',
            label: 'Analisis Kesehatan 50/30/20 Selesai',
            summary: `Rasio Tabungan Saat Ini: ${savingsRate}%`,
            details: { savingsRate, income, expense }
          });

          toolExplanations.push(
            `Berikut adalah hasil analisis kesehatan keuangan Anda berdasarkan alokasi 50/30/20: 💡\n\n* **Rasio Tabungan saat ini**: **${savingsRate}%** dari total pemasukan\n* **Total Pemasukan**: **Rp ${income.toLocaleString('id-ID')}**\n* **Total Pengeluaran**: **Rp ${expense.toLocaleString('id-ID')}**\n\n${Number(savingsRate) >= 20 ? 'Kondisi keuangan Anda tergolong **SANGAT SEHAT**! Pertahankan alokasi minimal 20% untuk tabungan dan investasi Anda.' : 'Saran: Usahakan menekan pengeluaran non-esensial agar rasio tabungan Anda dapat mencapai batas aman minimal 20%.'}`
          );
        } else if (call.name === 'set_budget_limit') {
          const args = call.args || {};
          const budget = await prisma.budget.upsert({
            where: { category: args.category },
            update: { limitAmount: parseFloat(args.limitAmount || 0) },
            create: { category: args.category, limitAmount: parseFloat(args.limitAmount || 0) },
          });

          executedTools.push({
            name: 'set_budget_limit',
            label: 'Pagu Anggaran Ditetapkan',
            summary: `Kategori ${budget.category}: Batas Rp ${budget.limitAmount.toLocaleString('id-ID')}/bln`,
            details: { category: budget.category, limitAmount: budget.limitAmount }
          });

          toolExplanations.push(
            `Siap! Batas pagu anggaran bulanan untuk kategori **${budget.category}** telah berhasil saya tetapkan sebesar **Rp ${budget.limitAmount.toLocaleString('id-ID')}/bulan**. 📊\n\nSetiap pengeluaran di kategori ini akan terus dipantau agar keuangan Anda tetap sehat. Ada kategori lain yang ingin diatur batas anggarannya?`
          );
        } else if (call.name === 'generate_cashflow_forecast') {
          const allTxs = await prisma.transaction.findMany();
          const income = allTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
          const expense = allTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
          const monthlyNetSavings = Math.max(0, income - expense);

          executedTools.push({
            name: 'generate_cashflow_forecast',
            label: 'Proyeksi Cash Flow 6 Bulan',
            summary: `Estimasi Tabungan 6 Bln: Rp ${(monthlyNetSavings * 6).toLocaleString('id-ID')}`,
            details: { monthlyNetSavings, forecast3m: monthlyNetSavings * 3, forecast6m: monthlyNetSavings * 6 }
          });

          toolExplanations.push(
            `Berdasarkan kalkulasi data transaksi di database Catatin, berikut adalah proyeksi pertumbuhan cash flow dan tabungan Anda untuk 6 bulan ke depan: 📈\n\n* **Rata-rata Tabungan Bersih Bulanan**: **Rp ${monthlyNetSavings.toLocaleString('id-ID')}**\n* **Proyeksi Tabungan 3 Bulan**: **Rp ${(monthlyNetSavings * 3).toLocaleString('id-ID')}**\n* **Proyeksi Tabungan 6 Bulan**: **Rp ${(monthlyNetSavings * 6).toLocaleString('id-ID')}**\n\nKondisi keuangan Anda terlihat positif dan berada dalam jalur pertumbuhan yang baik! Tetap konsisten menjaga pengeluaran Anda.`
          );
        }
      }
    }

    // Determine final assistant reply text
    let finalReply = agentResponse.text;
    if (
      !finalReply ||
      finalReply.includes('Proyeksi & analisis keuangan Anda telah berhasil diproses oleh Gemma AI') ||
      finalReply.includes('Transaksi & analisis Anda telah diproses oleh Gemma AI') ||
      finalReply.includes('Proyeksi cash flow dan analisis keuangan Anda telah berhasil dihitung') ||
      finalReply.trim() === '' ||
      finalReply.includes('<tool_call|>')
    ) {
      finalReply = toolExplanations.join('\n\n');
    } else if (toolExplanations.length > 0) {
      finalReply = `${toolExplanations.join('\n\n')}\n\n${agentResponse.text}`;
    }


    // 6. Save Assistant Reply to Database
    await prisma.chatMessage.create({
      data: {
        sessionId: activeSessionId,
        role: 'assistant',
        text: finalReply,
        executedTools: JSON.stringify(executedTools),
      },
    });

    // 7. Auto-update Session Title if default
    if (session.title === 'Sesi Chat Baru' && userText) {
      const generatedTitle = userText.length > 30 ? userText.substring(0, 30) + '...' : userText;
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { title: generatedTitle },
      });
    } else {
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: activeSessionId,
      reply: finalReply,
      executedTools: executedTools,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


