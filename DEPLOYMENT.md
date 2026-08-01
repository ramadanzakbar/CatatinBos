# 🚀 Panduan & Aturan Deployment Catatin Application di Google Cloud & Cloud Server / VPS

Dokumen ini berisi **aturan eksekusi otomatis untuk AI Agent** dan **langkah-langkah praktis** untuk mendepolay aplikasi Catatin di Google Cloud (Google Cloud Run & Cloud SQL MySQL), serta pilihan pendukung di VPS / Cloud Server (Docker & PM2).

---

## 🔀 Skema Dual Database (SQLite vs MySQL)

Aplikasi Catatin dikonfigurasi dengan arsitektur Dual Database:

| Environment | File Config | Database Engine | File Schema Prisma | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Local Development** | `.env` | **SQLite** (`dev.db`) | `prisma/schema.prisma` | Pengujian cepat tanpa install MySQL di komputer lokal. |
| **Google Cloud Production** | Secret Manager / `.env.prod` | **Cloud SQL MySQL 8.0** | `prisma/schema.mysql.prisma` | Fully Managed Serverless MySQL di Google Cloud Platform. |
| **VPS Production** | `.env.prod` | **MySQL 8.0 Container** | `prisma/schema.mysql.prisma` | Deployment di VPS / Docker host. |

---

## 🤖 Aturan Standar Eksekusi AI Agent (Agent Deployment Rules)

Ketika Anda (pengguna) memberikan perintah seperti:
> *"Deploy aplikasi Catatin ini ke Google Cloud"*  
> *"Jalankan deployment Cloud Run dan Cloud SQL"*  
> *"Deploy ulang kode terbaru ke server"*

AI Agent **WAJIB** mengikuti protokol urutan perintah berikut secara otomatis:

### 🏆 A. Deployment Google Cloud Run + Cloud SQL MySQL (Utama)
1. **Periksa File `.env.prod` / Secret Manager**:
   Pastikan file `.env.prod` sudah terisi dengan credential Google API (`GEMMA_API_KEY`, credential Google Sheets, dan variabel database).
2. **Eksekusi Script Deployment Google Cloud**:
   Jalankan script otomatis:
   ```bash
   ./deploy-cloudrun.sh [GCP_PROJECT_ID] [GCP_REGION]
   ```
3. **Verifikasi Status (Health Check)**:
   Periksa HTTP response URL Cloud Run yang dihasilkan.
4. **Laporkan Hasil**:
   Berikan URL aktif Google Cloud Run dan status Cloud SQL ke pengguna.

### 🥈 B. Deployment VPS / Docker Host (Alternatif)
Jika dipicu untuk VPS non-GCP:
```bash
./deploy.sh docker
curl -I http://localhost:3000
```

---

## ⚙️ 1. Setup Production Environment Variables (`.env.prod`)

Sebelum menjalankan deployment, siapkan file `.env.prod` di root direktori project:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Isi variabel environment produksi sesuai credential MySQL & Google API Anda:

```env
# Database Connection MySQL (Production)
DATABASE_URL="mysql://catatin_user:catatin_password@mysql:3306/catatin_db"

# Google Agent Development Kit (Gemma 4 26B A4B IT Model API Key)
GEMMA_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Google Sheets API Service Account Credentials (2-Way Sync)
GOOGLE_CLIENT_EMAIL="catatin-prod-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_RSA_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdXXXXXX_your_sheet_id_XXXXX"
```

---

## 🛠️ 2. Cara Deployment (Pilihan Metode)

### 🌟 Google Cloud Native: 1-Click Cloud Run + Cloud SQL MySQL (`./deploy-cloudrun.sh`)

Cukup jalankan satu perintah berikut di terminal:

```bash
./deploy-cloudrun.sh <YOUR_GCP_PROJECT_ID> asia-southeast2
```

Script ini secara otomatis:
1. Mengaktifkan GCP API yang dibutuhkan (`run`, `sqladmin`, `secretmanager`, `cloudbuild`).
2. Membuat instance **Cloud SQL MySQL 8.0** (`catatin-mysql`) & database `catatin_db` di Google Cloud.
3. Menyimpan kredensial rahasia secara aman di **Google Secret Manager**.
4. Melakukan build container image menggunakan **Google Cloud Build**.
5. Menggunakan schema MySQL `prisma/schema.mysql.prisma`.
6. Mendeploy service ke **Google Cloud Run** dengan koneksi socket Cloud SQL dan Secret Manager bindings.
7. Menginisialisasi/sync tabel Prisma ke MySQL (`prisma db push`) secara otomatis saat container pertama kali berjalan.
8. Menjalankan Health Check dan menampilkan HTTPS URL resmi dari Cloud Run.

---

### 🐳 Metode VPS / Docker Host: `./deploy.sh docker`

Untuk deployment di Server VPS biasa menggunakan Docker Compose:

```bash
./deploy.sh docker
```

Script ini secara otomatis:
1. Membaca variabel dari `.env.prod`.
2. Menjalankan container **MySQL 8.0** (`catatin_mysql`) dengan healthcheck.
3. Meng-kompilasi Next.js production build (`output: standalone`).
4. Mengaplikasikan migrasi/schema Prisma ke MySQL (`npx prisma db push`).
5. Menjalankan container aplikasi `catatin_app` di port 3000.

---

### ⚡ Metode PM2: `./deploy.sh pm2`

Untuk deployment di server tanpa Docker:

```bash
./deploy.sh pm2
```

---

## 💾 3. Backup Data MySQL Database

Untuk membuat cadangan (backup) database MySQL:

### A. Cloud SQL MySQL (Google Cloud)
```bash
gcloud sql backups create --instance=catatin-mysql
```

### B. Docker Container MySQL
```bash
docker exec catatin_mysql mysqldump -u catatin_user -pcatatin_password catatin_db > backup_catatin_$(date +%Y%m%d_%H%M%S).sql
```
