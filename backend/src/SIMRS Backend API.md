# SIMRS Backend API

Backend API untuk Sistem Informasi Manajemen Rumah Sakit (SIMRS) menggunakan Node.js, Express, dan PostgreSQL.

## 🚀 Tech Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## ✨ Implemented Modules

### ✅ Core Modules
1. **Authentication** - Login, Register, JWT
2. **Pasien (Patient)** - Patient management
3. **Dokter (Doctor)** - Doctor management
4. **Poli (Polyclinic)** - Polyclinic management
5. **Pendaftaran (Registration)** - Patient registration & queue
6. **Rekam Medis (Medical Record)** - Medical records management

### 🔄 Upcoming Modules
- [ ] Laboratorium (Laboratory)
- [ ] Radiologi (Radiology)
- [ ] Farmasi (Pharmacy)
- [ ] Keuangan (Finance)
- [ ] Laporan (Reports)

## 📁 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── patient.controller.js
│   │   ├── doctor.controller.js
│   │   ├── poli.controller.js
│   │   ├── registration.controller.js
│   │   └── medical-record.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── patient.routes.js
│   │   ├── doctor.routes.js
│   │   ├── poli.routes.js
│   │   ├── registration.routes.js
│   │   └── medical-record.routes.js
│   └── utils/
│       └── auth.js
├── .env.example
├── package.json
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

## 📡 API Endpoints

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

## 👥 User Roles

- **admin** - Full access
- **dokter** - Doctor access
- **perawat** - Nurse access
- **farmasi** - Pharmacy access
- **laboratorium** - Laboratory access
- **radiologi** - Radiology access
- **kasir** - Cashier access
- **registrasi** - Registration access

## 🛡️ Security Features

1. **Helmet** - Security headers
2. **CORS** - Cross-Origin Resource Sharing
3. **Rate Limiting** - Prevent brute force attacks (100 req/15min)
4. **JWT** - Secure authentication
5. **Password Hashing** - bcrypt
6. **Input Validation** - Express Validator
7. **SQL Injection Prevention** - Parameterized queries

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
```

## 📊 Database Schema

Project ini menggunakan PostgreSQL dengan schema yang terdefinisi di `simrs_database_schema.sql`.

### Main Tables:
- `users` - User authentication
- `pasien` - Patient data
- `dokter` - Doctor data
- `poli` - Polyclinic data
- `pendaftaran_rawat_jalan` - Registration data
- `rekam_medis` - Medical records

## 🔄 Next Development

### Priority:
1. ✅ Complete core modules (DONE)
2. 🔄 Add Laboratorium module
3. 🔄 Add Radiologi module
4. 🔄 Add Farmasi module
5. 🔄 Add Keuangan module

### Future Enhancements:
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Docker Support
- [ ] CI/CD Pipeline
- [ ] Logging System
- [ ] Monitoring & Analytics

## 📄 License

MIT

## 👨‍💻 Developer

SIMRS Development Team
