const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all radiology requests with pagination
 */
exports.getAllRadiologyRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const tanggal = req.query.tanggal || '';

    let query = `
      SELECT 
        pr.permintaan_radiologi_id, pr.no_permintaan, pr.tanggal_permintaan,
        pr.jenis_pemeriksaan, pr.bagian_tubuh, pr.catatan_klinis,
        pr.status_pemeriksaan, pr.hasil_pemeriksaan, pr.tanggal_hasil,
        pr.kesan, pr.saran, pr.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.tanggal_lahir, p.jenis_kelamin,
        d.dokter_id, d.nama_lengkap as nama_dokter,
        u.full_name as petugas_radiologi
      FROM permintaan_radiologi pr
      INNER JOIN pasien p ON pr.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pr.dokter_id = d.dokter_id
      LEFT JOIN users u ON pr.petugas_radiologi_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        pr.no_permintaan ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND pr.status_pemeriksaan = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (tanggal) {
      query += ` AND DATE(pr.tanggal_permintaan) = $${paramCount}`;
      params.push(tanggal);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM permintaan_radiologi pr
      INNER JOIN pasien p ON pr.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR pr.no_permintaan ILIKE $1)` : ''}
      ${status ? `AND pr.status_pemeriksaan = $${search ? 2 : 1}` : ''}
      ${tanggal ? `AND DATE(pr.tanggal_permintaan) = $${search && status ? 3 : search || status ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (status) countParams.push(status);
    if (tanggal) countParams.push(tanggal);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY pr.tanggal_permintaan DESC, pr.created_at DESC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Radiology requests retrieved successfully',
      data: {
        radiology_requests: result.rows,
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
 * Get radiology request by ID
 */
exports.getRadiologyRequestById = async (req, res, next) => {
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
        pr.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon, p.golongan_darah,
        d.nama_lengkap as nama_dokter, d.spesialisasi,
        rm.rekam_medis_id, rm.diagnosa_primer_text,
        u.full_name as petugas_radiologi
      FROM permintaan_radiologi pr
      INNER JOIN pasien p ON pr.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pr.dokter_id = d.dokter_id
      LEFT JOIN rekam_medis rm ON pr.rekam_medis_id = rm.rekam_medis_id
      LEFT JOIN users u ON pr.petugas_radiologi_id = u.user_id
      WHERE pr.permintaan_radiologi_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Radiology request not found'
      });
    }

    res.json({
      success: true,
      message: 'Radiology request retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get radiology requests by patient
 */
exports.getRadiologyRequestsByPatient = async (req, res, next) => {
  try {
    const { pasien_id } = req.params;

    const result = await pool.query(
      `SELECT 
        pr.permintaan_radiologi_id, pr.no_permintaan, pr.tanggal_permintaan,
        pr.jenis_pemeriksaan, pr.bagian_tubuh, pr.status_pemeriksaan,
        pr.hasil_pemeriksaan, pr.tanggal_hasil, pr.kesan, pr.saran,
        d.nama_lengkap as nama_dokter
      FROM permintaan_radiologi pr
      INNER JOIN dokter d ON pr.dokter_id = d.dokter_id
      WHERE pr.pasien_id = $1
      ORDER BY pr.tanggal_permintaan DESC`,
      [pasien_id]
    );

    res.json({
      success: true,
      message: 'Radiology requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new radiology request
 */
exports.createRadiologyRequest = async (req, res, next) => {
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
      rekam_medis_id,
      jenis_pemeriksaan,
      bagian_tubuh,
      catatan_klinis
    } = req.body;

    // Verify patient exists
    const patientCheck = await client.query(
      `SELECT pasien_id, nama_lengkap FROM pasien WHERE pasien_id = $1`,
      [pasien_id]
    );
    if (patientCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify doctor exists
    const doctorCheck = await client.query(
      `SELECT dokter_id FROM dokter WHERE dokter_id = $1`,
      [dokter_id]
    );
    if (doctorCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Generate request number
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM permintaan_radiologi 
       WHERE no_permintaan LIKE $1`,
      [`RAD-${yearMonth}%`]
    );
    const sequence = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
    const no_permintaan = `RAD-${yearMonth}${sequence}`;

    // Create radiology request
    const result = await client.query(
      `INSERT INTO permintaan_radiologi (
        pasien_id, dokter_id, rekam_medis_id, no_permintaan,
        tanggal_permintaan, jenis_pemeriksaan, bagian_tubuh,
        catatan_klinis, status_pemeriksaan
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'Belum Diproses')
      RETURNING 
        permintaan_radiologi_id, no_permintaan, tanggal_permintaan,
        jenis_pemeriksaan, bagian_tubuh, status_pemeriksaan, created_at`,
      [
        pasien_id, dokter_id, rekam_medis_id, no_permintaan,
        jenis_pemeriksaan, bagian_tubuh, catatan_klinis
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Radiology request created successfully',
      data: {
        ...result.rows[0],
        nama_pasien: patientCheck.rows[0].nama_lengkap
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
 * Update radiology request status
 */
exports.updateRadiologyStatus = async (req, res, next) => {
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
    const { status_pemeriksaan } = req.body;
    const petugas_radiologi_id = req.user.user_id; // From auth middleware

    const result = await pool.query(
      `UPDATE permintaan_radiologi 
      SET status_pemeriksaan = $1, 
          petugas_radiologi_id = $2,
          updated_at = NOW()
      WHERE permintaan_radiologi_id = $3
      RETURNING 
        permintaan_radiologi_id, no_permintaan, status_pemeriksaan, updated_at`,
      [status_pemeriksaan, petugas_radiologi_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Radiology request not found'
      });
    }

    res.json({
      success: true,
      message: 'Radiology status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit radiology result
 */
exports.submitRadiologyResult = async (req, res, next) => {
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
      hasil_pemeriksaan,
      kesan,
      saran
    } = req.body;
    const petugas_radiologi_id = req.user.user_id;

    // Check if request exists and is in progress
    const checkRequest = await pool.query(
      `SELECT status_pemeriksaan FROM permintaan_radiologi 
       WHERE permintaan_radiologi_id = $1`,
      [id]
    );

    if (checkRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Radiology request not found'
      });
    }

    if (checkRequest.rows[0].status_pemeriksaan === 'Belum Diproses') {
      return res.status(400).json({
        success: false,
        message: 'Radiology request must be in progress before submitting results'
      });
    }

    const result = await pool.query(
      `UPDATE permintaan_radiologi 
      SET hasil_pemeriksaan = $1,
          kesan = $2,
          saran = $3,
          tanggal_hasil = NOW(),
          status_pemeriksaan = 'Selesai',
          petugas_radiologi_id = $4,
          updated_at = NOW()
      WHERE permintaan_radiologi_id = $5
      RETURNING 
        permintaan_radiologi_id, no_permintaan, hasil_pemeriksaan,
        kesan, saran, tanggal_hasil, status_pemeriksaan`,
      [hasil_pemeriksaan, kesan, saran, petugas_radiologi_id, id]
    );

    res.json({
      success: true,
      message: 'Radiology result submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update radiology result
 */
exports.updateRadiologyResult = async (req, res, next) => {
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
      hasil_pemeriksaan,
      kesan,
      saran
    } = req.body;

    const result = await pool.query(
      `UPDATE permintaan_radiologi 
      SET hasil_pemeriksaan = COALESCE($1, hasil_pemeriksaan),
          kesan = COALESCE($2, kesan),
          saran = COALESCE($3, saran),
          updated_at = NOW()
      WHERE permintaan_radiologi_id = $4 AND status_pemeriksaan = 'Selesai'
      RETURNING 
        permintaan_radiologi_id, no_permintaan, hasil_pemeriksaan,
        kesan, saran, tanggal_hasil, updated_at`,
      [hasil_pemeriksaan, kesan, saran, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Radiology request not found or not completed yet'
      });
    }

    res.json({
      success: true,
      message: 'Radiology result updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel radiology request
 */
exports.cancelRadiologyRequest = async (req, res, next) => {
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
      `UPDATE permintaan_radiologi 
      SET status_pemeriksaan = 'Dibatalkan', updated_at = NOW()
      WHERE permintaan_radiologi_id = $1 
        AND status_pemeriksaan IN ('Belum Diproses', 'Sedang Diproses')
      RETURNING 
        permintaan_radiologi_id, no_permintaan, status_pemeriksaan`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Radiology request not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Radiology request cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get radiology statistics
 */
exports.getRadiologyStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE DATE(tanggal_permintaan) = $1) as today_requests,
        COUNT(*) FILTER (WHERE status_pemeriksaan = 'Belum Diproses') as pending,
        COUNT(*) FILTER (WHERE status_pemeriksaan = 'Sedang Diproses') as in_progress,
        COUNT(*) FILTER (WHERE status_pemeriksaan = 'Selesai') as completed,
        COUNT(*) FILTER (WHERE status_pemeriksaan = 'Dibatalkan') as cancelled,
        COUNT(*) FILTER (WHERE DATE(tanggal_hasil) = $1) as today_completed
      FROM permintaan_radiologi
      WHERE DATE(tanggal_permintaan) >= CURRENT_DATE - INTERVAL '30 days'
    `, [today]);

    // Get top examinations
    const topExams = await pool.query(`
      SELECT 
        jenis_pemeriksaan,
        COUNT(*) as count
      FROM permintaan_radiologi
      WHERE DATE(tanggal_permintaan) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY jenis_pemeriksaan
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get top body parts
    const topBodyParts = await pool.query(`
      SELECT 
        bagian_tubuh,
        COUNT(*) as count
      FROM permintaan_radiologi
      WHERE DATE(tanggal_permintaan) >= CURRENT_DATE - INTERVAL '30 days'
        AND bagian_tubuh IS NOT NULL
      GROUP BY bagian_tubuh
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      message: 'Radiology statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        top_examinations: topExams.rows,
        top_body_parts: topBodyParts.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending radiology requests (for radiology staff)
 */
exports.getPendingRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        pr.permintaan_radiologi_id, pr.no_permintaan, pr.tanggal_permintaan,
        pr.jenis_pemeriksaan, pr.bagian_tubuh, pr.catatan_klinis,
        pr.status_pemeriksaan,
        p.no_rm, p.nama_lengkap as nama_pasien, p.jenis_kelamin,
        p.tanggal_lahir,
        d.nama_lengkap as nama_dokter
      FROM permintaan_radiologi pr
      INNER JOIN pasien p ON pr.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pr.dokter_id = d.dokter_id
      WHERE pr.status_pemeriksaan IN ('Belum Diproses', 'Sedang Diproses')
      ORDER BY pr.tanggal_permintaan ASC, pr.created_at ASC`
    );

    res.json({
      success: true,
      message: 'Pending radiology requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
