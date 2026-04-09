const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  pendaftaranValidation, 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');
const { body } = require('express-validator');

/**
 * Validation for status update
 */
const statusUpdateValidation = [
  body('status_pendaftaran')
    .notEmpty().withMessage('Status is required')
    .isIn(['Menunggu', 'Sedang Dilayani', 'Selesai', 'Dibatalkan'])
    .withMessage('Invalid status')
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/pendaftaran
 * @desc    Get all registrations with pagination and filters
 * @access  Private (admin, registrasi, dokter, perawat)
 */
router.get(
  '/',
  authorize(['admin', 'registrasi', 'dokter', 'perawat']),
  paginationValidation,
  registrationController.getAllRegistrations
);

/**
 * @route   GET /api/v1/pendaftaran/stats
 * @desc    Get registration statistics
 * @access  Private (admin, registrasi)
 */
router.get(
  '/stats',
  authorize(['admin', 'registrasi']),
  registrationController.getRegistrationStats
);

/**
 * @route   GET /api/v1/pendaftaran/queue/:poli_id?
 * @desc    Get today's queue by poli
 * @access  Private (all roles)
 */
router.get(
  '/queue/:poli_id?',
  registrationController.getTodayQueue
);

/**
 * @route   GET /api/v1/pendaftaran/:id
 * @desc    Get registration by ID
 * @access  Private (admin, registrasi, dokter, perawat)
 */
router.get(
  '/:id',
  authorize(['admin', 'registrasi', 'dokter', 'perawat']),
  uuidValidation,
  registrationController.getRegistrationById
);

/**
 * @route   POST /api/v1/pendaftaran
 * @desc    Create new registration
 * @access  Private (admin, registrasi)
 */
router.post(
  '/',
  authorize(['admin', 'registrasi']),
  pendaftaranValidation,
  registrationController.createRegistration
);

/**
 * @route   PUT /api/v1/pendaftaran/:id/status
 * @desc    Update registration status
 * @access  Private (admin, registrasi, dokter, perawat)
 */
router.put(
  '/:id/status',
  authorize(['admin', 'registrasi', 'dokter', 'perawat']),
  uuidValidation,
  statusUpdateValidation,
  registrationController.updateRegistrationStatus
);

/**
 * @route   DELETE /api/v1/pendaftaran/:id
 * @desc    Cancel registration
 * @access  Private (admin, registrasi)
 */
router.delete(
  '/:id',
  authorize(['admin', 'registrasi']),
  uuidValidation,
  registrationController.cancelRegistration
);

module.exports = router;
