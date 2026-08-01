# 🚀 Panduan & Aturan Deployment Catatin Application di Cloud Server / VPS (MySQL Database)

Dokumen ini berisi **aturan eksekusi otomatis untuk AI Agent** dan **langkah-langkah praktis** untuk mendepolay aplikasi Catatin di Cloud Server (VPS Ubuntu/Debian, Compute Engine, AWS EC2, DigitalOcean, Hetzner, atau Google Cloud Run) dengan **Database MySQL**.

---

## 🤖 Aturan Standar Eksekusi AI Agent (Agent Deployment Rules)

Ketika Anda (pengguna) memberikan perintah seperti:
> *"Deploy aplikasi Catatin ini ke cloud server saya"*  
> *"Jalankan deployment di VPS"*  
> *"Deploy ulang kode terbaru ke server"*

AI Agent **WAJIB** mengikuti protokol urutan perintah berikut secara otomatis:

1. **Periksa File `.env` Server**:
   Pastikan file `.env` sudah ada dan terisi dengan API Key yang valid (`GEMMA_API_KEY`, credential Google Sheets, dan konfigurasi MySQL `DATABASE_URL`). Jika belum, salin `.env.example` ke `.env`.
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

## ⚙️ 1. Setup Environment Variables (`.env`)

Sebelum menjalankan aplikasi di cloud server, siapkan file `.env` di root direktori project:

```bash
cp .env.example .env
nano .env
```

Isi variabel environment sesuai credential MySQL & Google API Anda:

```env
# Database Connection MySQL
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://catatin_user:catatin_password@localhost:3306/catatin_db"

# Docker MySQL Credentials
MYSQL_ROOT_PASSWORD="rootpassword"
MYSQL_DATABASE="catatin_db"
MYSQL_USER="catatin_user"
MYSQL_PASSWORD="catatin_password"

# Google Agent Development Kit (Gemma 4 26B A4B IT Model API Key)
GEMMA_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Google Sheets API Service Account Credentials (2-Way Sync)
GOOGLE_CLIENT_EMAIL="catatin-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_RSA_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdXXXXXX_your_sheet_id_XXXXX"
```

---

## 🛠️ 2. Cara Deployment (Pilihan Metode)

### 🥇 Metode A: 1-Click Script Automated + Docker MySQL (Direkomendasikan)

Cukup jalankan satu perintah berikut di terminal cloud server:

```bash
./deploy.sh docker
```

Script ini akan secara otomatis:
1. Menjalankan container **MySQL 8.0** (`catatin_mysql`) dengan healthcheck.
2. Meng-kompilasi Next.js production build (`output: standalone`).
3. Mengaplikasikan migrasi/schema Prisma ke MySQL (`npx prisma db push`).
4. Menjalankan container aplikasi `catatin_app` dan melakukan tes status (`health check`).

---

### 🥈 Metode B: Docker & Docker Compose (Manual)

1. **Build dan Jalankan Container (MySQL + Catatin App)**:
   ```bash
   docker compose up -d --build
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

*Note: Data MySQL tersimpan secara permanen pada Docker Volume `mysql_data` sehingga data transaksi tidak akan hilang saat container di-restart atau di-rebuild.*

---

### 🥉 Metode C: Node.js + PM2 (Menggunakan MySQL Server Eksternal/Lokal)

Jika Anda sudah menginstal MySQL Server secara terpisah di VPS:

1. **Buat Database di MySQL**:
   ```sql
   CREATE DATABASE catatin_db;
   CREATE USER 'catatin_user'@'localhost' IDENTIFIED BY 'catatin_password';
   GRANT ALL PRIVILEGES ON catatin_db.* TO 'catatin_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Instalasi Dependencies & Prisma Sync**:
   ```bash
   npm ci --production=false
   npx prisma db push
   ```

3. **Build & Start via PM2**:
   ```bash
   npm run build
   pm2 reload catatin || pm2 start npm --name "catatin" -- start
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

---

## 🔍 5. Troubleshooting Ringkas

- **Error MySQL Connection Access Denied / Connection Refused**:  
  Pastikan container MySQL sudah dalam status `healthy` (`docker compose ps`). Periksa `DATABASE_URL` di file `.env`.
- **Database lock / error Prisma**:  
  Jalankan `npx prisma db push` ulang di terminal.
- **Log error Gemma / Google API**:  
  Pastikan `GEMMA_API_KEY` aktif di Google AI Studio dan Service Account Google Sheets memiliki akses editer pada Spreadsheet ID yang dituju.
