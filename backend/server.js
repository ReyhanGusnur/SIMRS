require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./src/config/database');
const { notFound, errorHandler } = require('./src/middleware/error.middleware');

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const pasienRoutes = require('./src/routes/patient.routes');
const dokterRoutes = require('./src/routes/doctor.routes');
const poliRoutes = require('./src/routes/poli.routes');
const pendaftaranRoutes = require('./src/routes/registration.routes');
const rekamMedisRoutes = require('./src/routes/medical-record.routes');
const laboratoriumRoutes = require('./src/routes/laboratory.routes');
const radiologiRoutes = require('./src/routes/radiology.routes');
const farmasiRoutes = require('./src/routes/pharmacy.routes');
const keuanganRoutes = require('./src/routes/finance.routes');

// Initialize Express App
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIMRS API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Version Info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SIMRS API - Complete Hospital Information Management System',
    version: process.env.API_VERSION || 'v1',
    modules: {
      core: [
        'Authentication',
        'Patient Management',
        'Doctor Management',
        'Polyclinic Management'
      ],
      clinical: [
        'Registration',
        'Medical Records',
        'Laboratory',
        'Radiology',
        'Pharmacy'
      ],
      financial: [
        'Billing & Finance'
      ]
    },
    endpoints: {
      auth: '/api/v1/auth',
      pasien: '/api/v1/pasien',
      dokter: '/api/v1/dokter',
      poli: '/api/v1/poli',
      pendaftaran: '/api/v1/pendaftaran',
      rekam_medis: '/api/v1/rekam-medis',
      laboratorium: '/api/v1/laboratorium',
      radiologi: '/api/v1/radiologi',
      farmasi: '/api/v1/farmasi',
      keuangan: '/api/v1/keuangan'
    }
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/pasien`, pasienRoutes);
app.use(`/api/${API_VERSION}/dokter`, dokterRoutes);
app.use(`/api/${API_VERSION}/poli`, poliRoutes);
app.use(`/api/${API_VERSION}/pendaftaran`, pendaftaranRoutes);
app.use(`/api/${API_VERSION}/rekam-medis`, rekamMedisRoutes);
app.use(`/api/${API_VERSION}/laboratorium`, laboratoriumRoutes);
app.use(`/api/${API_VERSION}/radiologi`, radiologiRoutes);
app.use(`/api/${API_VERSION}/farmasi`, farmasiRoutes);
app.use(`/api/${API_VERSION}/keuangan`, keuanganRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test Database Connection
    console.log('🔄 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start Server
    app.listen(PORT, () => {
      console.log('='.repeat(80));
      console.log('🏥 SIMRS Backend API Server - Complete Implementation');
      console.log('='.repeat(80));
      console.log(`📡 Environment    : ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL     : http://localhost:${PORT}`);
      console.log(`🔗 API Base URL   : http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`❤️  Health Check  : http://localhost:${PORT}/health`);
      console.log('='.repeat(80));
      console.log('📋 Implemented Modules (10/10):');
      console.log('');
      console.log('   ✅ Authentication      - /api/v1/auth');
      console.log('   ✅ Pasien             - /api/v1/pasien');
      console.log('   ✅ Dokter             - /api/v1/dokter');
      console.log('   ✅ Poli               - /api/v1/poli');
      console.log('   ✅ Pendaftaran        - /api/v1/pendaftaran');
      console.log('   ✅ Rekam Medis        - /api/v1/rekam-medis');
      console.log('   ✅ Laboratorium       - /api/v1/laboratorium');
      console.log('   ✅ Radiologi          - /api/v1/radiologi');
      console.log('   ✅ Farmasi            - /api/v1/farmasi');
      console.log('   ✅ Keuangan           - /api/v1/keuangan');
      console.log('');
      console.log('📝 Key Features:');
      console.log('');
      console.log('   • JWT Authentication & Authorization');
      console.log('   • Role-Based Access Control (8 roles)');
      console.log('   • Complete Patient Management');
      console.log('   • Queue Management System');
      console.log('   • Electronic Medical Records');
      console.log('   • Laboratory & Radiology Integration');
      console.log('   • Pharmacy & Prescription Management');
      console.log('   • Billing & Financial Reporting');
      console.log('   • Comprehensive Statistics & Analytics');
      console.log('');
      console.log('🔐 Security Features:');
      console.log('');
      console.log('   • Helmet - Security Headers');
      console.log('   • CORS - Cross-Origin Protection');
      console.log('   • Rate Limiting - DDoS Protection');
      console.log('   • Input Validation - SQL Injection Prevention');
      console.log('   • Password Hashing - bcrypt');
      console.log('   • JWT Tokens - Secure Authentication');
      console.log('');
      console.log('📊 Available Endpoints Summary:');
      console.log('');
      console.log('   AUTH        : Login, Register, Profile, Change Password');
      console.log('   PASIEN      : CRUD, Search, Statistics');
      console.log('   DOKTER      : CRUD, Schedule, Specialization');
      console.log('   POLI        : CRUD, List Active');
      console.log('   PENDAFTARAN : CRUD, Queue Management, Statistics');
      console.log('   REKAM MEDIS : CRUD, Patient History, Statistics');
      console.log('   LABORATORIUM: CRUD, Results, Pending Queue');
      console.log('   RADIOLOGI   : CRUD, Results, Imaging Reports');
      console.log('   FARMASI     : CRUD, Dispense, Medication Tracking');
      console.log('   KEUANGAN    : CRUD, Payment Processing, Revenue Reports');
      console.log('');
      console.log('='.repeat(80));
      console.log('✨ All modules implemented successfully!');
      console.log('🚀 Server is ready to accept requests!');
      console.log('='.repeat(80));
      console.log('JWT_SECRET:', process.env.JWT_SECRET);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
