const { query } = require('../config/database');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  hashPassword, 
  comparePassword,
  verifyRefreshToken 
} = require('../utils/auth');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const result = await query(
    `SELECT user_id, username, password_hash, full_name, email, role, is_active 
     FROM users 
     WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const user = result.rows[0];

  // Check if account is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.user_id,
    username: user.username,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Update last login
  await query(
    `UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
    [user.user_id]
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/register
 * @access  Private (Admin only)
 */
const register = asyncHandler(async (req, res) => {
  const { username, password, full_name, email, phone, role } = req.body;

  // Check if username already exists
  const existingUser = await query(
    'SELECT user_id FROM users WHERE username = $1',
    [username]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Username already exists'
    });
  }

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Insert new user
  const result = await query(
    `INSERT INTO users (username, password_hash, full_name, email, phone, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, username, full_name, email, phone, role, is_active, created_at`,
    [username, hashedPassword, full_name, email, phone, role]
  );

  const newUser = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: newUser
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if user still exists and is active
  const result = await query(
    `SELECT user_id, username, role, is_active 
     FROM users 
     WHERE user_id = $1`,
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

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: user.user_id,
    username: user.username,
    role: user.role
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT user_id, username, full_name, email, phone, role, is_active, created_at 
     FROM users 
     WHERE user_id = $1`,
    [req.user.user_id]
  );

  res.json({
    success: true,
    data: {
      user: result.rows[0]
    }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [req.user.user_id]
  );

  const user = result.rows[0];

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [hashedPassword, req.user.user_id]
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Logout (client-side token removal)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Dalam JWT stateless, logout dilakukan di client dengan menghapus token
  // Jika ingin implementasi blacklist token, bisa tambahkan logic di sini
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  login,
  register,
  refreshAccessToken,
  getProfile,
  changePassword,
  logout
};
