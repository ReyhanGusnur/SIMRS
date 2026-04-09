const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all doctors with pagination and search
 */
exports.getAllDoctors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const spesialisasi = req.query.spesialisasi || '';

    let query = `
      SELECT 
        d.dokter_id, d.nama_lengkap, d.spesialisasi, d.no_sip, d.no_str,
        d.telepon, d.email, d.jadwal_praktek, d.tarif_konsultasi,
        d.status, d.created_at, d.updated_at,
        COUNT(DISTINCT rj.pendaftaran_id) as total_patients
      FROM dokter d
      LEFT JOIN pendaftaran_rawat_jalan rj ON d.dokter_id = rj.dokter_id
      WHERE d.status = 'Aktif'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        d.nama_lengkap ILIKE $${paramCount} OR 
        d.spesialisasi ILIKE $${paramCount} OR 
        d.no_sip ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (spesialisasi) {
      query += ` AND d.spesialisasi ILIKE $${paramCount}`;
      params.push(`%${spesialisasi}%`);
      paramCount++;
    }

    query += ` GROUP BY d.dokter_id`;

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT d.dokter_id) 
      FROM dokter d
      WHERE d.status = 'Aktif'
      ${search ? `AND (d.nama_lengkap ILIKE $1 OR d.spesialisasi ILIKE $1 OR d.no_sip ILIKE $1)` : ''}
      ${spesialisasi ? `AND d.spesialisasi ILIKE $${search ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (spesialisasi) countParams.push(`%${spesialisasi}%`);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY d.nama_lengkap ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: {
        doctors: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor by ID
 */
exports.getDoctorById = async (req, res, next) => {
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
      `SELECT 
        d.*,
        COUNT(DISTINCT rj.pendaftaran_id) as total_patients,
        COUNT(DISTINCT CASE WHEN DATE(rj.tanggal_kunjungan) = CURRENT_DATE THEN rj.pendaftaran_id END) as today_patients
      FROM dokter d
      LEFT JOIN pendaftaran_rawat_jalan rj ON d.dokter_id = rj.dokter_id
      WHERE d.dokter_id = $1
      GROUP BY d.dokter_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new doctor
 */
exports.createDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      nama_lengkap,
      spesialisasi,
      no_sip,
      no_str,
      telepon,
      email,
      alamat,
      jadwal_praktek,
      tarif_konsultasi
    } = req.body;

    // Check if No SIP already exists
    const sipCheck = await pool.query(
      `SELECT dokter_id FROM dokter WHERE no_sip = $1`,
      [no_sip]
    );
    if (sipCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No SIP already exists'
      });
    }

    // Check if No STR already exists
    const strCheck = await pool.query(
      `SELECT dokter_id FROM dokter WHERE no_str = $1`,
      [no_str]
    );
    if (strCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No STR already exists'
      });
    }

    const result = await pool.query(
      `INSERT INTO dokter (
        nama_lengkap, spesialisasi, no_sip, no_str, telepon, 
        email, alamat, jadwal_praktek, tarif_konsultasi, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Aktif')
      RETURNING 
        dokter_id, nama_lengkap, spesialisasi, no_sip, telepon, 
        email, tarif_konsultasi, status, created_at`,
      [
        nama_lengkap, spesialisasi, no_sip, no_str, telepon,
        email, alamat, jadwal_praktek, tarif_konsultasi
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor
 */
exports.updateDoctor = async (req, res, next) => {
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
    const {
      nama_lengkap,
      spesialisasi,
      no_sip,
      no_str,
      telepon,
      email,
      alamat,
      jadwal_praktek,
      tarif_konsultasi
    } = req.body;

    // Check if doctor exists
    const checkDoctor = await pool.query(
      `SELECT dokter_id FROM dokter WHERE dokter_id = $1`,
      [id]
    );

    if (checkDoctor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if No SIP already exists (excluding current doctor)
    if (no_sip) {
      const sipCheck = await pool.query(
        `SELECT dokter_id FROM dokter WHERE no_sip = $1 AND dokter_id != $2`,
        [no_sip, id]
      );
      if (sipCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No SIP already exists'
        });
      }
    }

    // Check if No STR already exists (excluding current doctor)
    if (no_str) {
      const strCheck = await pool.query(
        `SELECT dokter_id FROM dokter WHERE no_str = $1 AND dokter_id != $2`,
        [no_str, id]
      );
      if (strCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No STR already exists'
        });
      }
    }

    const result = await pool.query(
      `UPDATE dokter SET
        nama_lengkap = COALESCE($1, nama_lengkap),
        spesialisasi = COALESCE($2, spesialisasi),
        no_sip = COALESCE($3, no_sip),
        no_str = COALESCE($4, no_str),
        telepon = COALESCE($5, telepon),
        email = COALESCE($6, email),
        alamat = COALESCE($7, alamat),
        jadwal_praktek = COALESCE($8, jadwal_praktek),
        tarif_konsultasi = COALESCE($9, tarif_konsultasi),
        updated_at = NOW()
      WHERE dokter_id = $10
      RETURNING 
        dokter_id, nama_lengkap, spesialisasi, no_sip, telepon,
        email, tarif_konsultasi, status, updated_at`,
      [
        nama_lengkap, spesialisasi, no_sip, no_str, telepon,
        email, alamat, jadwal_praktek, tarif_konsultasi, id
      ]
    );

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete doctor (soft delete)
 */
exports.deleteDoctor = async (req, res, next) => {
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
      `UPDATE dokter 
      SET status = 'Tidak Aktif', updated_at = NOW()
      WHERE dokter_id = $1
      RETURNING dokter_id, nama_lengkap, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor schedule
 */
exports.getDoctorSchedule = async (req, res, next) => {
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
      `SELECT dokter_id, nama_lengkap, spesialisasi, jadwal_praktek
      FROM dokter 
      WHERE dokter_id = $1 AND status = 'Aktif'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor schedule retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor statistics
 */
exports.getDoctorStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_doctors,
        COUNT(*) FILTER (WHERE status = 'Aktif') as active_doctors,
        COUNT(DISTINCT spesialisasi) as total_specializations,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_today
      FROM dokter
    `);

    // Get top specializations
    const specializations = await pool.query(`
      SELECT 
        spesialisasi,
        COUNT(*) as count
      FROM dokter
      WHERE status = 'Aktif'
      GROUP BY spesialisasi
      ORDER BY count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      message: 'Doctor statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        top_specializations: specializations.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctors by specialization
 */
exports.getDoctorsBySpecialization = async (req, res, next) => {
  try {
    const { spesialisasi } = req.params;

    const result = await pool.query(
      `SELECT 
        dokter_id, nama_lengkap, spesialisasi, telepon, 
        email, jadwal_praktek, tarif_konsultasi
      FROM dokter 
      WHERE spesialisasi ILIKE $1 AND status = 'Aktif'
      ORDER BY nama_lengkap ASC`,
      [`%${spesialisasi}%`]
    );

    res.json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
