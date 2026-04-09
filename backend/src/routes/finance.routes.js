const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, query } = require('express-validator');
const { 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * Validation for billing creation
 */
const billingValidation = [
  body('pasien_id')
    .notEmpty().withMessage('Pasien ID is required')
    .isUUID().withMessage('Invalid pasien ID format'),
  body('pendaftaran_id')
    .optional()
    .isUUID().withMessage('Invalid pendaftaran ID format'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one billing item is required'),
  body('items.*.jenis_item')
    .notEmpty().withMessage('Jenis item is required')
    .isIn([
      'Konsultasi', 'Tindakan Medis', 'Obat', 'Laboratorium', 
      'Radiologi', 'Rawat Inap', 'Administrasi', 'Lainnya'
    ])
    .withMessage('Invalid jenis item'),
  body('items.*.nama_item')
    .notEmpty().withMessage('Nama item is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Nama item cannot exceed 200 characters'),
  body('items.*.jumlah')
    .notEmpty().withMessage('Jumlah is required')
    .isInt({ min: 1 }).withMessage('Jumlah must be at least 1'),
  body('items.*.harga_satuan')
    .notEmpty().withMessage('Harga satuan is required')
    .isFloat({ min: 0 }).withMessage('Harga satuan must be a positive number'),
  body('items.*.keterangan')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Keterangan cannot exceed 200 characters'),
  body('diskon')
    .optional()
    .isFloat({ min: 0 }).withMessage('Diskon must be a positive number'),
  body('pajak')
    .optional()
    .isFloat({ min: 0 }).withMessage('Pajak must be a positive number'),
  body('keterangan')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Keterangan cannot exceed 500 characters')
];

/**
 * Validation for payment processing
 */
const paymentValidation = [
  body('metode_pembayaran')
    .notEmpty().withMessage('Metode pembayaran is required')
    .isIn(['Tunai', 'Debit', 'Kredit', 'Transfer', 'BPJS', 'Asuransi'])
    .withMessage('Invalid metode pembayaran'),
  body('jumlah_bayar')
    .notEmpty().withMessage('Jumlah bayar is required')
    .isFloat({ min: 0 }).withMessage('Jumlah bayar must be a positive number'),
  body('keterangan_pembayaran')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Keterangan pembayaran cannot exceed 500 characters')
];

/**
 * Validation for revenue report
 */
const revenueReportValidation = [
  query('start_date')
    .notEmpty().withMessage('Start date is required')
    .isDate().withMessage('Invalid start date format'),
  query('end_date')
    .notEmpty().withMessage('End date is required')
    .isDate().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/keuangan
 * @desc    Get all billings with pagination
 * @access  Private (admin, kasir)
 */
router.get(
  '/',
  authorize(['admin', 'kasir']),
  paginationValidation,
  financeController.getAllBillings
);

/**
 * @route   GET /api/v1/keuangan/stats
 * @desc    Get finance statistics
 * @access  Private (admin, kasir)
 */
router.get(
  '/stats',
  authorize(['admin', 'kasir']),
  financeController.getFinanceStats
);

/**
 * @route   GET /api/v1/keuangan/unpaid
 * @desc    Get unpaid billings
 * @access  Private (admin, kasir)
 */
router.get(
  '/unpaid',
  authorize(['admin', 'kasir']),
  financeController.getUnpaidBillings
);

/**
 * @route   GET /api/v1/keuangan/revenue
 * @desc    Get daily revenue report
 * @access  Private (admin)
 */
router.get(
  '/revenue',
  authorize(['admin']),
  revenueReportValidation,
  financeController.getDailyRevenue
);

/**
 * @route   GET /api/v1/keuangan/pasien/:pasien_id
 * @desc    Get billings by patient
 * @access  Private (admin, kasir)
 */
router.get(
  '/pasien/:pasien_id',
  authorize(['admin', 'kasir']),
  uuidValidation,
  financeController.getBillingsByPatient
);

/**
 * @route   GET /api/v1/keuangan/:id
 * @desc    Get billing by ID with details
 * @access  Private (admin, kasir)
 */
router.get(
  '/:id',
  authorize(['admin', 'kasir']),
  uuidValidation,
  financeController.getBillingById
);

/**
 * @route   POST /api/v1/keuangan
 * @desc    Create new billing
 * @access  Private (admin, kasir)
 */
router.post(
  '/',
  authorize(['admin', 'kasir']),
  billingValidation,
  financeController.createBilling
);

/**
 * @route   PUT /api/v1/keuangan/:id/payment
 * @desc    Process payment
 * @access  Private (admin, kasir)
 */
router.put(
  '/:id/payment',
  authorize(['admin', 'kasir']),
  uuidValidation,
  paymentValidation,
  financeController.processPayment
);

/**
 * @route   DELETE /api/v1/keuangan/:id
 * @desc    Cancel billing
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize(['admin']),
  uuidValidation,
  financeController.cancelBilling
);

module.exports = router;
