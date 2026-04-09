const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all laboratory requests with pagination
 */
exports.getAllLabRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const tanggal = req.query.tanggal || '';

    let query = `
      SELECT 
        pl.permintaan_lab_id, pl.no_permintaan, pl.tanggal_permintaan,
        pl.jenis_pemeriksaan, pl.catatan, pl.status_pemeriksaan,
        pl.hasil_pemeriksaan, pl.tanggal_hasil, pl.nilai_normal,
        pl.keterangan_hasil, pl.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.tanggal_lahir, p.jenis_kelamin,
        d.dokter_id, d.nama_lengkap as nama_dokter,
        u.full_name as petugas_lab
      FROM permintaan_laboratorium pl
      INNER JOIN pasien p ON pl.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pl.dokter_id = d.dokter_id
      LEFT JOIN users u ON pl.petugas_lab_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        pl.no_permintaan ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND pl.status_pemeriksaan = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (tanggal) {
      query += ` AND DATE(pl.tanggal_permintaan) = $${paramCount}`;
      params.push(tanggal);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM permintaan_laboratorium pl
      INNER JOIN pasien p ON pl.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR pl.no_permintaan ILIKE $1)` : ''}
      ${status ? `AND pl.status_pemeriksaan = $${search ? 2 : 1}` : ''}
      ${tanggal ? `AND DATE(pl.tanggal_permintaan) = $${search && status ? 3 : search || status ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (status) countParams.push(status);
    if (tanggal) countParams.push(tanggal);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY pl.tanggal_permintaan DESC, pl.created_at DESC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Laboratory requests retrieved successfully',
      data: {
        lab_requests: result.rows,
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
 * Get laboratory request by ID
 */
exports.getLabRequestById = async (req, res, next) => {
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
        pl.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon,
        d.nama_lengkap as nama_dokter, d.spesialisasi,
        rm.rekam_medis_id, rm.diagnosa_primer_text,
        u.full_name as petugas_lab
      FROM permintaan_laboratorium pl
      INNER JOIN pasien p ON pl.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pl.dokter_id = d.dokter_id
      LEFT JOIN rekam_medis rm ON pl.rekam_medis_id = rm.rekam_medis_id
      LEFT JOIN users u ON pl.petugas_lab_id = u.user_id
      WHERE pl.permintaan_lab_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found'
      });
    }

    res.json({
      success: true,
      message: 'Laboratory request retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get laboratory requests by patient
 */
exports.getLabRequestsByPatient = async (req, res, next) => {
  try {
    const { pasien_id } = req.params;

    const result = await pool.query(
      `SELECT 
        pl.permintaan_lab_id, pl.no_permintaan, pl.tanggal_permintaan,
        pl.jenis_pemeriksaan, pl.status_pemeriksaan, pl.hasil_pemeriksaan,
        pl.tanggal_hasil, pl.keterangan_hasil,
        d.nama_lengkap as nama_dokter
      FROM permintaan_laboratorium pl
      INNER JOIN dokter d ON pl.dokter_id = d.dokter_id
      WHERE pl.pasien_id = $1
      ORDER BY pl.tanggal_permintaan DESC`,
      [pasien_id]
    );

    res.json({
      success: true,
      message: 'Laboratory requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new laboratory request
 */
exports.createLabRequest = async (req, res, next) => {
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
      catatan
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
      `SELECT COUNT(*) FROM permintaan_laboratorium 
       WHERE no_permintaan LIKE $1`,
      [`LAB-${yearMonth}%`]
    );
    const sequence = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
    const no_permintaan = `LAB-${yearMonth}${sequence}`;

    // Create laboratory request
    const result = await client.query(
      `INSERT INTO permintaan_laboratorium (
        pasien_id, dokter_id, rekam_medis_id, no_permintaan,
        tanggal_permintaan, jenis_pemeriksaan, catatan, status_pemeriksaan
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, 'Belum Diproses')
      RETURNING 
        permintaan_lab_id, no_permintaan, tanggal_permintaan,
        jenis_pemeriksaan, status_pemeriksaan, created_at`,
      [pasien_id, dokter_id, rekam_medis_id, no_permintaan, jenis_pemeriksaan, catatan]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Laboratory request created successfully',
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
 * Update laboratory request status
 */
exports.updateLabStatus = async (req, res, next) => {
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
    const petugas_lab_id = req.user.user_id; // From auth middleware

    const result = await pool.query(
      `UPDATE permintaan_laboratorium 
      SET status_pemeriksaan = $1, 
          petugas_lab_id = $2,
          updated_at = NOW()
      WHERE permintaan_lab_id = $3
      RETURNING 
        permintaan_lab_id, no_permintaan, status_pemeriksaan, updated_at`,
      [status_pemeriksaan, petugas_lab_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found'
      });
    }

    res.json({
      success: true,
      message: 'Laboratory status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit laboratory result
 */
exports.submitLabResult = async (req, res, next) => {
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
      nilai_normal,
      keterangan_hasil
    } = req.body;
    const petugas_lab_id = req.user.user_id;

    // Check if request exists and is in progress
    const checkRequest = await pool.query(
      `SELECT status_pemeriksaan FROM permintaan_laboratorium 
       WHERE permintaan_lab_id = $1`,
      [id]
    );

    if (checkRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found'
      });
    }

    if (checkRequest.rows[0].status_pemeriksaan === 'Belum Diproses') {
      return res.status(400).json({
        success: false,
        message: 'Laboratory request must be in progress before submitting results'
      });
    }

    const result = await pool.query(
      `UPDATE permintaan_laboratorium 
      SET hasil_pemeriksaan = $1,
          nilai_normal = $2,
          keterangan_hasil = $3,
          tanggal_hasil = NOW(),
          status_pemeriksaan = 'Selesai',
          petugas_lab_id = $4,
          updated_at = NOW()
      WHERE permintaan_lab_id = $5
      RETURNING 
        permintaan_lab_id, no_permintaan, hasil_pemeriksaan,
        tanggal_hasil, status_pemeriksaan`,
      [hasil_pemeriksaan, nilai_normal, keterangan_hasil, petugas_lab_id, id]
    );

    res.json({
      success: true,
      message: 'Laboratory result submitted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update laboratory result
 */
exports.updateLabResult = async (req, res, next) => {
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
      nilai_normal,
      keterangan_hasil
    } = req.body;

    const result = await pool.query(
      `UPDATE permintaan_laboratorium 
      SET hasil_pemeriksaan = COALESCE($1, hasil_pemeriksaan),
          nilai_normal = COALESCE($2, nilai_normal),
          keterangan_hasil = COALESCE($3, keterangan_hasil),
          updated_at = NOW()
      WHERE permintaan_lab_id = $4 AND status_pemeriksaan = 'Selesai'
      RETURNING 
        permintaan_lab_id, no_permintaan, hasil_pemeriksaan,
        tanggal_hasil, keterangan_hasil, updated_at`,
      [hasil_pemeriksaan, nilai_normal, keterangan_hasil, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found or not completed yet'
      });
    }

    res.json({
      success: true,
      message: 'Laboratory result updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel laboratory request
 */
exports.cancelLabRequest = async (req, res, next) => {
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
      `UPDATE permintaan_laboratorium 
      SET status_pemeriksaan = 'Dibatalkan', updated_at = NOW()
      WHERE permintaan_lab_id = $1 
        AND status_pemeriksaan IN ('Belum Diproses', 'Sedang Diproses')
      RETURNING 
        permintaan_lab_id, no_permintaan, status_pemeriksaan`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory request not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Laboratory request cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get laboratory statistics
 */
exports.getLabStats = async (req, res, next) => {
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
      FROM permintaan_laboratorium
      WHERE DATE(tanggal_permintaan) >= CURRENT_DATE - INTERVAL '30 days'
    `, [today]);

    // Get top examinations
    const topExams = await pool.query(`
      SELECT 
        jenis_pemeriksaan,
        COUNT(*) as count
      FROM permintaan_laboratorium
      WHERE DATE(tanggal_permintaan) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY jenis_pemeriksaan
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      message: 'Laboratory statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        top_examinations: topExams.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending laboratory requests (for lab staff)
 */
exports.getPendingRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        pl.permintaan_lab_id, pl.no_permintaan, pl.tanggal_permintaan,
        pl.jenis_pemeriksaan, pl.catatan, pl.status_pemeriksaan,
        p.no_rm, p.nama_lengkap as nama_pasien, p.jenis_kelamin,
        p.tanggal_lahir,
        d.nama_lengkap as nama_dokter
      FROM permintaan_laboratorium pl
      INNER JOIN pasien p ON pl.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pl.dokter_id = d.dokter_id
      WHERE pl.status_pemeriksaan IN ('Belum Diproses', 'Sedang Diproses')
      ORDER BY pl.tanggal_permintaan ASC, pl.created_at ASC`
    );

    res.json({
      success: true,
      message: 'Pending laboratory requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
