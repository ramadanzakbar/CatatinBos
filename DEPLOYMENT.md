# 🚀 Panduan & Aturan Deployment Catatin Application di Cloud Server / VPS

Dokumen ini berisi **aturan eksekusi otomatis untuk AI Agent** dan **langkah-langkah praktis** untuk mendepolay aplikasi Catatin di Cloud Server (VPS Ubuntu/Debian, Compute Engine, AWS EC2, DigitalOcean, Hetzner, atau Google Cloud Run).

---

## 🔀 Skema Dual Database (SQLite vs MySQL)

Aplikasi Catatin dikonfigurasi dengan arsitektur Dual Database:

| Environment | File Config | Database Engine | File Schema Prisma | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Local Development** | `.env` | **SQLite** (`dev.db`) | `prisma/schema.prisma` | Untuk pengujian cepat tanpa install MySQL di lokal. |
| **Production Cloud** | `.env.prod` | **MySQL 8.0** | `prisma/schema.mysql.prisma` | Untuk deployment di VPS / Cloud Server (High Performance). |

---

## 🤖 Aturan Standar Eksekusi AI Agent (Agent Deployment Rules)

Ketika Anda (pengguna) memberikan perintah seperti:
> *"Deploy aplikasi Catatin ini ke cloud server saya"*  
> *"Jalankan deployment di VPS"*  
> *"Deploy ulang kode terbaru ke server"*

AI Agent **WAJIB** mengikuti protokol urutan perintah berikut secara otomatis:

1. **Periksa File `.env.prod` Server**:
   Pastikan file `.env.prod` sudah ada dan terisi dengan API Key produksi yang valid (`GEMMA_API_KEY`, credential Google Sheets, dan koneksi MySQL `DATABASE_URL`). Jika belum, salin `.env.prod.example` ke `.env.prod`.
2. **Eksekusi Deployment**:
   Jalankan script otomatis:
   ```bash
   ./deploy.sh docker
   ```
   *(Atau `./deploy.sh pm2` jika server menggunakan MySQL terpisah/lokal tanpa Docker).*
3. **Verifikasi Status (Health Check)**:
   Jalankan pemeriksaan HTTP response:
   ```bash
   curl -I http://localhost:3000
   ```
4. **Laporkan Hasil**:
   Berikan ringkasan status container/proses (`docker compose ps` / `pm2 status`) dan URL akses ke pengguna.

---

## ⚙️ 1. Setup Production Environment Variables (`.env.prod`)

Sebelum menjalankan aplikasi di cloud server, siapkan file `.env.prod` di root direktori project:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Isi variabel environment produksi sesuai credential MySQL & Google API Anda:

```env
# Database Connection MySQL (Production)
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://catatin_user:catatin_password@mysql:3306/catatin_db"

# Docker MySQL Credentials
MYSQL_ROOT_PASSWORD="rootpassword"
MYSQL_DATABASE="catatin_db"
MYSQL_USER="catatin_user"
MYSQL_PASSWORD="catatin_password"

# Google Agent Development Kit (Gemma 4 26B A4B IT Model API Key)
GEMMA_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Google Sheets API Service Account Credentials (2-Way Sync)
GOOGLE_CLIENT_EMAIL="catatin-prod-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_RSA_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdXXXXXX_your_sheet_id_XXXXX"
```

---

## 🛠️ 2. Cara Deployment (Pilihan Metode)

### 🥇 Metode A: 1-Click Script Automated + Docker MySQL + `.env.prod` (Direkomendasikan)

Cukup jalankan satu perintah berikut di terminal cloud server:

```bash
./deploy.sh docker
```

Script ini secara otomatis:
1. Membaca variabel dari `.env.prod`.
2. Menggunakan schema MySQL `prisma/schema.mysql.prisma`.
3. Menjalankan container **MySQL 8.0** (`catatin_mysql`) dengan healthcheck.
4. Meng-kompilasi Next.js production build (`output: standalone`).
5. Mengaplikasikan migrasi/schema Prisma ke MySQL (`npx prisma db push`).
6. Menjalankan container aplikasi `catatin_app` dan melakukan tes status (`health check`).

---

### 🥈 Metode B: Docker & Docker Compose (Manual dengan `.env.prod`)

1. **Build dan Jalankan Container (MySQL + Catatin App dengan `.env.prod`)**:
   ```bash
   docker compose --env-file .env.prod up -d --build
   ```

2. **Cek Status Container & Health**:
   ```bash
   docker compose ps
   ```

3. **Melihat Log Aplikasi & MySQL**:
   ```bash
   docker compose logs -f
   ```

4. **Memberhentikan Service**:
   ```bash
   docker compose down
   ```

---

### 🥉 Metode C: Node.js + PM2 (Menggunakan `.env.prod`)

1. **Export Environment Variables dari `.env.prod`**:
   ```bash
   export $(grep -v '^#' .env.prod | xargs)
   ```

2. **Instalasi Dependencies & Sync Prisma MySQL**:
   ```bash
   npm ci --production=false
   npx prisma db push --schema=prisma/schema.mysql.prisma
   npx prisma generate --schema=prisma/schema.mysql.prisma
   ```

3. **Build & Start via PM2**:
   ```bash
   npm run build
   pm2 reload catatin || pm2 start npm --name "catatin" --update-env -- start
   pm2 save
   ```

---

## 🔒 3. Setup Domain, Nginx Reverse Proxy & SSL (HTTPS)

1. **Instal Nginx & Certbot**:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Buat Konfigurasi Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/catatin
   ```

   Tambahkan isi berikut:
   ```nginx
   server {
       server_name catatin.domainanda.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Aktifkan Konfigurasi & HTTPS SSL**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/catatin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d catatin.domainanda.com
   ```

---

## 💾 4. Backup Data MySQL Database

Untuk membuat cadangan (backup) database MySQL:

```bash
# Backup dari Docker Container MySQL
docker exec catatin_mysql mysqldump -u catatin_user -pcatatin_password catatin_db > backup_catatin_$(date +%Y%m%d_%H%M%S).sql

# Restore MySQL Backup
docker exec -i catatin_mysql mysql -u catatin_user -pcatatin_password catatin_db < backup_catatin_20260801_120000.sql
```
