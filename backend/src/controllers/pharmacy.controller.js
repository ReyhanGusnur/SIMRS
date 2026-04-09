const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all pharmacy requests with pagination
 */
exports.getAllPharmacyRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const tanggal = req.query.tanggal || '';

    let query = `
      SELECT 
        pf.resep_obat_id, pf.no_resep, pf.tanggal_resep,
        pf.status_resep, pf.tanggal_diserahkan, pf.total_harga,
        pf.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.jenis_kelamin,
        d.dokter_id, d.nama_lengkap as nama_dokter,
        u.full_name as apoteker
      FROM resep_obat pf
      INNER JOIN pasien p ON pf.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pf.dokter_id = d.dokter_id
      LEFT JOIN users u ON pf.apoteker_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        pf.no_resep ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND pf.status_resep = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (tanggal) {
      query += ` AND DATE(pf.tanggal_resep) = $${paramCount}`;
      params.push(tanggal);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM resep_obat pf
      INNER JOIN pasien p ON pf.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR pf.no_resep ILIKE $1)` : ''}
      ${status ? `AND pf.status_resep = $${search ? 2 : 1}` : ''}
      ${tanggal ? `AND DATE(pf.tanggal_resep) = $${search && status ? 3 : search || status ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (status) countParams.push(status);
    if (tanggal) countParams.push(tanggal);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY pf.tanggal_resep DESC, pf.created_at DESC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Pharmacy requests retrieved successfully',
      data: {
        pharmacy_requests: result.rows,
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
 * Get pharmacy request by ID with details
 */
exports.getPharmacyRequestById = async (req, res, next) => {
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

    // Get main prescription data
    const prescriptionResult = await pool.query(
      `SELECT 
        pf.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon,
        d.nama_lengkap as nama_dokter, d.spesialisasi,
        rm.rekam_medis_id, rm.diagnosa_primer_text,
        u.full_name as apoteker
      FROM resep_obat pf
      INNER JOIN pasien p ON pf.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pf.dokter_id = d.dokter_id
      LEFT JOIN rekam_medis rm ON pf.rekam_medis_id = rm.rekam_medis_id
      LEFT JOIN users u ON pf.apoteker_id = u.user_id
      WHERE pf.resep_obat_id = $1`,
      [id]
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy request not found'
      });
    }

    // Get prescription details (medications)
    const detailsResult = await pool.query(
      `SELECT 
        detail_resep_id, nama_obat, dosis, jumlah, 
        satuan, aturan_pakai, harga_satuan, subtotal
      FROM detail_resep_obat
      WHERE resep_obat_id = $1
      ORDER BY detail_resep_id`,
      [id]
    );

    const data = {
      ...prescriptionResult.rows[0],
      medications: detailsResult.rows
    };

    res.json({
      success: true,
      message: 'Pharmacy request retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pharmacy requests by patient
 */
exports.getPharmacyRequestsByPatient = async (req, res, next) => {
  try {
    const { pasien_id } = req.params;

    const result = await pool.query(
      `SELECT 
        pf.resep_obat_id, pf.no_resep, pf.tanggal_resep,
        pf.status_resep, pf.total_harga, pf.tanggal_diserahkan,
        d.nama_lengkap as nama_dokter
      FROM resep_obat pf
      INNER JOIN dokter d ON pf.dokter_id = d.dokter_id
      WHERE pf.pasien_id = $1
      ORDER BY pf.tanggal_resep DESC`,
      [pasien_id]
    );

    res.json({
      success: true,
      message: 'Pharmacy requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new pharmacy request (prescription)
 */
exports.createPharmacyRequest = async (req, res, next) => {
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
      catatan,
      medications
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

    // Validate medications array
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'At least one medication is required'
      });
    }

    // Generate prescription number
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM resep_obat 
       WHERE no_resep LIKE $1`,
      [`RO-${yearMonth}%`]
    );
    const sequence = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
    const no_resep = `RO-${yearMonth}${sequence}`;

    // Calculate total price
    let total_harga = 0;
    for (const med of medications) {
      const subtotal = parseFloat(med.harga_satuan) * parseInt(med.jumlah);
      total_harga += subtotal;
    }

    // Create prescription
    const prescriptionResult = await client.query(
      `INSERT INTO resep_obat (
        pasien_id, dokter_id, rekam_medis_id, no_resep,
        tanggal_resep, catatan, total_harga, status_resep
      ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, 'Belum Diproses')
      RETURNING resep_obat_id, no_resep, tanggal_resep, total_harga, status_resep`,
      [pasien_id, dokter_id, rekam_medis_id, no_resep, catatan, total_harga]
    );

    const resep_obat_id = prescriptionResult.rows[0].resep_obat_id;

    // Insert medication details
    const medicationPromises = medications.map(med => {
      const subtotal = parseFloat(med.harga_satuan) * parseInt(med.jumlah);
      return client.query(
        `INSERT INTO detail_resep_obat (
          resep_obat_id, nama_obat, dosis, jumlah, satuan,
          aturan_pakai, harga_satuan, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          resep_obat_id, med.nama_obat, med.dosis, med.jumlah,
          med.satuan, med.aturan_pakai, med.harga_satuan, subtotal
        ]
      );
    });

    await Promise.all(medicationPromises);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Pharmacy request created successfully',
      data: {
        ...prescriptionResult.rows[0],
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
 * Update pharmacy request status
 */
exports.updatePharmacyStatus = async (req, res, next) => {
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
    const { status_resep } = req.body;
    const apoteker_id = req.user.user_id; // From auth middleware

    const result = await pool.query(
      `UPDATE resep_obat 
      SET status_resep = $1, 
          apoteker_id = $2,
          updated_at = NOW()
      WHERE resep_obat_id = $3
      RETURNING 
        resep_obat_id, no_resep, status_resep, updated_at`,
      [status_resep, apoteker_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy request not found'
      });
    }

    res.json({
      success: true,
      message: 'Pharmacy status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process and dispense prescription
 */
exports.dispensePrescription = async (req, res, next) => {
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

    const { id } = req.params;
    const apoteker_id = req.user.user_id;

    // Check if prescription exists and is ready to dispense
    const checkPrescription = await client.query(
      `SELECT status_resep, total_harga FROM resep_obat 
       WHERE resep_obat_id = $1`,
      [id]
    );

    if (checkPrescription.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Pharmacy request not found'
      });
    }

    if (checkPrescription.rows[0].status_resep === 'Belum Diproses') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Prescription must be in progress before dispensing'
      });
    }

    if (checkPrescription.rows[0].status_resep === 'Selesai') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Prescription already dispensed'
      });
    }

    // Update prescription status to completed
    const result = await client.query(
      `UPDATE resep_obat 
      SET status_resep = 'Selesai',
          tanggal_diserahkan = NOW(),
          apoteker_id = $1,
          updated_at = NOW()
      WHERE resep_obat_id = $2
      RETURNING 
        resep_obat_id, no_resep, status_resep, 
        tanggal_diserahkan, total_harga`,
      [apoteker_id, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
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
 * Cancel pharmacy request
 */
exports.cancelPharmacyRequest = async (req, res, next) => {
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
      `UPDATE resep_obat 
      SET status_resep = 'Dibatalkan', updated_at = NOW()
      WHERE resep_obat_id = $1 
        AND status_resep IN ('Belum Diproses', 'Sedang Diproses')
      RETURNING 
        resep_obat_id, no_resep, status_resep`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy request not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Pharmacy request cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pharmacy statistics
 */
exports.getPharmacyStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_prescriptions,
        COUNT(*) FILTER (WHERE DATE(tanggal_resep) = $1) as today_prescriptions,
        COUNT(*) FILTER (WHERE status_resep = 'Belum Diproses') as pending,
        COUNT(*) FILTER (WHERE status_resep = 'Sedang Diproses') as in_progress,
        COUNT(*) FILTER (WHERE status_resep = 'Selesai') as completed,
        COUNT(*) FILTER (WHERE status_resep = 'Dibatalkan') as cancelled,
        COUNT(*) FILTER (WHERE DATE(tanggal_diserahkan) = $1) as today_dispensed,
        COALESCE(SUM(total_harga) FILTER (WHERE status_resep = 'Selesai' AND DATE(tanggal_diserahkan) = $1), 0) as today_revenue,
        COALESCE(SUM(total_harga) FILTER (WHERE status_resep = 'Selesai' AND DATE(tanggal_diserahkan) >= CURRENT_DATE - INTERVAL '30 days'), 0) as month_revenue
      FROM resep_obat
      WHERE DATE(tanggal_resep) >= CURRENT_DATE - INTERVAL '30 days'
    `, [today]);

    // Get top medications
    const topMedications = await pool.query(`
      SELECT 
        dro.nama_obat,
        COUNT(*) as prescription_count,
        SUM(dro.jumlah) as total_quantity
      FROM detail_resep_obat dro
      INNER JOIN resep_obat ro ON dro.resep_obat_id = ro.resep_obat_id
      WHERE DATE(ro.tanggal_resep) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dro.nama_obat
      ORDER BY prescription_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      message: 'Pharmacy statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        top_medications: topMedications.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending pharmacy requests (for pharmacy staff)
 */
exports.getPendingRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        pf.resep_obat_id, pf.no_resep, pf.tanggal_resep,
        pf.status_resep, pf.total_harga,
        p.no_rm, p.nama_lengkap as nama_pasien, p.jenis_kelamin,
        d.nama_lengkap as nama_dokter
      FROM resep_obat pf
      INNER JOIN pasien p ON pf.pasien_id = p.pasien_id
      INNER JOIN dokter d ON pf.dokter_id = d.dokter_id
      WHERE pf.status_resep IN ('Belum Diproses', 'Sedang Diproses')
      ORDER BY pf.tanggal_resep ASC, pf.created_at ASC`
    );

    res.json({
      success: true,
      message: 'Pending pharmacy requests retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update medication in prescription (before dispensing)
 */
exports.updateMedication = async (req, res, next) => {
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

    const { id, detail_id } = req.params;
    const { jumlah, harga_satuan } = req.body;

    // Check if prescription is still editable
    const checkPrescription = await client.query(
      `SELECT status_resep FROM resep_obat WHERE resep_obat_id = $1`,
      [id]
    );

    if (checkPrescription.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (checkPrescription.rows[0].status_resep !== 'Sedang Diproses') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Can only update medications in prescriptions that are in progress'
      });
    }

    // Update medication detail
    const subtotal = parseFloat(harga_satuan) * parseInt(jumlah);
    await client.query(
      `UPDATE detail_resep_obat
      SET jumlah = $1,
          harga_satuan = $2,
          subtotal = $3,
          updated_at = NOW()
      WHERE detail_resep_id = $4 AND resep_obat_id = $5`,
      [jumlah, harga_satuan, subtotal, detail_id, id]
    );

    // Recalculate total price
    const totalResult = await client.query(
      `SELECT SUM(subtotal) as total FROM detail_resep_obat WHERE resep_obat_id = $1`,
      [id]
    );

    await client.query(
      `UPDATE resep_obat SET total_harga = $1, updated_at = NOW() WHERE resep_obat_id = $2`,
      [totalResult.rows[0].total, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: {
        resep_obat_id: id,
        total_harga: totalResult.rows[0].total
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
