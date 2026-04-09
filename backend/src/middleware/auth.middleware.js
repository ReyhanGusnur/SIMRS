const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Middleware: Authentication (JWT)
 */
const authenticate = async (req, res, next) => {
  try {
    // Ambil token dari header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Ambil user dari database
    const result = await query(
      `SELECT user_id, username, full_name, email, role, is_active
       FROM users
       WHERE user_id = $1
       LIMIT 1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user ke request (safe fields only)
    req.user = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    let message = 'Invalid token';

    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    return res.status(401).json({
      success: false,
      message
    });
  }
};

/**
 * Middleware: Authorization (Role-based)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Middleware: Ownership Check
 * User hanya boleh akses datanya sendiri (kecuali admin)
 */
const checkOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    const resourceUserId =
      req.params[userIdField] || req.body[userIdField];

    // Admin boleh akses semua
    if (req.user.role === 'admin') {
      return next();
    }

    // Pastikan tipe sama (hindari bug string vs number)
    if (parseInt(resourceUserId) !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message:
          'Access forbidden. You can only access your own resources.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership
};
