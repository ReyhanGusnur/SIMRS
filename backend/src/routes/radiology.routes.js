const express = require('express');
const router = express.Router();
const radiologyController = require('../controllers/radiology.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * Validation for radiology request
 */
const radiologyRequestValidation = [
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
    .isLength({ max: 200 }).withMessage('Jenis pemeriksaan cannot exceed 200 characters')
    .isIn([
      'Rontgen', 'CT Scan', 'MRI', 'USG', 'Mammografi', 
      'Fluoroskopi', 'Angiografi', 'Bone Densitometry', 'PET Scan'
    ]).withMessage('Invalid jenis pemeriksaan'),
  body('bagian_tubuh')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bagian tubuh cannot exceed 100 characters'),
  body('catatan_klinis')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Catatan klinis cannot exceed 1000 characters')
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
 * Validation for radiology result
 */
const radiologyResultValidation = [
  body('hasil_pemeriksaan')
    .notEmpty().withMessage('Hasil pemeriksaan is required')
    .trim()
    .isLength({ max: 3000 }).withMessage('Hasil pemeriksaan cannot exceed 3000 characters'),
  body('kesan')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Kesan cannot exceed 1000 characters'),
  body('saran')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Saran cannot exceed 1000 characters')
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/radiologi
 * @desc    Get all radiology requests with pagination
 * @access  Private (admin, radiologi, dokter)
 */
router.get(
  '/',
  authorize(['admin', 'radiologi', 'dokter']),
  paginationValidation,
  radiologyController.getAllRadiologyRequests
);

/**
 * @route   GET /api/v1/radiologi/stats
 * @desc    Get radiology statistics
 * @access  Private (admin, radiologi)
 */
router.get(
  '/stats',
  authorize(['admin', 'radiologi']),
  radiologyController.getRadiologyStats
);

/**
 * @route   GET /api/v1/radiologi/pending
 * @desc    Get pending radiology requests
 * @access  Private (radiologi)
 */
router.get(
  '/pending',
  authorize(['admin', 'radiologi']),
  radiologyController.getPendingRequests
);

/**
 * @route   GET /api/v1/radiologi/pasien/:pasien_id
 * @desc    Get radiology requests by patient
 * @access  Private (admin, radiologi, dokter)
 */
router.get(
  '/pasien/:pasien_id',
  authorize(['admin', 'radiologi', 'dokter']),
  uuidValidation,
  radiologyController.getRadiologyRequestsByPatient
);

/**
 * @route   GET /api/v1/radiologi/:id
 * @desc    Get radiology request by ID
 * @access  Private (admin, radiologi, dokter)
 */
router.get(
  '/:id',
  authorize(['admin', 'radiologi', 'dokter']),
  uuidValidation,
  radiologyController.getRadiologyRequestById
);

/**
 * @route   POST /api/v1/radiologi
 * @desc    Create new radiology request
 * @access  Private (dokter only)
 */
router.post(
  '/',
  authorize(['dokter']),
  radiologyRequestValidation,
  radiologyController.createRadiologyRequest
);

/**
 * @route   PUT /api/v1/radiologi/:id/status
 * @desc    Update radiology status
 * @access  Private (radiologi only)
 */
router.put(
  '/:id/status',
  authorize(['admin', 'radiologi']),
  uuidValidation,
  statusUpdateValidation,
  radiologyController.updateRadiologyStatus
);

/**
 * @route   PUT /api/v1/radiologi/:id/result
 * @desc    Submit radiology result
 * @access  Private (radiologi only)
 */
router.put(
  '/:id/result',
  authorize(['admin', 'radiologi']),
  uuidValidation,
  radiologyResultValidation,
  radiologyController.submitRadiologyResult
);

/**
 * @route   PATCH /api/v1/radiologi/:id/result
 * @desc    Update radiology result
 * @access  Private (radiologi only)
 */
router.patch(
  '/:id/result',
  authorize(['admin', 'radiologi']),
  uuidValidation,
  radiologyController.updateRadiologyResult
);

/**
 * @route   DELETE /api/v1/radiologi/:id
 * @desc    Cancel radiology request
 * @access  Private (admin, dokter)
 */
router.delete(
  '/:id',
  authorize(['admin', 'dokter']),
  uuidValidation,
  radiologyController.cancelRadiologyRequest
);

module.exports = router;
