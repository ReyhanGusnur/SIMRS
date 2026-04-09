const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medical-record.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  rekamMedisValidation, 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/rekam-medis
 * @desc    Get all medical records with pagination
 * @access  Private (admin, dokter, perawat)
 */
router.get(
  '/',
  authorize(['admin', 'dokter', 'perawat']),
  paginationValidation,
  medicalRecordController.getAllMedicalRecords
);

/**
 * @route   GET /api/v1/rekam-medis/stats
 * @desc    Get medical record statistics
 * @access  Private (admin, dokter)
 */
router.get(
  '/stats',
  authorize(['admin', 'dokter']),
  medicalRecordController.getMedicalRecordStats
);

/**
 * @route   GET /api/v1/rekam-medis/pasien/:pasien_id
 * @desc    Get medical records by patient
 * @access  Private (admin, dokter, perawat)
 */
router.get(
  '/pasien/:pasien_id',
  authorize(['admin', 'dokter', 'perawat']),
  uuidValidation,
  medicalRecordController.getMedicalRecordsByPatient
);

/**
 * @route   GET /api/v1/rekam-medis/:id
 * @desc    Get medical record by ID
 * @access  Private (admin, dokter, perawat)
 */
router.get(
  '/:id',
  authorize(['admin', 'dokter', 'perawat']),
  uuidValidation,
  medicalRecordController.getMedicalRecordById
);

/**
 * @route   POST /api/v1/rekam-medis
 * @desc    Create new medical record
 * @access  Private (dokter only)
 */
router.post(
  '/',
  authorize(['dokter']),
  rekamMedisValidation,
  medicalRecordController.createMedicalRecord
);

/**
 * @route   PUT /api/v1/rekam-medis/:id
 * @desc    Update medical record
 * @access  Private (dokter only)
 */
router.put(
  '/:id',
  authorize(['dokter']),
  uuidValidation,
  medicalRecordController.updateMedicalRecord
);

module.exports = router;
