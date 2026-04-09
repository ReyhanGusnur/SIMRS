const express = require('express');
const router = express.Router();
const laboratoryController = require('../controllers/laboratory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * Validation for laboratory request
 */
const labRequestValidation = [
  body('pasien_id')
    .notEmpty().withMessage('Pasien ID is required')
    .isUUID().withMessage('Invalid pasien ID format'),
  body('dokter_id')
    .notEmpty().withMessage('Dokter ID is required')
    .isUUID().withMessage('Invalid dokter ID format'),
  body('rekam_medis_id')
    .optional()
    .isUUID().withMessage('Invalid rekam medis ID format'),
  body('jenis_pemeriksaan')
    .notEmpty().withMessage('Jenis pemeriksaan is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Jenis pemeriksaan cannot exceed 200 characters'),
  body('catatan')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Catatan cannot exceed 500 characters')
];

/**
 * Validation for status update
 */
const statusUpdateValidation = [
  body('status_pemeriksaan')
    .notEmpty().withMessage('Status is required')
    .isIn(['Belum Diproses', 'Sedang Diproses', 'Selesai', 'Dibatalkan'])
    .withMessage('Invalid status')
];

/**
 * Validation for lab result
 */
const labResultValidation = [
  body('hasil_pemeriksaan')
    .notEmpty().withMessage('Hasil pemeriksaan is required')
    .trim()
    .isLength({ max: 2000 }).withMessage('Hasil pemeriksaan cannot exceed 2000 characters'),
  body('nilai_normal')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Nilai normal cannot exceed 200 characters'),
  body('keterangan_hasil')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Keterangan hasil cannot exceed 1000 characters')
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/laboratorium
 * @desc    Get all laboratory requests with pagination
 * @access  Private (admin, laboratorium, dokter)
 */
router.get(
  '/',
  authorize(['admin', 'laboratorium', 'dokter']),
  paginationValidation,
  laboratoryController.getAllLabRequests
);

/**
 * @route   GET /api/v1/laboratorium/stats
 * @desc    Get laboratory statistics
 * @access  Private (admin, laboratorium)
 */
router.get(
  '/stats',
  authorize(['admin', 'laboratorium']),
  laboratoryController.getLabStats
);

/**
 * @route   GET /api/v1/laboratorium/pending
 * @desc    Get pending laboratory requests
 * @access  Private (laboratorium)
 */
router.get(
  '/pending',
  authorize(['admin', 'laboratorium']),
  laboratoryController.getPendingRequests
);

/**
 * @route   GET /api/v1/laboratorium/pasien/:pasien_id
 * @desc    Get laboratory requests by patient
 * @access  Private (admin, laboratorium, dokter)
 */
router.get(
  '/pasien/:pasien_id',
  authorize(['admin', 'laboratorium', 'dokter']),
  uuidValidation,
  laboratoryController.getLabRequestsByPatient
);

/**
 * @route   GET /api/v1/laboratorium/:id
 * @desc    Get laboratory request by ID
 * @access  Private (admin, laboratorium, dokter)
 */
router.get(
  '/:id',
  authorize(['admin', 'laboratorium', 'dokter']),
  uuidValidation,
  laboratoryController.getLabRequestById
);

/**
 * @route   POST /api/v1/laboratorium
 * @desc    Create new laboratory request
 * @access  Private (dokter only)
 */
router.post(
  '/',
  authorize(['dokter']),
  labRequestValidation,
  laboratoryController.createLabRequest
);

/**
 * @route   PUT /api/v1/laboratorium/:id/status
 * @desc    Update laboratory status
 * @access  Private (laboratorium only)
 */
router.put(
  '/:id/status',
  authorize(['admin', 'laboratorium']),
  uuidValidation,
  statusUpdateValidation,
  laboratoryController.updateLabStatus
);

/**
 * @route   PUT /api/v1/laboratorium/:id/result
 * @desc    Submit laboratory result
 * @access  Private (laboratorium only)
 */
router.put(
  '/:id/result',
  authorize(['admin', 'laboratorium']),
  uuidValidation,
  labResultValidation,
  laboratoryController.submitLabResult
);

/**
 * @route   PATCH /api/v1/laboratorium/:id/result
 * @desc    Update laboratory result
 * @access  Private (laboratorium only)
 */
router.patch(
  '/:id/result',
  authorize(['admin', 'laboratorium']),
  uuidValidation,
  laboratoryController.updateLabResult
);

/**
 * @route   DELETE /api/v1/laboratorium/:id
 * @desc    Cancel laboratory request
 * @access  Private (admin, dokter)
 */
router.delete(
  '/:id',
  authorize(['admin', 'dokter']),
  uuidValidation,
  laboratoryController.cancelLabRequest
);

module.exports = router;
