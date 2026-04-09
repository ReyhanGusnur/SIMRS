const express = require('express');
const router = express.Router();
const poliController = require('../controllers/poli.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { uuidValidation } = require('../middleware/validation.middleware');

/**
 * Validation for Poli
 */
const poliValidation = [
  body('nama_poli')
    .trim()
    .notEmpty().withMessage('Nama poli is required')
    .isLength({ max: 100 }).withMessage('Nama poli cannot exceed 100 characters'),
  body('kode_poli')
    .trim()
    .notEmpty().withMessage('Kode poli is required')
    .isLength({ max: 20 }).withMessage('Kode poli cannot exceed 20 characters')
    .matches(/^[A-Z0-9-]+$/).withMessage('Kode poli must contain only uppercase letters, numbers, and hyphens'),
  body('lokasi')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Lokasi cannot exceed 255 characters'),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone format')
];

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/poli
 * @desc    Get all poli
 * @access  Private (all roles)
 */
router.get(
  '/',
  poliController.getAllPoli
);

/**
 * @route   GET /api/v1/poli/:id
 * @desc    Get poli by ID
 * @access  Private (all roles)
 */
router.get(
  '/:id',
  uuidValidation,
  poliController.getPoliById
);

/**
 * @route   POST /api/v1/poli
 * @desc    Create new poli
 * @access  Private (admin only)
 */
router.post(
  '/',
  authorize(['admin']),
  poliValidation,
  poliController.createPoli
);

/**
 * @route   PUT /api/v1/poli/:id
 * @desc    Update poli
 * @access  Private (admin only)
 */
router.put(
  '/:id',
  authorize(['admin']),
  uuidValidation,
  poliController.updatePoli
);

/**
 * @route   DELETE /api/v1/poli/:id
 * @desc    Delete poli (soft delete)
 * @access  Private (admin only)
 */
router.delete(
  '/:id',
  authorize(['admin']),
  uuidValidation,
  poliController.deletePoli
);

module.exports = router;
