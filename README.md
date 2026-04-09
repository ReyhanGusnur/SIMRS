# SIMRS

Sistem Informasi Manajemen Rumah Sakit (SIMRS) berbasis web yang dibangun untuk membantu pengelolaan layanan rumah sakit secara terintegrasi, mulai dari autentikasi pengguna, data pasien, data dokter, poli, pendaftaran, rekam medis, laboratorium, radiologi, farmasi, hingga keuangan.

## Deskripsi Project

Project ini terdiri dari dua bagian utama:

- `frontend` sebagai antarmuka pengguna
- `backend` sebagai REST API dan pengelola akses data

Backend menyediakan API SIMRS dengan modul-modul utama untuk operasional rumah sakit, sedangkan frontend digunakan untuk mengakses dan mengelola data melalui tampilan web.

## Fitur Utama

- Autentikasi dan otorisasi pengguna
- Manajemen data pasien
- Manajemen data dokter
- Manajemen data poli
- Manajemen pendaftaran pasien
- Manajemen rekam medis
- Manajemen laboratorium
- Manajemen radiologi
- Manajemen farmasi
- Manajemen keuangan
- Statistik dan analitik dasar
- Validasi request dan proteksi API

## Struktur Repository

```bash
SIMRS/
├── backend/
├── frontend/
└── .gitignore
```
## Struktur Backend
```bash
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── package.json
├── package-lock.json
└── server.js
```
## Teknologi yang Digunakan
Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt
- dotenv
- cors
- helmet
- morgan
- express-rate-limit

Frontend
- React
- Axios

## Endpoint Utama Backend
Base URL default Backend:
```bash
http://localhost:5000/api/v1
```
Daftar endpoint utama:
- `/auth`
- `/pasien`
- `/dokter`
- `/poli`
- `/pendaftaran`
- `/rekam-medis`
- `/laboratorium`
- `/radiologi`
- `/farmasi`
- `/keuangan`

## Cara Menjalankan Project
1. Clone repository
```bash
git clone https://github.com/ReyhanGusnur/SIMRS.git
cd SIMRS
```
2. Setup backend
Masuk ke folder backend:
```bash
cd backend
```
Install dependency:
```bash
npm install
```
Buat file `.env` berdasarkan kebutuhan project. Contoh konfigurasi:
```bash
PORT=5000
NODE_ENV=development
API_VERSION=v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=simrs_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
Jalankan backend:
```bash
npm run dev
```
Atau:
```bash
npm start
```
3. Setup frontend
Buka terminal baru lalu masuk ke folder frontend:
```bash
cd frontend
```
Install dependency frontend:
```bash
npm install
```
Tambahkan environment variable untuk koneksi API jika diperlukan:
```bash
REACT_APP_API_URL=http://localhost:5000/api/v1
```
Jalankan frontend:
```bash
npm start
```
## Konfigurasi Environment
### Backend
Beberapa variabel environment yang digunakan di backend:
- `PORT`
- `NODE_ENV`
- `API_VERSION`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

### Frontend
Variabel environment frontend:
- `REACT_APP_API_URL`

## Script Backend
Script yang tersedia pada backend:
```bash
npm start
npm run dev
npm run migrate
npm run seed
```
## Tujuan Pengembangan
Project ini dibuat sebagai project personal untuk mengembangkan sistem informasi rumah sakit yang modular, terstruktur, dan mudah dikembangkan lebih lanjut.

## Pengembangan Selanjutnya
Beberapa pengembangan yang dapat ditambahkan:
- Dashboard statistik yang lebih lengkap
- Manajemen role dan permission yang lebih detail
- Upload dokumen medis
- Notifikasi antrean pasien
- Laporan keuangan dan operasional
- Unit testing dan integration testing
- Deployment ke server production
