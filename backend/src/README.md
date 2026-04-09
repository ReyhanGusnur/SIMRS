# SIMRS Backend API - Complete Implementation  
   
Backend API untuk Sistem Informasi Manajemen Rumah Sakit (SIMRS) menggunakan Node.js, Express, dan PostgreSQL.  
   
## 🎉 Status: COMPLETE (10/10 Modules)  
   
Semua modul utama telah diimplementasikan dengan lengkap!  
   
## 🚀 Tech Stack  
   
- **Runtime**: Node.js v16+  
- **Framework**: Express.js  
- **Database**: PostgreSQL 14+  
- **Authentication**: JWT (JSON Web Token)  
- **Validation**: Express Validator  
- **Security**: Helmet, CORS, Rate Limiting, bcrypt  
   
## ✨ Implemented Modules  
   
### ✅ Core Modules (4)  
1. **Authentication** - Login, Register, JWT Token Management  
2. **Pasien (Patient)** - Complete patient management system  
3. **Dokter (Doctor)** - Doctor profiles, schedules, specializations  
4. **Poli (Polyclinic)** - Polyclinic/department management  
   
### ✅ Clinical Modules (5)  
5. **Pendaftaran (Registration)** - Patient registration & queue management  
6. **Rekam Medis (Medical Record)** - Electronic medical records (EMR)  
7. **Laboratorium (Laboratory)** - Lab tests, results, & tracking  
8. **Radiologi (Radiology)** - Radiology exams & imaging reports  
9. **Farmasi (Pharmacy)** - Prescriptions & medication dispensing  
   
### ✅ Financial Module (1)  
10. **Keuangan (Finance)** - Billing, payments, & financial reports  
   
## 📁 Complete Project Structure  
```  
backend/  
├── src/  
│   ├── config/  
│   │   └── database.js  
│   ├── controllers/  
│   │   ├── auth.controller.js  
│   │   ├── patient.controller.js  
│   │   ├── doctor.controller.js  
│   │   ├── poli.controller.js  
│   │   ├── registration.controller.js  
│   │   ├── medical-record.controller.js  
│   │   ├── laboratory.controller.js  
│   │   ├── radiology.controller.js  
│   │   ├── pharmacy.controller.js  
│   │   └── finance.controller.js  
│   ├── middleware/  
│   │   ├── auth.middleware.js  
│   │   ├── error.middleware.js  
│   │   └── validation.middleware.js  
│   ├── routes/  
│   │   ├── auth.routes.js  
│   │   ├── patient.routes.js  
│   │   ├── doctor.routes.js  
│   │   ├── poli.routes.js  
│   │   ├── registration.routes.js  
│   │   ├── medical-record.routes.js  
│   │   ├── laboratory.routes.js  
│   │   ├── radiology.routes.js  
│   │   ├── pharmacy.routes.js  
│   │   └── finance.routes.js  
│   └── utils/  
│       └── auth.js  
├── .env.example  
├── package.json  
├── README.md  
└── server.js  
```  
   
## 🛠️ Installation  
   
### 1. Clone & Install Dependencies  
```bash  
cd backend  
npm install  
```  
   
### 2. Setup Environment Variables  
```bash  
cp .env.example .env  
```  
   
Edit `.env` file:  
```env  
NODE_ENV=development  
PORT=5000  
   
# Database Configuration  
DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=simrs_db  
DB_USER=postgres  
DB_PASSWORD=your_password  
   
# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key  
JWT_EXPIRES_IN=24h  
JWT_REFRESH_EXPIRES_IN=7d  
   
# API Configuration  
API_VERSION=v1  
CORS_ORIGIN=http://localhost:3000  
   
# Rate Limiting  
RATE_LIMIT_WINDOW_MS=900000  
RATE_LIMIT_MAX_REQUESTS=100  
```  
   
### 3. Setup Database  
```bash  
# Create database  
createdb simrs_db  
   
# Run migration (import schema)  
psql -U postgres -d simrs_db -f ../simrs_database_schema.sql  
```  
   
### 4. Run Server  
```bash  
# Development mode (with auto-reload)  
npm run dev  
   
# Production mode  
npm start  
```  
   
Server akan berjalan di: `http://localhost:5000`  
   
## 📡 Complete API Endpoints  
   
### Authentication  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| POST | `/api/v1/auth/login` | User login | Public |  
| POST | `/api/v1/auth/register` | Register user | Admin |  
| GET | `/api/v1/auth/me` | Get profile | Private |  
| PUT | `/api/v1/auth/change-password` | Change password | Private |  
   
### Pasien (Patient)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/pasien` | Get all patients | Admin, Registrasi, Dokter, Perawat |  
| GET | `/api/v1/pasien/:id` | Get patient by ID | All Roles |  
| GET | `/api/v1/pasien/no-rm/:no_rm` | Get patient by No RM | All Roles |  
| GET | `/api/v1/pasien/stats` | Get statistics | Admin, Registrasi |  
| POST | `/api/v1/pasien` | Create patient | Admin, Registrasi |  
| PUT | `/api/v1/pasien/:id` | Update patient | Admin, Registrasi |  
| DELETE | `/api/v1/pasien/:id` | Delete patient | Admin |  
   
### Dokter (Doctor)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/dokter` | Get all doctors | All Roles |  
| GET | `/api/v1/dokter/:id` | Get doctor by ID | All Roles |  
| GET | `/api/v1/dokter/:id/jadwal` | Get doctor schedule | All Roles |  
| GET | `/api/v1/dokter/stats` | Get statistics | Admin |  
| GET | `/api/v1/dokter/spesialisasi/:spesialisasi` | Get by specialization | All Roles |  
| POST | `/api/v1/dokter` | Create doctor | Admin |  
| PUT | `/api/v1/dokter/:id` | Update doctor | Admin |  
| DELETE | `/api/v1/dokter/:id` | Delete doctor | Admin |  
   
### Poli (Polyclinic)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/poli` | Get all poli | All Roles |  
| GET | `/api/v1/poli/:id` | Get poli by ID | All Roles |  
| POST | `/api/v1/poli` | Create poli | Admin |  
| PUT | `/api/v1/poli/:id` | Update poli | Admin |  
| DELETE | `/api/v1/poli/:id` | Delete poli | Admin |  
   
### Pendaftaran (Registration)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/pendaftaran` | Get all registrations | Admin, Registrasi, Dokter, Perawat |  
| GET | `/api/v1/pendaftaran/:id` | Get registration by ID | Admin, Registrasi, Dokter, Perawat |  
| GET | `/api/v1/pendaftaran/queue/:poli_id?` | Get today's queue | All Roles |  
| GET | `/api/v1/pendaftaran/stats` | Get statistics | Admin, Registrasi |  
| POST | `/api/v1/pendaftaran` | Create registration | Admin, Registrasi |  
| PUT | `/api/v1/pendaftaran/:id/status` | Update status | Admin, Registrasi, Dokter, Perawat |  
| DELETE | `/api/v1/pendaftaran/:id` | Cancel registration | Admin, Registrasi |  
   
### Rekam Medis (Medical Record)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/rekam-medis` | Get all records | Admin, Dokter, Perawat |  
| GET | `/api/v1/rekam-medis/:id` | Get record by ID | Admin, Dokter, Perawat |  
| GET | `/api/v1/rekam-medis/pasien/:pasien_id` | Get records by patient | Admin, Dokter, Perawat |  
| GET | `/api/v1/rekam-medis/stats` | Get statistics | Admin, Dokter |  
| POST | `/api/v1/rekam-medis` | Create record | Dokter |  
| PUT | `/api/v1/rekam-medis/:id` | Update record | Dokter |  
   
### Laboratorium (Laboratory)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/laboratorium` | Get all lab requests | Admin, Laboratorium, Dokter |  
| GET | `/api/v1/laboratorium/:id` | Get lab request by ID | Admin, Laboratorium, Dokter |  
| GET | `/api/v1/laboratorium/pending` | Get pending requests | Admin, Laboratorium |  
| GET | `/api/v1/laboratorium/pasien/:pasien_id` | Get by patient | Admin, Laboratorium, Dokter |  
| GET | `/api/v1/laboratorium/stats` | Get statistics | Admin, Laboratorium |  
| POST | `/api/v1/laboratorium` | Create lab request | Dokter |  
| PUT | `/api/v1/laboratorium/:id/status` | Update status | Admin, Laboratorium |  
| PUT | `/api/v1/laboratorium/:id/result` | Submit result | Admin, Laboratorium |  
| PATCH | `/api/v1/laboratorium/:id/result` | Update result | Admin, Laboratorium |  
| DELETE | `/api/v1/laboratorium/:id` | Cancel request | Admin, Dokter |  
   
### Radiologi (Radiology)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/radiologi` | Get all radiology requests | Admin, Radiologi, Dokter |  
| GET | `/api/v1/radiologi/:id` | Get request by ID | Admin, Radiologi, Dokter |  
| GET | `/api/v1/radiologi/pending` | Get pending requests | Admin, Radiologi |  
| GET | `/api/v1/radiologi/pasien/:pasien_id` | Get by patient | Admin, Radiologi, Dokter |  
| GET | `/api/v1/radiologi/stats` | Get statistics | Admin, Radiologi |  
| POST | `/api/v1/radiologi` | Create radiology request | Dokter |  
| PUT | `/api/v1/radiologi/:id/status` | Update status | Admin, Radiologi |  
| PUT | `/api/v1/radiologi/:id/result` | Submit result | Admin, Radiologi |  
| PATCH | `/api/v1/radiologi/:id/result` | Update result | Admin, Radiologi |  
| DELETE | `/api/v1/radiologi/:id` | Cancel request | Admin, Dokter |  
   
### Farmasi (Pharmacy)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/farmasi` | Get all prescriptions | Admin, Farmasi, Dokter |  
| GET | `/api/v1/farmasi/:id` | Get prescription by ID | Admin, Farmasi, Dokter |  
| GET | `/api/v1/farmasi/pending` | Get pending prescriptions | Admin, Farmasi |  
| GET | `/api/v1/farmasi/pasien/:pasien_id` | Get by patient | Admin, Farmasi, Dokter |  
| GET | `/api/v1/farmasi/stats` | Get statistics | Admin, Farmasi |  
| POST | `/api/v1/farmasi` | Create prescription | Dokter |  
| PUT | `/api/v1/farmasi/:id/status` | Update status | Admin, Farmasi |  
| PUT | `/api/v1/farmasi/:id/dispense` | Dispense prescription | Admin, Farmasi |  
| PATCH | `/api/v1/farmasi/:id/medication/:detail_id` | Update medication | Admin, Farmasi |  
| DELETE | `/api/v1/farmasi/:id` | Cancel prescription | Admin, Dokter |  
   
### Keuangan (Finance)  
   
| Method | Endpoint | Description | Access |  
|--------|----------|-------------|--------|  
| GET | `/api/v1/keuangan` | Get all billings | Admin, Kasir |  
| GET | `/api/v1/keuangan/:id` | Get billing by ID | Admin, Kasir |  
| GET | `/api/v1/keuangan/unpaid` | Get unpaid billings | Admin, Kasir |  
| GET | `/api/v1/keuangan/pasien/:pasien_id` | Get by patient | Admin, Kasir |  
| GET | `/api/v1/keuangan/stats` | Get statistics | Admin, Kasir |  
| GET | `/api/v1/keuangan/revenue` | Get revenue report | Admin |  
| POST | `/api/v1/keuangan` | Create billing | Admin, Kasir |  
| PUT | `/api/v1/keuangan/:id/payment` | Process payment | Admin, Kasir |  
| DELETE | `/api/v1/keuangan/:id` | Cancel billing | Admin |  
   
## 🔐 Authentication  
   
API menggunakan JWT untuk autentikasi. Setelah login, simpan `accessToken` dan gunakan di header:  
```  
Authorization: Bearer YOUR_ACCESS_TOKEN  
```  
   
### Login Example  
```bash  
POST /api/v1/auth/login  
Content-Type: application/json  
   
{  
  "username": "admin",  
  "password": "admin123"  
}  
```  
   
Response:  
```json  
{  
  "success": true,  
  "message": "Login successful",  
  "data": {  
    "user": {  
      "user_id": "uuid",  
      "username": "admin",  
      "full_name": "Administrator",  
      "role": "admin"  
    },  
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",  
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."  
  }  
}  
```  
   
## 👥 User Roles & Permissions  
   
- **admin** - Full system access  
- **dokter** - Medical records, prescriptions, lab/radiology orders  
- **perawat** - Patient care, medical records (read)  
- **farmasi** - Pharmacy management, prescription dispensing  
- **laboratorium** - Laboratory test management  
- **radiologi** - Radiology exam management  
- **kasir** - Billing & payment processing  
- **registrasi** - Patient registration & scheduling  
   
## 🛡️ Security Features  
   
1. **Helmet** - Security headers protection  
2. **CORS** - Cross-Origin Resource Sharing control  
3. **Rate Limiting** - DDoS protection (100 req/15min)  
4. **JWT** - Secure token-based authentication  
5. **Password Hashing** - bcrypt encryption  
6. **Input Validation** - Express Validator  
7. **SQL Injection Prevention** - Parameterized queries  
8. **Role-Based Access Control** - Authorization middleware  
   
## 📝 Error Handling  
   
API mengembalikan error dalam format standar:  
```json  
{  
  "success": false,  
  "message": "Error message",  
  "errors": [  
    {  
      "field": "username",  
      "message": "Username is required"  
    }  
  ]  
}  
```  
   
## 🧪 Testing  
```bash  
# Test database connection  
curl http://localhost:5000/health  
   
# Test login  
curl -X POST http://localhost:5000/api/v1/auth/login \  
  -H "Content-Type: application/json" \  
  -d '{"username":"admin","password":"admin123"}'  
   
# Test patient creation (with auth token)  
curl -X POST http://localhost:5000/api/v1/pasien \  
  -H "Content-Type: application/json" \  
  -H "Authorization: Bearer YOUR_TOKEN" \  
  -d '{  
    "nama_lengkap": "John Doe",  
    "tanggal_lahir": "1990-01-01",  
    "jenis_kelamin": "Laki-laki",  
    "alamat": "Jakarta",  
    "telepon": "081234567890"  
  }'  
```  
   
## 📊 Database Schema  
   
Project ini menggunakan PostgreSQL dengan schema lengkap yang mencakup:  
   
### Main Tables:  
- `users` - User authentication & authorization  
- `pasien` - Patient master data  
- `dokter` - Doctor profiles & schedules  
- `poli` - Polyclinic/department data  
- `pendaftaran_rawat_jalan` - Outpatient registration  
- `rekam_medis` - Electronic medical records  
- `permintaan_laboratorium` - Laboratory requests  
- `permintaan_radiologi` - Radiology requests  
- `resep_obat` - Prescriptions  
- `detail_resep_obat` - Prescription details  
- `tagihan_pasien` - Patient billing  
- `detail_tagihan_pasien` - Billing details  
   
## 🎯 Key Features  
   
### Clinical Features  
- ✅ Complete patient registration workflow  
- ✅ Queue management system  
- ✅ Electronic medical records (EMR)  
- ✅ Laboratory test ordering & results  
- ✅ Radiology exam ordering & reports  
- ✅ E-prescription & medication dispensing  
- ✅ Integrated billing system  
   
### Management Features  
- ✅ Doctor schedule management  
- ✅ Department/polyclinic management  
- ✅ Real-time statistics & analytics  
- ✅ Revenue & financial reporting  
- ✅ Patient history tracking  
   
### Technical Features  
- ✅ RESTful API design  
- ✅ JWT authentication  
- ✅ Role-based authorization  
- ✅ Input validation  
- ✅ Error handling  
- ✅ Logging (Morgan)  
- ✅ Security headers (Helmet)  
- ✅ Rate limiting  
- ✅ CORS protection  
   
## 🔄 Next Steps (Optional Enhancements)  
   
### High Priority:  
- [ ] API Documentation (Swagger/OpenAPI)  
- [ ] Unit Tests (Jest/Mocha)  
- [ ] Integration Tests  
- [ ] Docker Support  
- [ ] CI/CD Pipeline  
   
### Medium Priority:  
- [ ] File Upload (Patient photos, lab results)  
- [ ] PDF Report Generation  
- [ ] Email Notifications  
- [ ] SMS Notifications  
- [ ] Real-time Updates (Socket.io)  
   
### Low Priority:  
- [ ] Advanced Analytics Dashboard  
- [ ] Data Export (CSV, Excel)  
- [ ] Audit Log System  
- [ ] Backup & Recovery Tools  
- [ ] Performance Monitoring  
   
## 📄 License  
   
MIT  
   
## 👨‍💻 Developer  
   
SIMRS Development Team  
   
---  
   
## 🎉 Congratulations!  
   
Semua 10 modul utama telah berhasil diimplementasikan! API ini siap untuk:  
- Development & Testing  
- Integration dengan Frontend  
- Deployment ke Production  
   
Untuk memulai development, jalankan:  
```bash  
npm run dev  
```  
   
Untuk production deployment:  
```bash  
npm start  
```  
   
Happy Coding! 🚀  
