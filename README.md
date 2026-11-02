# CRUD Produk — Next.js + MySQL (Aiven) + Vercel

Aplikasi CRUD sederhana (Create, Read, Update, Delete) untuk data "produk",
dibangun dengan Next.js App Router dan database MySQL, siap deploy ke Vercel
dengan database di Aiven.

## Struktur Project

```
app/
  api/auth/login/route.js       -> POST (login)
  api/auth/register/route.js    -> POST (create account)
  api/categories/route.js       -> GET (list), POST (create)
  api/products/route.js         -> GET (list), POST (create)
  api/products/[id]/route.js    -> GET (detail), PUT (update), DELETE
  page.js                       -> Halaman utama (tabel + form)
  layout.js
  globals.css
lib/
  db.js                         -> Koneksi pool MySQL (support SSL Aiven)
migrate_categories.sql          -> Migrasi kategori untuk database lama
schema.sql                      -> Skema tabel `products` dan `categories`
.env.local.example              -> Contoh environment variables
```

## 1. Buat Database di Aiven

1. Login ke https://aiven.io lalu buat service baru → pilih **MySQL** → plan **Free**.
2. Pilih region terdekat, tunggu status menjadi "Running".
3. Buka tab **Overview**, catat: `Host`, `Port`, `User` (biasanya `avnadmin`), `Password`, `Database name` (default `defaultdb`).
4. Download **CA Certificate** (`ca.pem`) dari halaman yang sama.
5. Buat tabelnya (termasuk akun dan sesi login). Bisa lewat Aiven Console (query editor) atau CLI MySQL:
   ```bash
   mysql --host=<HOST> --port=<PORT> --user=<USER> --password=<PASSWORD> \
     --database=<DBNAME> --ssl-mode=REQUIRED < schema.sql
   ```

Jika tabel `products` sudah ada sebelum kolom kategori ditambahkan, jalankan
migrasi berikut **satu kali** melalui Aiven Console atau MySQL CLI:

```bash
mysql --host=<HOST> --port=<PORT> --user=<USER> --****** \
  --database=<DBNAME> --ssl-mode=REQUIRED < migrate_categories.sql
```

Migrasi tersebut membuat tabel `categories`, menambahkan `products.category_id`,
dan menghubungkannya ke kategori. Jangan jalankan ulang setelah berhasil karena
kolom dan foreign key hanya perlu ditambahkan satu kali.

## 2. Setup Project Secara Lokal

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` dengan kredensial Aiven kamu:

```
DB_HOST=your-service.aivencloud.com
DB_PORT=xxxxx
DB_USER=avnadmin
DB_PASSWORD=xxxxx
DB_NAME=defaultdb
DB_CA_CERT=<base64 dari ca.pem>
CORS_ORIGIN=https://alamat-flutter-web-kamu.example
```

Generate nilai `DB_CA_CERT` dari file `ca.pem` yang tadi didownload:

```bash
base64 -i ca.pem | tr -d '\n'
```

Copy hasilnya (satu baris panjang) ke `.env.local`.

Jalankan secara lokal:

```bash
npm run dev
```

Buka http://localhost:3000 — kamu akan melihat form tambah produk dan tabel daftar produk.

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: CRUD produk Next.js + MySQL"
git branch -M main
git remote add origin https://github.com/username/nama-repo.git
git push -u origin main
```

Pastikan `.env.local` **tidak** ikut ter-commit (sudah otomatis diabaikan lewat `.gitignore`).

## 4. Deploy ke Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. Klik **Add New → Project**, pilih repo yang baru saja di-push.
3. Di bagian **Environment Variables**, tambahkan variabel yang sama persis seperti di `.env.local`:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_CA_CERT`
   - `CORS_ORIGIN` (origin web Flutter yang diizinkan memanggil API)
4. Klik **Deploy**.
5. Setelah selesai, buka URL yang diberikan Vercel (`https://nama-project.vercel.app`) — aplikasi CRUD sudah bisa dipakai.

## Fitur

- **Daftar dan Login**: membuat akun dan memverifikasi password dengan hash scrypt; sesi disimpan sebagai hash token
- **Create**: tambah produk baru lewat form (nama, deskripsi, harga)
- **Read**: daftar semua produk otomatis dimuat saat halaman dibuka
- **Update**: klik "Edit" pada baris produk untuk mengubah data
- **Delete**: klik "Hapus" untuk menghapus produk (dengan konfirmasi)
- **Kategori**: pilih kategori saat membuat atau mengedit produk
- **Cari, filter, dan urutkan** produk berdasarkan nama, kategori, atau harga

## Catatan

- Free tier Aiven MySQL bisa nonaktif otomatis setelah periode idle tertentu — kamu akan mendapat notifikasi email sebelum itu terjadi.
- Jika database sudah dibuat sebelum tabel autentikasi ditambahkan, jalankan ulang perintah `schema.sql` agar tabel `users` dan `sessions` dibuat.
- Android Emulator mengakses server komputer melalui `http://10.0.2.2:3000/api`; Windows/web lokal menggunakan `http://localhost:3000/api`. Untuk Android fisik, gunakan IP komputer di jaringan lokal.
- APK debug untuk Android fisik (ponsel dan komputer harus berada di Wi-Fi yang sama):
  ```powershell
  flutter build apk --debug --dart-define=API_BASE_URL=http://IP-KOMPUTER:3000/api
  ```
  Cari IP komputer dengan `ipconfig`. Server harus berjalan dan firewall harus mengizinkan koneksi ke port `3000`. URL HTTP lokal ini hanya untuk pengujian debug; APK release harus memakai URL backend HTTPS yang sudah di-deploy:
  ```powershell
  flutter build apk --release --dart-define=API_BASE_URL=https://domain-backend-kamu/api
  ```
- Pastikan sertifikat CA Aiven yang benar tersedia sebagai `DB_CA_CERT` (base64 dari file CA Aiven) di konfigurasi server. Jangan menonaktifkan verifikasi TLS.
- Kalau ingin menambah kolom atau tabel baru, cukup ubah `schema.sql` dan sesuaikan query di `app/api/products/`.
