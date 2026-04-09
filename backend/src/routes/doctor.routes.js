const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  dokterValidation, 
  uuidValidation, 
  paginationValidation 
} = require('../middleware/validation.middleware');

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/dokter
 * @desc    Get all doctors with pagination
 * @access  Private (all roles)
 */
router.get(
  '/',
  paginationValidation,
  doctorController.getAllDoctors
);

/**
 * @route   GET /api/v1/dokter/stats
 * @desc    Get doctor statistics
 * @access  Private (admin)
 */
router.get(
  '/stats',
  authorize(['admin']),
  doctorController.getDoctorStats
);

/**
 * @route   GET /api/v1/dokter/spesialisasi/:spesialisasi
 * @desc    Get doctors by specialization
 * @access  Private (all roles)
 */
router.get(
  '/spesialisasi/:spesialisasi',
  doctorController.getDoctorsBySpecialization
);

/**
 * @route   GET /api/v1/dokter/:id/jadwal
 * @desc    Get doctor schedule
 * @access  Private (all roles)
 */
router.get(
  '/:id/jadwal',
  uuidValidation,
  doctorController.getDoctorSchedule
);

/**
 * @route   GET /api/v1/dokter/:id
 * @desc    Get doctor by ID
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  uuidValidation,
  doctorController.getDoctorById
);

/**
 * @route   POST /api/v1/dokter
 * @desc    Create new doctor
 * @access  Private (admin only)
 */
router.post(
  '/',
  authorize(['admin']),
  dokterValidation,
  doctorController.createDoctor
);

/**
 * @route   PUT /api/v1/dokter/:id
 * @desc    Update doctor
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  authorize(['admin']),
  uuidValidation,
  doctorController.updateDoctor
);

/**
 * @route   DELETE /api/v1/dokter/:id
 * @desc    Delete doctor (soft delete)
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  authorize(['admin']),
  uuidValidation,
  doctorController.deleteDoctor
);

module.exports = router;
