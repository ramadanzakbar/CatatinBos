---
name: ai-writing-and-usage-rules
description: Aturan modern penulisan kode, petunjuk instruksi prompt, dan penggunaan AI Agent (Gemma 4 & Tool Calling) pada aplikasi Catatin.
---

# Aturan Penulisan Kode & Penggunaan AI (Modern AI Usage & Code Standards)

Skill ini menetapkan standar modern penulisan kode, pola prompt, serta etika dan tata cara penggunaan AI Agent (terutama Gemma 4 26B A4B IT & Google ADK) dalam proyek Catatin.

---

## 1. Aturan Penulisan Prompt & Interaksi AI (Prompting Rules)

### A. Format & Context Scoping
- Setiap prompt ke AI Agent harus menyertakan **Role**, **Context**, dan **Explicit Constraints**.
- Gunakan bahasa yang jelas, ringkas, dan Hindari *ambiguity*.
- Selalu batasi cakupan (scope) respons AI agar fokus pada fungsi finansial Catatin.

### B. Tool Calling Rules
- **Direct Action via Function Call**: Jika pengguna meminta pencatatan, pembaruan, penghapusan, atau sinkronisasi data transaksi, AI **WAJIB** mengeksekusi Tool Calling (`add_transaction`, `update_transaction`, `delete_transaction`, `sync_to_google_sheets`), bukan sekadar memberikan teks jawaban.
- **Konfirmasi Parameter**: AI harus memvalidasi parameter utama (jumlah nominal/`amount`, jenis/`type`, dan kategori/`category`) sebelum mengeksekusi aksi jika data dari pengguna kurang lengkap.

---

## 2. Aturan Penulisan Kode Modern (Modern Coding Standards)

### A. Next.js & React Native / React Best Practices
- **Server vs Client Components**: Gunakan React Server Components (RSC) secara default untuk data fetching. Tambahkan directive `'use client'` hanya pada komponen UI interaktif (seperti Form, Chart, dan Chat Dialog).
- **Clean Architecture & Decoupling**: Pisahkan UI component, handler logika agent, Prisma database layer, dan integrasi Google Sheets API ke dalam folder `lib/`, `components/`, dan `app/api/`.

### B. State & Data Integrity
- **Dual Storage Strategy**: 
  1. **SQLite via Prisma**: Sebagai data store utama berlatensi rendah.
  2. **Google Sheets API**: Sebagai cloud backup dan targets sync 2-arah.
- **Fallback & Resilience**: Setiap transaksi gagal sync ke Google Sheets harus dicatat di `SyncLog` tanpa menggagalkan operasi lokal di SQLite.

### C. Visual Financial Analytics
- Dashboard keuangan terpisah dari interface chatbot chat.
- Menggunakan library `recharts` untuk visualisasi visual interaktif (Pie Chart Kategori, Bar Chart Income vs Expense, Line Chart Tren Bulanan).
- Menggunakan Tailwind CSS untuk styling UI modern (dark mode support, glassmorphic card, modern micro-interactions).

---

## 3. Etika & Keamanan Penggunaan AI (AI Safety & Ethics)

1. **Privasi Data Keuangan**: Tidak mengirimkan data identitas sensitif pengguna ke luar selain ke endpoint terverifikasi (Prisma DB & Google Sheets pengguna).
2. **Deterministic Output**: Untuk perhitungan matematika/agregasi keuangan, selamanya gunakan agregasi database SQL (via Tool `get_financial_summary`), **JANGAN** mengandalkan estimasi hitungan teks dari LLM.
3. **No Phantom Writes**: Dilarang melakukan mutasi data tanpa persetujuan atau konfirmasi eksplisit dari pengguna.
