const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all medical records with pagination
 */
exports.getAllMedicalRecords = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const pasien_id = req.query.pasien_id || '';

    let query = `
      SELECT 
        rm.rekam_medis_id, rm.tanggal_pemeriksaan, rm.keluhan_utama,
        rm.diagnosa_primer_text, rm.diagnosa_sekunder_text,
        rm.terapi_pengobatan, rm.catatan_tambahan,
        rm.tekanan_darah, rm.suhu, rm.berat_badan, rm.tinggi_badan,
        rm.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.tanggal_lahir, p.jenis_kelamin,
        d.dokter_id, d.nama_lengkap as nama_dokter, d.spesialisasi
      FROM rekam_medis rm
      INNER JOIN pasien p ON rm.pasien_id = p.pasien_id
      INNER JOIN dokter d ON rm.dokter_id = d.dokter_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        rm.diagnosa_primer_text ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (pasien_id) {
      query += ` AND rm.pasien_id = $${paramCount}`;
      params.push(pasien_id);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM rekam_medis rm
      INNER JOIN pasien p ON rm.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR rm.diagnosa_primer_text ILIKE $1)` : ''}
      ${pasien_id ? `AND rm.pasien_id = $${search ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (pasien_id) countParams.push(pasien_id);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY rm.tanggal_pemeriksaan DESC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Medical records retrieved successfully',
      data: {
        medical_records: result.rows,
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
 * Get medical record by ID
 */
exports.getMedicalRecordById = async (req, res, next) => {
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
        rm.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon, p.golongan_darah,
        d.nama_lengkap as nama_dokter, d.spesialisasi,
        prj.no_antrian, prj.jenis_kunjungan, prj.jenis_pembayaran
      FROM rekam_medis rm
      INNER JOIN pasien p ON rm.pasien_id = p.pasien_id
      INNER JOIN dokter d ON rm.dokter_id = d.dokter_id
      LEFT JOIN pendaftaran_rawat_jalan prj ON rm.pendaftaran_id = prj.pendaftaran_id
      WHERE rm.rekam_medis_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      message: 'Medical record retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get medical records by patient
 */
exports.getMedicalRecordsByPatient = async (req, res, next) => {
  try {
    const { pasien_id } = req.params;

    const result = await pool.query(
      `SELECT 
        rm.rekam_medis_id, rm.tanggal_pemeriksaan, rm.keluhan_utama,
        rm.diagnosa_primer_text, rm.terapi_pengobatan,
        rm.tekanan_darah, rm.suhu, rm.berat_badan,
        d.nama_lengkap as nama_dokter, d.spesialisasi
      FROM rekam_medis rm
      INNER JOIN dokter d ON rm.dokter_id = d.dokter_id
      WHERE rm.pasien_id = $1
      ORDER BY rm.tanggal_pemeriksaan DESC`,
      [pasien_id]
    );

    res.json({
      success: true,
      message: 'Medical records retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new medical record
 */
exports.createMedicalRecord = async (req, res, next) => {
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
      pendaftaran_id,
      keluhan_utama,
      riwayat_penyakit_sekarang,
      riwayat_penyakit_dahulu,
      riwayat_alergi,
      pemeriksaan_fisik,
      diagnosa_primer_text,
      diagnosa_sekunder_text,
      terapi_pengobatan,
      tindakan_medis,
      catatan_tambahan,
      tekanan_darah,
      suhu,
      berat_badan,
      tinggi_badan,
      denyut_nadi,
      respirasi
    } = req.body;

    // Verify patient exists
    const patientCheck = await client.query(
      `SELECT pasien_id FROM pasien WHERE pasien_id = $1`,
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

    // Create medical record
    const result = await client.query(
      `INSERT INTO rekam_medis (
        pasien_id, dokter_id, pendaftaran_id, tanggal_pemeriksaan,
        keluhan_utama, riwayat_penyakit_sekarang, riwayat_penyakit_dahulu,
        riwayat_alergi, pemeriksaan_fisik, diagnosa_primer_text,
        diagnosa_sekunder_text, terapi_pengobatan, tindakan_medis,
        catatan_tambahan, tekanan_darah, suhu, berat_badan, tinggi_badan,
        denyut_nadi, respirasi
      ) VALUES (
        $1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19
      )
      RETURNING 
        rekam_medis_id, tanggal_pemeriksaan, diagnosa_primer_text,
        terapi_pengobatan, created_at`,
      [
        pasien_id, dokter_id, pendaftaran_id, keluhan_utama,
        riwayat_penyakit_sekarang, riwayat_penyakit_dahulu,
        riwayat_alergi, pemeriksaan_fisik, diagnosa_primer_text,
        diagnosa_sekunder_text, terapi_pengobatan, tindakan_medis,
        catatan_tambahan, tekanan_darah, suhu, berat_badan, tinggi_badan,
        denyut_nadi, respirasi
      ]
    );

    // Update registration status if pendaftaran_id provided
    if (pendaftaran_id) {
      await client.query(
        `UPDATE pendaftaran_rawat_jalan 
        SET status_pendaftaran = 'Selesai', updated_at = NOW()
        WHERE pendaftaran_id = $1`,
        [pendaftaran_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Update medical record
 */
exports.updateMedicalRecord = async (req, res, next) => {
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
      keluhan_utama,
      riwayat_penyakit_sekarang,
      riwayat_penyakit_dahulu,
      riwayat_alergi,
      pemeriksaan_fisik,
      diagnosa_primer_text,
      diagnosa_sekunder_text,
      terapi_pengobatan,
      tindakan_medis,
      catatan_tambahan,
      tekanan_darah,
      suhu,
      berat_badan,
      tinggi_badan,
      denyut_nadi,
      respirasi
    } = req.body;

    // Check if only the creating doctor can update
    const checkRecord = await pool.query(
      `SELECT dokter_id FROM rekam_medis WHERE rekam_medis_id = $1`,
      [id]
    );

    if (checkRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const result = await pool.query(
      `UPDATE rekam_medis SET
        keluhan_utama = COALESCE($1, keluhan_utama),
        riwayat_penyakit_sekarang = COALESCE($2, riwayat_penyakit_sekarang),
        riwayat_penyakit_dahulu = COALESCE($3, riwayat_penyakit_dahulu),
        riwayat_alergi = COALESCE($4, riwayat_alergi),
        pemeriksaan_fisik = COALESCE($5, pemeriksaan_fisik),
        diagnosa_primer_text = COALESCE($6, diagnosa_primer_text),
        diagnosa_sekunder_text = COALESCE($7, diagnosa_sekunder_text),
        terapi_pengobatan = COALESCE($8, terapi_pengobatan),
        tindakan_medis = COALESCE($9, tindakan_medis),
        catatan_tambahan = COALESCE($10, catatan_tambahan),
        tekanan_darah = COALESCE($11, tekanan_darah),
        suhu = COALESCE($12, suhu),
        berat_badan = COALESCE($13, berat_badan),
        tinggi_badan = COALESCE($14, tinggi_badan),
        denyut_nadi = COALESCE($15, denyut_nadi),
        respirasi = COALESCE($16, respirasi),
        updated_at = NOW()
      WHERE rekam_medis_id = $17
      RETURNING 
        rekam_medis_id, tanggal_pemeriksaan, diagnosa_primer_text,
        terapi_pengobatan, updated_at`,
      [
        keluhan_utama, riwayat_penyakit_sekarang, riwayat_penyakit_dahulu,
        riwayat_alergi, pemeriksaan_fisik, diagnosa_primer_text,
        diagnosa_sekunder_text, terapi_pengobatan, tindakan_medis,
        catatan_tambahan, tekanan_darah, suhu, berat_badan, tinggi_badan,
        denyut_nadi, respirasi, id
      ]
    );

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get medical record statistics
 */
exports.getMedicalRecordStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE DATE(tanggal_pemeriksaan) = CURRENT_DATE) as today_records,
        COUNT(*) FILTER (WHERE DATE(tanggal_pemeriksaan) >= CURRENT_DATE - INTERVAL '7 days') as week_records,
        COUNT(*) FILTER (WHERE DATE(tanggal_pemeriksaan) >= CURRENT_DATE - INTERVAL '30 days') as month_records
      FROM rekam_medis
    `);

    // Get top diagnoses
    const topDiagnoses = await pool.query(`
      SELECT 
        diagnosa_primer_text,
        COUNT(*) as count
      FROM rekam_medis
      WHERE diagnosa_primer_text IS NOT NULL
        AND DATE(tanggal_pemeriksaan) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY diagnosa_primer_text
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      message: 'Medical record statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        top_diagnoses: topDiagnoses.rows
      }
    });
  } catch (error) {
    next(error);
  }
};
