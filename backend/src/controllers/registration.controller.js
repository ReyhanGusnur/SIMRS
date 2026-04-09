const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all registrations with pagination and filters
 */
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const tanggal = req.query.tanggal || '';
    const status = req.query.status || '';

    let query = `
      SELECT 
        prj.pendaftaran_id, prj.no_antrian, prj.tanggal_kunjungan,
        prj.jenis_kunjungan, prj.jenis_pembayaran, prj.keluhan_utama,
        prj.status_pendaftaran, prj.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.tanggal_lahir, p.jenis_kelamin, p.telepon,
        d.dokter_id, d.nama_lengkap as nama_dokter, d.spesialisasi,
        pol.poli_id, pol.nama_poli
      FROM pendaftaran_rawat_jalan prj
      INNER JOIN pasien p ON prj.pasien_id = p.pasien_id
      INNER JOIN dokter d ON prj.dokter_id = d.dokter_id
      INNER JOIN poli pol ON prj.poli_id = pol.poli_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        prj.no_antrian ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (tanggal) {
      query += ` AND DATE(prj.tanggal_kunjungan) = $${paramCount}`;
      params.push(tanggal);
      paramCount++;
    }

    if (status) {
      query += ` AND prj.status_pendaftaran = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM pendaftaran_rawat_jalan prj
      INNER JOIN pasien p ON prj.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR prj.no_antrian ILIKE $1)` : ''}
      ${tanggal ? `AND DATE(prj.tanggal_kunjungan) = $${search ? 2 : 1}` : ''}
      ${status ? `AND prj.status_pendaftaran = $${search && tanggal ? 3 : search || tanggal ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (tanggal) countParams.push(tanggal);
    if (status) countParams.push(status);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY prj.tanggal_kunjungan DESC, prj.no_antrian ASC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: {
        registrations: result.rows,
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
 * Get registration by ID
 */
exports.getRegistrationById = async (req, res, next) => {
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
        prj.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon, p.email,
        d.nama_lengkap as nama_dokter, d.spesialisasi, d.telepon as telepon_dokter,
        pol.nama_poli, pol.lokasi
      FROM pendaftaran_rawat_jalan prj
      INNER JOIN pasien p ON prj.pasien_id = p.pasien_id
      INNER JOIN dokter d ON prj.dokter_id = d.dokter_id
      INNER JOIN poli pol ON prj.poli_id = pol.poli_id
      WHERE prj.pendaftaran_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new registration
 */
exports.createRegistration = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      pasien_id,
      dokter_id,
      poli_id,
      tanggal_kunjungan,
      jenis_kunjungan,
      jenis_pembayaran,
      keluhan_utama
    } = req.body;

    // Verify patient exists and is active
    const patientCheck = await client.query(
      `SELECT pasien_id, nama_lengkap FROM pasien WHERE pasien_id = $1 AND status = 'Aktif'`,
      [pasien_id]
    );
    if (patientCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Patient not found or inactive'
      });
    }

    // Verify doctor exists and is active
    const doctorCheck = await client.query(
      `SELECT dokter_id, nama_lengkap FROM dokter WHERE dokter_id = $1 AND status = 'Aktif'`,
      [dokter_id]
    );
    if (doctorCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or inactive'
      });
    }

    // Verify poli exists and is active
    const poliCheck = await client.query(
      `SELECT poli_id, nama_poli FROM poli WHERE poli_id = $1 AND status = 'Aktif'`,
      [poli_id]
    );
    if (poliCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Poli not found or inactive'
      });
    }

    // Generate queue number (no_antrian)
    const queueDate = new Date(tanggal_kunjungan).toISOString().split('T')[0];
    const queueResult = await client.query(
      `SELECT COUNT(*) FROM pendaftaran_rawat_jalan 
       WHERE DATE(tanggal_kunjungan) = $1 AND poli_id = $2`,
      [queueDate, poli_id]
    );
    const queueNumber = parseInt(queueResult.rows[0].count) + 1;
    const poliCode = poliCheck.rows[0].nama_poli.substring(0, 3).toUpperCase();
    const no_antrian = `${poliCode}-${queueNumber.toString().padStart(3, '0')}`;

    // Create registration
    const result = await client.query(
      `INSERT INTO pendaftaran_rawat_jalan (
        pasien_id, dokter_id, poli_id, tanggal_kunjungan, no_antrian,
        jenis_kunjungan, jenis_pembayaran, keluhan_utama, status_pendaftaran
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Menunggu')
      RETURNING 
        pendaftaran_id, no_antrian, tanggal_kunjungan, jenis_kunjungan,
        jenis_pembayaran, status_pendaftaran, created_at`,
      [
        pasien_id, dokter_id, poli_id, tanggal_kunjungan, no_antrian,
        jenis_kunjungan, jenis_pembayaran, keluhan_utama
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: {
        ...result.rows[0],
        nama_pasien: patientCheck.rows[0].nama_lengkap,
        nama_dokter: doctorCheck.rows[0].nama_lengkap,
        nama_poli: poliCheck.rows[0].nama_poli
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Update registration status
 */
exports.updateRegistrationStatus = async (req, res, next) => {
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
    const { status_pendaftaran } = req.body;

    const result = await pool.query(
      `UPDATE pendaftaran_rawat_jalan 
      SET status_pendaftaran = $1, updated_at = NOW()
      WHERE pendaftaran_id = $2
      RETURNING 
        pendaftaran_id, no_antrian, status_pendaftaran, updated_at`,
      [status_pendaftaran, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel registration
 */
exports.cancelRegistration = async (req, res, next) => {
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
      `UPDATE pendaftaran_rawat_jalan 
      SET status_pendaftaran = 'Dibatalkan', updated_at = NOW()
      WHERE pendaftaran_id = $1 AND status_pendaftaran = 'Menunggu'
      RETURNING 
        pendaftaran_id, no_antrian, status_pendaftaran`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get registration statistics
 */
exports.getRegistrationStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(*) FILTER (WHERE DATE(tanggal_kunjungan) = $1) as today_registrations,
        COUNT(*) FILTER (WHERE status_pendaftaran = 'Menunggu') as waiting,
        COUNT(*) FILTER (WHERE status_pendaftaran = 'Sedang Dilayani') as in_progress,
        COUNT(*) FILTER (WHERE status_pendaftaran = 'Selesai') as completed,
        COUNT(*) FILTER (WHERE status_pendaftaran = 'Dibatalkan') as cancelled
      FROM pendaftaran_rawat_jalan
      WHERE DATE(tanggal_kunjungan) >= CURRENT_DATE - INTERVAL '30 days'
    `, [today]);

    // Get registrations by poli
    const byPoli = await pool.query(`
      SELECT 
        pol.nama_poli,
        COUNT(*) as count
      FROM pendaftaran_rawat_jalan prj
      INNER JOIN poli pol ON prj.poli_id = pol.poli_id
      WHERE DATE(prj.tanggal_kunjungan) = $1
      GROUP BY pol.nama_poli
      ORDER BY count DESC
    `, [today]);

    res.json({
      success: true,
      message: 'Registration statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        by_poli: byPoli.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get today's queue by poli
 */
exports.getTodayQueue = async (req, res, next) => {
  try {
    const { poli_id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        prj.pendaftaran_id, prj.no_antrian, prj.status_pendaftaran,
        prj.jenis_kunjungan, prj.keluhan_utama,
        p.nama_lengkap as nama_pasien, p.no_rm,
        d.nama_lengkap as nama_dokter,
        pol.nama_poli
      FROM pendaftaran_rawat_jalan prj
      INNER JOIN pasien p ON prj.pasien_id = p.pasien_id
      INNER JOIN dokter d ON prj.dokter_id = d.dokter_id
      INNER JOIN poli pol ON prj.poli_id = pol.poli_id
      WHERE DATE(prj.tanggal_kunjungan) = $1
    `;

    const params = [today];
    if (poli_id) {
      query += ` AND prj.poli_id = $2`;
      params.push(poli_id);
    }

    query += ` ORDER BY prj.no_antrian ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Queue retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
