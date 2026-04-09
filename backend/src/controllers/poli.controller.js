const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all poli
 */
exports.getAllPoli = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.poli_id, p.nama_poli, p.kode_poli, p.lokasi, 
        p.telepon, p.status, p.created_at,
        COUNT(DISTINCT d.dokter_id) as total_doctors
      FROM poli p
      LEFT JOIN dokter d ON d.spesialisasi = p.nama_poli AND d.status = 'Aktif'
      WHERE p.status = 'Aktif'
      GROUP BY p.poli_id
      ORDER BY p.nama_poli ASC`
    );

    res.json({
      success: true,
      message: 'Poli retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get poli by ID
 */
exports.getPoliById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM poli WHERE poli_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Poli not found'
      });
    }

    res.json({
      success: true,
      message: 'Poli retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new poli
 */
exports.createPoli = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama_poli, kode_poli, lokasi, telepon } = req.body;

    // Check if kode_poli already exists
    const codeCheck = await pool.query(
      `SELECT poli_id FROM poli WHERE kode_poli = $1`,
      [kode_poli]
    );
    if (codeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kode poli already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO poli (nama_poli, kode_poli, lokasi, telepon, status)
      VALUES ($1, $2, $3, $4, 'Aktif')
      RETURNING poli_id, nama_poli, kode_poli, lokasi, status, created_at`,
      [nama_poli, kode_poli, lokasi, telepon]
    );

    res.status(201).json({
      success: true,
      message: 'Poli created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update poli
 */
exports.updatePoli = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { nama_poli, kode_poli, lokasi, telepon } = req.body;

    // Check if poli exists
    const checkPoli = await pool.query(
      `SELECT poli_id FROM poli WHERE poli_id = $1`,
      [id]
    );

    if (checkPoli.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Poli not found'
      });
    }

    // Check if kode_poli already exists (excluding current poli)
    if (kode_poli) {
      const codeCheck = await pool.query(
        `SELECT poli_id FROM poli WHERE kode_poli = $1 AND poli_id != $2`,
        [kode_poli, id]
      );
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Kode poli already exists'
        });
      }
    }

    const result = await pool.query(
      `UPDATE poli SET
        nama_poli = COALESCE($1, nama_poli),
        kode_poli = COALESCE($2, kode_poli),
        lokasi = COALESCE($3, lokasi),
        telepon = COALESCE($4, telepon),
        updated_at = NOW()
      WHERE poli_id = $5
      RETURNING poli_id, nama_poli, kode_poli, lokasi, status, updated_at`,
      [nama_poli, kode_poli, lokasi, telepon, id]
    );

    res.json({
      success: true,
      message: 'Poli updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete poli (soft delete)
 */
exports.deletePoli = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE poli 
      SET status = 'Tidak Aktif', updated_at = NOW()
      WHERE poli_id = $1
      RETURNING poli_id, nama_poli, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Poli not found'
      });
    }

    res.json({
      success: true,
      message: 'Poli deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
