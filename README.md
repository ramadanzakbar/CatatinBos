# 🐱 Catatin (CatatinBos) - Smart AI Financial Advisor & Management Platform

> **Gemma Hackathon Project (Cloud Next Extended Jakarta 2026)**  
> *Aplikasi Pengelolaan Keuangan Cerdas Berbasis **Google Gemma 4 26B A4B IT (Multimodal & Function Calling)**, Dual-State Sync (SQLite + Google Sheets API), dan Interactive Financial Visual Analytics.*

---

## 🌟 Overview

**Catatin** adalah platform manajemen keuangan personal dan UMKM generasi baru yang memadukan kekuatan **Google Gemma 4 AI Agent** dengan sistem sinkronisasi data 2 arah (**Dual-State Storage**). Catatin tidak sekadar mencatat transaksi, melainkan bertindak sebagai **Autonomous Financial Wealth Advisor** yang secara proaktif menganalisis kondisi keuangan pengguna menggunakan metode penganggaran **50/30/20** (*Needs, Wants, Savings*), memproyeksikan *cashflow*, memindai struk/nota belanja multimodal, hingga memfasilitasi pembagian tagihan (*Split Bill*) dan pembayaran QRIS.

---

## 🚀 Fitur Unggulan (Key Features)

### 🤖 1. Gemma 4 Multimodal AI Assistant & Tool Calling
- **Slide-over Right Drawer**: Asisten AI Gemma selalu siap diakses melalui *floating action button* interaktif di pojok kanan bawah.
- **Function Calling / Tool Execution**: Gemma 4 secara otomatis memicu eksekusi fungsi backend:
  - `addTransaction`: Pencatatan transaksi otomatis dari prompt bahasa alami.
  - `set_budget_limit`: Menetapkan pagu anggaran kategori secara langsung.
  - `analyze_financial_health`: Mengkalkulasi skor kesehatan finansial dan rasio alokasi 50/30/20.
  - `generate_cashflow_forecast`: Proyeksi estimasi tabungan dan waktu pencapaian *financial goal*.
- **Multimodal Receipt Scan**: Memindai gambar struk/nota belanja via Gemma Vision AI untuk ekstraksi total harga, tanggal, vendor, dan kategori secara otomatis.

### 📊 2. Interactive Financial Dashboard & Analytics
- **Financial Metric Summary Cards**: Total Pemasukan, Total Pengeluaran, Rasio Tabungan Bersih (*Net Savings Rate*), dan Status Sinkronisasi Real-time.
- **Interactive Recharts Visualizations**:
  - *Expense Distribution Pie Chart*: Pie chart interaktif alokasi pengeluaran per kategori.
  - *Income vs Expense Bar Chart*: Komparasi arus kas bulanan.
  - *Financial Health Breakdown Card*: Gauge/indikator visual untuk rasio 50% Kebutuhan, 30% Keinginan, 20% Tabungan.

### 🎯 3. Budgeting & Financial Goal Manager
- **Category Budget Limits**: Pengaturan batas anggaran pengeluaran bulanan per kategori dengan *progress indicator* dinamis (Peringatan saat mendekati/melebihi limit).
- **Financial Goals Tracker**: Pelacakan target dana darurat, tabungan liburan, atau investasi lengkap dengan indikator persentase ketercapaian.

### 💸 4. Smart Split Bill & Dynamic QRIS Payment Generator
- **Kalkulasi Otomatis Pajak & Service Fee**: Menghitung pembagian tagihan kelompok secara adil dengan proporsi persentase pajak dan layanan.
- **Penagihan & QRIS Modal**: Menghasilkan QR Code QRIS dinamis dan detail rekening pembayaran untuk mempermudah anggota melakukan transfer/pembayaran.

### 🔄 5. Dual-State Storage & Google Sheets 2-Way Sync
- **Low-Latency SQLite (Prisma ORM)**: Menjamin performa aplikasi secepat kilat untuk membaca dan menulis data transaksi.
- **Google Sheets Cloud Backup**: Sinkronisasi 2 arah otomatis yang mencatat log audit transaksi ke `SyncLog` (Menangani *offline fallback* dan pemulihan data).

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

| Komponen | Teknologi / Library |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14 (App Router)](https://nextjs.org/) & [React 18](https://react.dev/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **AI Model & Agent** | **Google Gemma 4 26B A4B IT** via Google Agent Development Kit (ADK) & Multimodal Gemini API |
| **Visual Charting** | [Recharts](https://recharts.org/) |
| **Database & ORM** | [SQLite](https://www.sqlite.org/) + [Prisma ORM 5](https://www.prisma.io/) |
| **Cloud Backup & Sync** | [Google Sheets API v4](https://developers.google.com/sheets/api) via `googleapis` |

---

## 📁 Struktur Direktori Project

```text
catatin/
├── .agents/                # Skill & System Guidelines Agent ADK
├── app/                    # Next.js 14 App Router
│   ├── api/                # API Endpoints
│   │   ├── budgets/        # CRUD Pagu Anggaran
│   │   ├── chat/           # Endpoint Integrasi Gemma 4 AI Agent
│   │   ├── goals/          # CRUD Target Finansial
│   │   ├── ocr/            # Endpoint Scan Multimodal Struk Belanja
│   │   ├── split-bill/     # API Bagi Tagihan
│   │   └── transactions/   # CRUD Transaksi Pemasukan & Pengeluaran
│   ├── globals.css         # Styling global Tailwind
│   ├── layout.jsx          # Root Layout Aplikasi
│   └── page.jsx            # Main Dashboard Page
├── components/             # Reusable UI Components
│   ├── BudgetGoalManager.jsx     # Manajer Pagu & Target Finansial
│   ├── FinancialAnalysisView.jsx # Komponen Analisis 50/30/20 & Forecast
│   ├── FinancialDashboard.jsx    # Dashboard Utama & Ringkasan Metrik
│   ├── GemmaChatbot.jsx          # Right Drawer Chatbot AI Gemma 4
│   ├── MultimodalScanModal.jsx   # Modal Pindai Struk/Nota Belanja
│   ├── QRISModal.jsx             # Modal Pembayaran QRIS Dinamis
│   ├── Sidebar.jsx               # Navigation Sidebar Layout
│   ├── SplitBillModal.jsx        # Form Tambah Split Bill
│   ├── SplitBillView.jsx         # Tampilan Kelola & Detail Split Bill
│   └── TransactionsView.jsx      # Riwayat & Filter Tabel Transaksi
├── lib/
│   └── gemmaAgent.js       # Core Integration Engine Google Gemma 4 ADK
├── prisma/
│   ├── dev.db              # Local SQLite Database
│   └── schema.prisma       # Prisma Database Schemas
├── AGENTS.md               # Panduan Pengembangan & Aturan Agent
└── README.md               # Dokumentasi Utama Project
```

---

## ⚡ Panduan Memulai (Getting Started)

### 1. Prasyarat System
- **Node.js**: v18.0.0 atau lebih baru
- **npm** / **yarn** / **pnpm**
- **GEMMA_API_KEY**: Google Gemini / Gemma API Key (Dapatkan dari Google AI Studio)

### 2. Kloning Repository & Install Dependensi
```bash
git clone https://github.com/ramadanzakbar/CatatinBos.git
cd CatatinBos
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di direktori utama project berdasarkan `.env.example`:
```env
GEMMA_API_KEY="AIzaSyYourGemmaApiKeyHere"
DATABASE_URL="file:./dev.db"
# (Opsional) Google Sheets API Configuration
GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id"
GOOGLE_CLIENT_EMAIL="your_service_account_email"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 4. Inisialisasi Database SQLite via Prisma
```bash
npx prisma db push
```

### 5. Menjalankan Server Pengembang (Development Server)
```bash
npm run dev
```
Buka browser dan akses halaman aplikasi di **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Perintah Pengujian & Database Utility

- **Menjalankan Prisma Studio (GUI Database Viewer)**:
  ```bash
  npm run db:studio
  ```
- **Linting Kode**:
  ```bash
  npm run lint
  ```

---

## 📄 Lisensi

Project ini dilisensikan di bawah **[Apache-2.0 License](LICENSE)**.

---

<p center align="center">
  Dibuat dengan ❤️ oleh <b>Tim Catatin</b> untuk <b>Gemma Hackathon 2026 (Cloud Next Extended Jakarta)</b>.
</p>