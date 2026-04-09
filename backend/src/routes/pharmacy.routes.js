const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * Validation for pharmacy request (prescription)
 */
const pharmacyRequestValidation = [
  body('pasien_id')
    .notEmpty().withMessage('Pasien ID is required')
    .isUUID().withMessage('Invalid pasien ID format'),
  body('dokter_id')
    .notEmpty().withMessage('Dokter ID is required')
    .isUUID().withMessage('Invalid dokter ID format'),
  body('rekam_medis_id')
    .optional()
    .isUUID().withMessage('Invalid rekam medis ID format'),
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Catatan cannot exceed 500 characters'),
  body('medications')
    .isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.nama_obat')
    .notEmpty().withMessage('Nama obat is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Nama obat cannot exceed 200 characters'),
  body('medications.*.dosis')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Dosis cannot exceed 100 characters'),
  body('medications.*.jumlah')
    .notEmpty().withMessage('Jumlah is required')
    .isInt({ min: 1 }).withMessage('Jumlah must be at least 1'),
  body('medications.*.satuan')
    .notEmpty().withMessage('Satuan is required')
    .isIn(['Tablet', 'Kapsul', 'Botol', 'Tube', 'Box', 'Strip', 'Ampul', 'Vial', 'Sachet', 'Pot'])
    .withMessage('Invalid satuan'),
  body('medications.*.aturan_pakai')
    .notEmpty().withMessage('Aturan pakai is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Aturan pakai cannot exceed 200 characters'),
  body('medications.*.harga_satuan')
    .notEmpty().withMessage('Harga satuan is required')
    .isFloat({ min: 0 }).withMessage('Harga satuan must be a positive number')
];

/**
 * Validation for status update
 */
const statusUpdateValidation = [
  body('status_resep')
    .notEmpty().withMessage('Status is required')
    .isIn(['Belum Diproses', 'Sedang Diproses', 'Selesai', 'Dibatalkan'])
    .withMessage('Invalid status')
];

/**
 * Validation for medication update
 */
const medicationUpdateValidation = [
  body('jumlah')
    .notEmpty().withMessage('Jumlah is required')
    .isInt({ min: 1 }).withMessage('Jumlah must be at least 1'),
  body('harga_satuan')
    .notEmpty().withMessage('Harga satuan is required')
    .isFloat({ min: 0 }).withMessage('Harga satuan must be a positive number')
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/farmasi
 * @desc    Get all pharmacy requests with pagination
 * @access  Private (admin, farmasi, dokter)
 */
router.get(
  '/',
  authorize(['admin', 'farmasi', 'dokter']),
  paginationValidation,
  pharmacyController.getAllPharmacyRequests
);

/**
 * @route   GET /api/v1/farmasi/stats
 * @desc    Get pharmacy statistics
 * @access  Private (admin, farmasi)
 */
router.get(
  '/stats',
  authorize(['admin', 'farmasi']),
  pharmacyController.getPharmacyStats
);

/**
 * @route   GET /api/v1/farmasi/pending
 * @desc    Get pending pharmacy requests
 * @access  Private (farmasi)
 */
router.get(
  '/pending',
  authorize(['admin', 'farmasi']),
  pharmacyController.getPendingRequests
);

/**
 * @route   GET /api/v1/farmasi/pasien/:pasien_id
 * @desc    Get pharmacy requests by patient
 * @access  Private (admin, farmasi, dokter)
 */
router.get(
  '/pasien/:pasien_id',
  authorize(['admin', 'farmasi', 'dokter']),
  uuidValidation,
  pharmacyController.getPharmacyRequestsByPatient
);

/**
 * @route   GET /api/v1/farmasi/:id
 * @desc    Get pharmacy request by ID with details
 * @access  Private (admin, farmasi, dokter)
 */
router.get(
  '/:id',
  authorize(['admin', 'farmasi', 'dokter']),
  uuidValidation,
  pharmacyController.getPharmacyRequestById
);

/**
 * @route   POST /api/v1/farmasi
 * @desc    Create new pharmacy request (prescription)
 * @access  Private (dokter only)
 */
router.post(
  '/',
  authorize(['dokter']),
  pharmacyRequestValidation,
  pharmacyController.createPharmacyRequest
);

/**
 * @route   PUT /api/v1/farmasi/:id/status
 * @desc    Update pharmacy status
 * @access  Private (farmasi only)
 */
router.put(
  '/:id/status',
  authorize(['admin', 'farmasi']),
  uuidValidation,
  statusUpdateValidation,
  pharmacyController.updatePharmacyStatus
);

/**
 * @route   PUT /api/v1/farmasi/:id/dispense
 * @desc    Dispense prescription
 * @access  Private (farmasi only)
 */
router.put(
  '/:id/dispense',
  authorize(['admin', 'farmasi']),
  uuidValidation,
  pharmacyController.dispensePrescription
);

/**
 * @route   PATCH /api/v1/farmasi/:id/medication/:detail_id
 * @desc    Update medication in prescription
 * @access  Private (farmasi only)
 */
router.patch(
  '/:id/medication/:detail_id',
  authorize(['admin', 'farmasi']),
  [
    param('id').isUUID().withMessage('Invalid prescription ID format'),
    param('detail_id').isUUID().withMessage('Invalid detail ID format')
  ],
  medicationUpdateValidation,
  pharmacyController.updateMedication
);

/**
 * @route   DELETE /api/v1/farmasi/:id
 * @desc    Cancel pharmacy request
 * @access  Private (admin, dokter)
 */
router.delete(
  '/:id',
  authorize(['admin', 'dokter']),
  uuidValidation,
  pharmacyController.cancelPharmacyRequest
);

module.exports = router;
