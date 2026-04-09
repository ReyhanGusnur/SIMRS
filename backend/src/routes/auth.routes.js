const express = require('express');
const router = express.Router();
const {
  login,
  register,
  refreshAccessToken,
  getProfile,
  changePassword,
  logout
} = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  loginValidation, 
  registerValidation 
} = require('../middleware/validation.middleware');
const { validationErrorHandler } = require('../middleware/error.middleware');

/**
 * @route   POST /api/v1/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', loginValidation, validationErrorHandler, login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (Admin only)
 * @access  Private/Admin
 */
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  registerValidation,
  validationErrorHandler,
  register
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshAccessToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getProfile);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', authenticate, logout);

module.exports = router;
