const { body, param, query } = require('express-validator');

/**
 * Validation untuk Login
 */
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * Validation untuk Register User
 */
const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'dokter', 'perawat', 'farmasi', 'laboratorium', 'radiologi', 'kasir', 'registrasi'])
    .withMessage('Invalid role')
];

/**
 * Validation untuk Change Password
 */
const changePasswordValidation = [
  body('current_password')
    .trim()
    .notEmpty().withMessage('Current password is required'),
  body('new_password')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirm_password')
    .trim()
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Confirm password does not match');
      }
      return true;
    })
];

/**
 * Validation untuk Pasien
 */
const pasienValidation = [
  body('nama_lengkap')
    .trim()
    .notEmpty().withMessage('Nama lengkap is required')
    .isLength({ max: 100 }).withMessage('Nama lengkap cannot exceed 100 characters'),
  body('tanggal_lahir')
    .notEmpty().withMessage('Tanggal lahir is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error('Birth date cannot be in the future');
      }
      return true;
    }),
  body('jenis_kelamin')
    .notEmpty().withMessage('Jenis kelamin is required')
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Jenis kelamin must be Laki-laki or Perempuan'),
  body('alamat')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Alamat cannot exceed 255 characters'),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format')
    .isLength({ min: 10, max: 15 }).withMessage('Phone must be between 10-15 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('nik')
    .optional()
    .trim()
    .isLength({ min: 16, max: 16 }).withMessage('NIK must be 16 characters')
    .isNumeric().withMessage('NIK must contain only numbers'),
  body('golongan_darah')
    .optional()
    .isIn(['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid golongan darah'),
  body('tempat_lahir')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Tempat lahir cannot exceed 100 characters'),
  body('agama')
    .optional()
    .isIn(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'])
    .withMessage('Invalid agama'),
  body('pekerjaan')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Pekerjaan cannot exceed 100 characters'),
  body('pendidikan')
    .optional()
    .isIn(['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'S3', 'Lainnya'])
    .withMessage('Invalid pendidikan'),
  body('status_pernikahan')
    .optional()
    .isIn(['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati'])
    .withMessage('Invalid status pernikahan')
];

/**
 * Validation untuk Dokter
 */
const dokterValidation = [
  body('nama_lengkap')
    .trim()
    .notEmpty().withMessage('Nama lengkap is required')
    .isLength({ max: 100 }).withMessage('Nama lengkap cannot exceed 100 characters'),
  body('spesialisasi')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Spesialisasi cannot exceed 100 characters'),
  body('no_sip')
    .trim()
    .notEmpty().withMessage('No SIP is required')
    .isLength({ max: 50 }).withMessage('No SIP cannot exceed 50 characters'),
  body('no_str')
    .trim()
    .notEmpty().withMessage('No STR is required')
    .isLength({ max: 50 }).withMessage('No STR cannot exceed 50 characters'),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format')
    .isLength({ min: 10, max: 15 }).withMessage('Phone must be between 10-15 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('tarif_konsultasi')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tarif must be a positive number')
];

/**
 * Validation untuk Pendaftaran Rawat Jalan
 */
const pendaftaranValidation = [
  body('pasien_id')
    .notEmpty().withMessage('Pasien ID is required')
    .isUUID().withMessage('Invalid pasien ID format'),
  body('dokter_id')
    .notEmpty().withMessage('Dokter ID is required')
    .isUUID().withMessage('Invalid dokter ID format'),
  body('poli_id')
    .notEmpty().withMessage('Poli ID is required')
    .isUUID().withMessage('Invalid poli ID format'),
  body('tanggal_kunjungan')
    .notEmpty().withMessage('Tanggal kunjungan is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      const visitDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (visitDate < today) {
        throw new Error('Visit date cannot be in the past');
      }
      return true;
    }),
  body('jenis_kunjungan')
    .notEmpty().withMessage('Jenis kunjungan is required')
    .isIn(['Baru', 'Lama']).withMessage('Jenis kunjungan must be Baru or Lama'),
  body('jenis_pembayaran')
    .notEmpty().withMessage('Jenis pembayaran is required')
    .isIn(['Umum', 'BPJS', 'Asuransi', 'Corporate']).withMessage('Invalid jenis pembayaran'),
  body('keluhan_utama')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Keluhan utama cannot exceed 500 characters')
];

/**
 * Validation untuk Rekam Medis
 */
const rekamMedisValidation = [
  body('pasien_id')
    .notEmpty().withMessage('Pasien ID is required')
    .isUUID().withMessage('Invalid pasien ID format'),
  body('dokter_id')
    .notEmpty().withMessage('Dokter ID is required')
    .isUUID().withMessage('Invalid dokter ID format'),
  body('pendaftaran_id')
    .optional()
    .isUUID().withMessage('Invalid pendaftaran ID format'),
  body('keluhan_utama')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Keluhan utama cannot exceed 1000 characters'),
  body('riwayat_penyakit_sekarang')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Riwayat penyakit sekarang cannot exceed 2000 characters'),
  body('riwayat_penyakit_dahulu')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Riwayat penyakit dahulu cannot exceed 2000 characters'),
  body('riwayat_alergi')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Riwayat alergi cannot exceed 500 characters'),
  body('pemeriksaan_fisik')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Pemeriksaan fisik cannot exceed 2000 characters'),
  body('diagnosa_primer_text')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Diagnosa cannot exceed 500 characters'),
  body('diagnosa_sekunder_text')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Diagnosa sekunder cannot exceed 500 characters'),
  body('terapi_pengobatan')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Terapi pengobatan cannot exceed 2000 characters'),
  body('tindakan_medis')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Tindakan medis cannot exceed 2000 characters'),
  body('catatan_tambahan')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Catatan tambahan cannot exceed 2000 characters'),
  body('tekanan_darah')
    .optional()
    .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Format tekanan darah: 120/80'),
  body('suhu')
    .optional()
    .isFloat({ min: 30, max: 45 }).withMessage('Suhu must be between 30-45 celsius'),
  body('berat_badan')
    .optional()
    .isFloat({ min: 0, max: 500 }).withMessage('Berat badan must be between 0-500 kg'),
  body('tinggi_badan')
    .optional()
    .isFloat({ min: 0, max: 300 }).withMessage('Tinggi badan must be between 0-300 cm'),
  body('denyut_nadi')
    .optional()
    .isInt({ min: 0, max: 300 }).withMessage('Denyut nadi must be between 0-300 bpm'),
  body('respirasi')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Respirasi must be between 0-100 per minute')
];

/**
 * Validation untuk UUID Parameter
 */
const uuidValidation = [
  param('id')
    .isUUID().withMessage('Invalid ID format')
];

/**
 * Validation untuk Pagination Query
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long')
];

module.exports = {
  loginValidation,
  registerValidation,
  changePasswordValidation,
  pasienValidation,
  dokterValidation,
  pendaftaranValidation,
  rekamMedisValidation,
  uuidValidation,
  paginationValidation
};
