const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Catatin application...');

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.splitBill.deleteMany();

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // 1. Seed Realistic Transactions
  const transactions = [
    { type: 'INCOME', amount: 15000000, category: 'Salary', note: 'Gaji Bulanan Utama PT Tech', source: 'MANUAL', date: daysAgo(25) },
    { type: 'INCOME', amount: 3500000, category: 'Freelance', note: 'Proyek Desain Web Client A', source: 'MANUAL', date: daysAgo(18) },
    { type: 'INCOME', amount: 1200000, category: 'Investment', note: 'Dividen Reksa Dana Saham', source: 'MANUAL', date: daysAgo(10) },
    { type: 'EXPENSE', amount: 3200000, category: 'Bills', note: 'Sewa Apartemen & Air Listrik', source: 'MANUAL', date: daysAgo(24) },
    { type: 'EXPENSE', amount: 850000, category: 'Food', note: 'Belanja Bulanan Supermarket', source: 'MANUAL', date: daysAgo(22) },
    { type: 'EXPENSE', amount: 150000, category: 'Transport', note: 'Isi Bensin & Tol Minggu 1', source: 'MANUAL', date: daysAgo(20) },
    { type: 'EXPENSE', amount: 450000, category: 'Food', note: 'Makan Malam Resto bersama Tim', source: 'CHATBOT', date: daysAgo(16) },
    { type: 'EXPENSE', amount: 250000, category: 'Entertainment', note: 'Langganan Netflix & Spotify', source: 'MANUAL', date: daysAgo(15) },
    { type: 'EXPENSE', amount: 1200000, category: 'Shopping', note: 'Beli Sepatu Olahraga Baru', source: 'MANUAL', date: daysAgo(12) },
    { type: 'EXPENSE', amount: 350000, category: 'Food', note: 'Kopi & Snack Co-working Space', source: 'CHATBOT', date: daysAgo(9) },
    { type: 'EXPENSE', amount: 180000, category: 'Transport', note: 'Voucher Grab & Gojek', source: 'MANUAL', date: daysAgo(7) },
    { type: 'EXPENSE', amount: 650000, category: 'Food', note: 'Struk Belanja Sayur & Daging Segar', source: 'CHATBOT', date: daysAgo(4) },
    { type: 'EXPENSE', amount: 300000, category: 'Entertainment', note: 'Tiket Nonton Bioskop & Popcorn', source: 'MANUAL', date: daysAgo(2) },
    { type: 'EXPENSE', amount: 120000, category: 'Transport', note: 'Servis Ringan Motor', source: 'MANUAL', date: daysAgo(1) },
  ];

  for (const t of transactions) {
    await prisma.transaction.create({ data: t });
  }

  // 2. Seed Budgets
  const budgets = [
    { category: 'Food', limitAmount: 2500000 },
    { category: 'Transport', limitAmount: 1000000 },
    { category: 'Entertainment', limitAmount: 800000 },
    { category: 'Shopping', limitAmount: 1500000 },
  ];

  for (const b of budgets) {
    await prisma.budget.create({ data: b });
  }

  // 3. Seed Savings Goals
  const goals = [
    { name: 'Dana Darurat 6 Bulan', targetAmount: 25000000, currentAmount: 12500000 },
    { name: 'Laptop MacBook Pro M3', targetAmount: 22000000, currentAmount: 8800000 },
    { name: 'Liburan Akhir Tahun Bali', targetAmount: 7500000, currentAmount: 3200000 },
  ];

  for (const g of goals) {
    await prisma.goal.create({ data: g });
  }

  // 4. Seed Split Bill
  await prisma.splitBill.create({
    data: {
      title: 'Makan Malam Reuni Alumni',
      totalAmount: 900000,
      taxPercent: 10,
      servicePercent: 5,
      paymentDetails: 'BCA 1234567890 a.n Catatin User',
      participants: JSON.stringify([
        { name: 'Saya', phone: '', paid: true, amount: 345000 },
        { name: 'Budi', phone: '08123456789', paid: false, amount: 345000 },
        { name: 'Ani', phone: '08987654321', paid: true, amount: 345000 },
      ]),
    },
  });

  // 5. Seed Chat Sessions & Memory Messages
  await prisma.chatSession.create({
    data: {
      title: 'Analisis Keuangan & Budgeting 50/30/20',
      messages: {
        create: [
          {
            role: 'assistant',
            text: 'Halo! Saya **Gemma 4 AI Financial Planner & Personal Wealth Advisor** 💡\n\nAda yang bisa saya bantu untuk analisis atau pencatatan keuangan Anda?',
          },
          {
            role: 'user',
            text: 'Tolong analisis alokasi 50/30/20 dan batasi budget makan bulanan 2.500.000.',
          },
          {
            role: 'assistant',
            text: 'Pagu anggaran kategori **Food** berhasil ditetapkan sebesar **Rp 2.500.000/bulan**.\n\nBerdasarkan prinsip **50/30/20**:\n* **Needs (50%)**: Rp 7.500.000\n* **Wants (30%)**: Rp 4.500.000\n* **Savings (20%)**: Rp 3.000.000\n\nProyeksi tabungan Anda terlihat sehat dan berada dalam jalur yang tepat! 🚀',
            executedTools: JSON.stringify([
              {
                name: 'set_budget_limit',
                label: 'Pagu Anggaran Ditetapkan',
                summary: 'Kategori Food: Batas Rp 2.500.000/bln',
                details: { category: 'Food', limitAmount: 2500000 },
              },
            ]),
          },
        ],
      },
    },
  });

  console.log('✅ Database dummy seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
