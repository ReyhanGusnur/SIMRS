const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  pasienValidation, 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/pasien
 * @desc    Get all patients with pagination
 * @access  Private (admin, registrasi, dokter, perawat)
 */
router.get(
  '/',
  authorize('admin', 'registrasi', 'dokter', 'perawat'),
  paginationValidation,
  patientController.getAllPatients
);

/**
 * @route   GET /api/v1/pasien/stats
 * @desc    Get patient statistics
 * @access  Private (admin, registrasi)
 */
router.get(
  '/stats',
  authorize('admin', 'registrasi'),
  patientController.getPatientStats
);

/**
 * @route   GET /api/v1/pasien/no-rm/:no_rm
 * @desc    Get patient by No RM
 * @access  Private (all roles)
 */
router.get(
  '/no-rm/:no_rm',
  authorize('admin', 'registrasi', 'dokter', 'perawat', 'farmasi', 'laboratorium', 'radiologi', 'kasir'),
  patientController.getPatientByNoRM
);

/**
 * @route   GET /api/v1/pasien/:id
 * @desc    Get patient by ID
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  authorize('admin', 'registrasi', 'dokter', 'perawat', 'farmasi', 'laboratorium', 'radiologi', 'kasir'),
  uuidValidation,
  patientController.getPatientById
);

/**
 * @route   POST /api/v1/pasien
 * @desc    Create new patient
 * @access  Private (admin, registrasi)
 */
router.post(
  '/',
  authorize('admin', 'registrasi'),
  pasienValidation,
  patientController.createPatient
);

/**
 * @route   PUT /api/v1/pasien/:id
 * @desc    Update patient
 * @access  Private (admin, registrasi)
 */
router.put(
  '/:id',
  authorize('admin', 'registrasi'),
  uuidValidation,
  patientController.updatePatient
);

/**
 * @route   DELETE /api/v1/pasien/:id
 * @desc    Delete patient (soft delete)
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  authorize('admin'),
  uuidValidation,
  patientController.deletePatient
);

module.exports = router;
