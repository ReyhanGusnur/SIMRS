const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all patients with pagination and search
 */
exports.getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let sql = `
      SELECT 
        pasien_id,
        no_rm,
        nik,
        nama_lengkap,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        golongan_darah,
        alamat,
        telepon,
        email,
        created_at,
        updated_at
      FROM pasien
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (search) {
      sql += `
        AND (
          nama_lengkap ILIKE $${paramCount}
          OR no_rm ILIKE $${paramCount}
          OR nik ILIKE $${paramCount}
        )
      `;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countSql = `
      SELECT COUNT(*) 
      FROM pasien
      WHERE 1=1
      ${search ? `AND (nama_lengkap ILIKE $1 OR no_rm ILIKE $1 OR nik ILIKE $1)` : ''}
    `;

    const countResult = await pool.query(
      countSql,
      search ? [`%${search}%`] : []
    );

    const total = parseInt(countResult.rows[0].count, 10);

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: {
        patients: result.rows,
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
 * Get patient by ID
 */
exports.getPatientById = async (req, res, next) => {
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
      `SELECT * FROM pasien WHERE pasien_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient by No RM
 */
exports.getPatientByNoRM = async (req, res, next) => {
  try {
    const { no_rm } = req.params;

    const result = await pool.query(
      `SELECT * FROM pasien WHERE no_rm = $1`,
      [no_rm]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new patient
 */
exports.createPatient = async (req, res, next) => {
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
      nik,
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      golongan_darah,
      alamat,
      kelurahan,
      kecamatan,
      kota,
      provinsi,
      kode_pos,
      telepon,
      email,
      kontak_darurat,
      telepon_darurat,
      pekerjaan,
      status_pernikahan,
      agama,
      jenis_pembayaran,
      no_bpjs,
      asuransi_nama,
      asuransi_no_polis
    } = req.body;

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM pasien WHERE no_rm LIKE $1`,
      [`${yearMonth}%`]
    );
    const sequence = (parseInt(countResult.rows[0].count, 10) + 1)
      .toString()
      .padStart(4, '0');
    const no_rm = `${yearMonth}${sequence}`;

    if (nik) {
      const nikCheck = await pool.query(
        `SELECT pasien_id FROM pasien WHERE nik = $1`,
        [nik]
      );

      if (nikCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'NIK already exists'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO pasien (
        no_rm,
        nik,
        nama_lengkap,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        golongan_darah,
        alamat,
        kelurahan,
        kecamatan,
        kota,
        provinsi,
        kode_pos,
        telepon,
        email,
        kontak_darurat,
        telepon_darurat,
        pekerjaan,
        status_pernikahan,
        agama,
        jenis_pembayaran,
        no_bpjs,
        asuransi_nama,
        asuransi_no_polis
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      RETURNING *`,
      [
        no_rm,
        nik || null,
        nama_lengkap,
        tempat_lahir || null,
        tanggal_lahir,
        jenis_kelamin || null,
        golongan_darah || null,
        alamat || null,
        kelurahan || null,
        kecamatan || null,
        kota || null,
        provinsi || null,
        kode_pos || null,
        telepon || null,
        email || null,
        kontak_darurat || null,
        telepon_darurat || null,
        pekerjaan || null,
        status_pernikahan || null,
        agama || null,
        jenis_pembayaran || 'Umum',
        no_bpjs || null,
        asuransi_nama || null,
        asuransi_no_polis || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update patient
 */
exports.updatePatient = async (req, res, next) => {
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
      nik,
      nama_lengkap,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      golongan_darah,
      alamat,
      kelurahan,
      kecamatan,
      kota,
      provinsi,
      kode_pos,
      telepon,
      email,
      kontak_darurat,
      telepon_darurat,
      pekerjaan,
      status_pernikahan,
      agama,
      jenis_pembayaran,
      no_bpjs,
      asuransi_nama,
      asuransi_no_polis
    } = req.body;

    const checkPatient = await pool.query(
      `SELECT pasien_id FROM pasien WHERE pasien_id = $1`,
      [id]
    );

    if (checkPatient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (nik) {
      const nikCheck = await pool.query(
        `SELECT pasien_id FROM pasien WHERE nik = $1 AND pasien_id != $2`,
        [nik, id]
      );

      if (nikCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'NIK already exists'
        });
      }
    }

    const result = await pool.query(
      `UPDATE pasien SET
        nik = COALESCE($1, nik),
        nama_lengkap = COALESCE($2, nama_lengkap),
        tempat_lahir = COALESCE($3, tempat_lahir),
        tanggal_lahir = COALESCE($4, tanggal_lahir),
        jenis_kelamin = COALESCE($5, jenis_kelamin),
        golongan_darah = COALESCE($6, golongan_darah),
        alamat = COALESCE($7, alamat),
        kelurahan = COALESCE($8, kelurahan),
        kecamatan = COALESCE($9, kecamatan),
        kota = COALESCE($10, kota),
        provinsi = COALESCE($11, provinsi),
        kode_pos = COALESCE($12, kode_pos),
        telepon = COALESCE($13, telepon),
        email = COALESCE($14, email),
        kontak_darurat = COALESCE($15, kontak_darurat),
        telepon_darurat = COALESCE($16, telepon_darurat),
        pekerjaan = COALESCE($17, pekerjaan),
        status_pernikahan = COALESCE($18, status_pernikahan),
        agama = COALESCE($19, agama),
        jenis_pembayaran = COALESCE($20, jenis_pembayaran),
        no_bpjs = COALESCE($21, no_bpjs),
        asuransi_nama = COALESCE($22, asuransi_nama),
        asuransi_no_polis = COALESCE($23, asuransi_no_polis),
        updated_at = NOW()
      WHERE pasien_id = $24
      RETURNING *`,
      [
        nik ?? null,
        nama_lengkap ?? null,
        tempat_lahir ?? null,
        tanggal_lahir ?? null,
        jenis_kelamin ?? null,
        golongan_darah ?? null,
        alamat ?? null,
        kelurahan ?? null,
        kecamatan ?? null,
        kota ?? null,
        provinsi ?? null,
        kode_pos ?? null,
        telepon ?? null,
        email ?? null,
        kontak_darurat ?? null,
        telepon_darurat ?? null,
        pekerjaan ?? null,
        status_pernikahan ?? null,
        agama ?? null,
        jenis_pembayaran ?? null,
        no_bpjs ?? null,
        asuransi_nama ?? null,
        asuransi_no_polis ?? null,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete patient (hard delete sementara, karena kolom status tidak ada)
 */
exports.deletePatient = async (req, res, next) => {
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
      `DELETE FROM pasien
       WHERE pasien_id = $1
       RETURNING pasien_id, no_rm, nama_lengkap`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get patient statistics
 */
exports.getPatientStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) AS total_patients,
        COUNT(*) FILTER (WHERE jenis_kelamin = 'Laki-laki') AS male_patients,
        COUNT(*) FILTER (WHERE jenis_kelamin = 'Perempuan') AS female_patients,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS new_today
      FROM pasien
    `);

    res.json({
      success: true,
      message: 'Patient statistics retrieved successfully',
      data: stats.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
