const pool = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Get all billing transactions with pagination
 */
exports.getAllBillings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const tanggal = req.query.tanggal || '';

    let query = `
      SELECT 
        tb.tagihan_id, tb.no_tagihan, tb.tanggal_tagihan,
        tb.total_biaya, tb.diskon, tb.pajak, tb.total_bayar,
        tb.status_pembayaran, tb.metode_pembayaran,
        tb.tanggal_pembayaran, tb.created_at,
        p.pasien_id, p.no_rm, p.nama_lengkap as nama_pasien,
        p.jenis_kelamin,
        prj.no_antrian, prj.jenis_pembayaran,
        u.full_name as kasir
      FROM tagihan_pasien tb
      INNER JOIN pasien p ON tb.pasien_id = p.pasien_id
      LEFT JOIN pendaftaran_rawat_jalan prj ON tb.pendaftaran_id = prj.pendaftaran_id
      LEFT JOIN users u ON tb.kasir_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        p.nama_lengkap ILIKE $${paramCount} OR 
        p.no_rm ILIKE $${paramCount} OR
        tb.no_tagihan ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND tb.status_pembayaran = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (tanggal) {
      query += ` AND DATE(tb.tanggal_tagihan) = $${paramCount}`;
      params.push(tanggal);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM tagihan_pasien tb
      INNER JOIN pasien p ON tb.pasien_id = p.pasien_id
      WHERE 1=1
      ${search ? `AND (p.nama_lengkap ILIKE $1 OR p.no_rm ILIKE $1 OR tb.no_tagihan ILIKE $1)` : ''}
      ${status ? `AND tb.status_pembayaran = $${search ? 2 : 1}` : ''}
      ${tanggal ? `AND DATE(tb.tanggal_tagihan) = $${search && status ? 3 : search || status ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (status) countParams.push(status);
    if (tanggal) countParams.push(tanggal);
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY tb.tanggal_tagihan DESC, tb.created_at DESC 
              LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Billings retrieved successfully',
      data: {
        billings: result.rows,
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
 * Get billing by ID with details
 */
exports.getBillingById = async (req, res, next) => {
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

    // Get main billing data
    const billingResult = await pool.query(
      `SELECT 
        tb.*,
        p.no_rm, p.nama_lengkap as nama_pasien, p.tanggal_lahir,
        p.jenis_kelamin, p.alamat, p.telepon,
        prj.no_antrian, prj.jenis_pembayaran, prj.tanggal_kunjungan,
        d.nama_lengkap as nama_dokter,
        u.full_name as kasir
      FROM tagihan_pasien tb
      INNER JOIN pasien p ON tb.pasien_id = p.pasien_id
      LEFT JOIN pendaftaran_rawat_jalan prj ON tb.pendaftaran_id = prj.pendaftaran_id
      LEFT JOIN dokter d ON prj.dokter_id = d.dokter_id
      LEFT JOIN users u ON tb.kasir_id = u.user_id
      WHERE tb.tagihan_id = $1`,
      [id]
    );

    if (billingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    // Get billing details (items)
    const detailsResult = await pool.query(
      `SELECT 
        detail_tagihan_id, jenis_item, nama_item, 
        jumlah, harga_satuan, subtotal, keterangan
      FROM detail_tagihan_pasien
      WHERE tagihan_id = $1
      ORDER BY detail_tagihan_id`,
      [id]
    );

    const data = {
      ...billingResult.rows[0],
      items: detailsResult.rows
    };

    res.json({
      success: true,
      message: 'Billing retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billings by patient
 */
exports.getBillingsByPatient = async (req, res, next) => {
  try {
    const { pasien_id } = req.params;

    const result = await pool.query(
      `SELECT 
        tb.tagihan_id, tb.no_tagihan, tb.tanggal_tagihan,
        tb.total_bayar, tb.status_pembayaran, tb.tanggal_pembayaran,
        prj.no_antrian, prj.jenis_pembayaran
      FROM tagihan_pasien tb
      LEFT JOIN pendaftaran_rawat_jalan prj ON tb.pendaftaran_id = prj.pendaftaran_id
      WHERE tb.pasien_id = $1
      ORDER BY tb.tanggal_tagihan DESC`,
      [pasien_id]
    );

    res.json({
      success: true,
      message: 'Billings retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new billing
 */
exports.createBilling = async (req, res, next) => {
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
      pendaftaran_id,
      items,
      diskon,
      pajak,
      keterangan
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

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'At least one billing item is required'
      });
    }

    // Generate billing number
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM tagihan_pasien 
       WHERE no_tagihan LIKE $1`,
      [`INV-${yearMonth}%`]
    );
    const sequence = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
    const no_tagihan = `INV-${yearMonth}${sequence}`;

    // Calculate total
    let total_biaya = 0;
    for (const item of items) {
      const subtotal = parseFloat(item.harga_satuan) * parseInt(item.jumlah);
      total_biaya += subtotal;
    }

    const diskon_amount = parseFloat(diskon || 0);
    const pajak_amount = parseFloat(pajak || 0);
    const total_bayar = total_biaya - diskon_amount + pajak_amount;

    // Create billing
    const billingResult = await client.query(
      `INSERT INTO tagihan_pasien (
        pasien_id, pendaftaran_id, no_tagihan, tanggal_tagihan,
        total_biaya, diskon, pajak, total_bayar, 
        status_pembayaran, keterangan
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'Belum Dibayar', $8)
      RETURNING tagihan_id, no_tagihan, tanggal_tagihan, total_bayar, status_pembayaran`,
      [
        pasien_id, pendaftaran_id, no_tagihan, total_biaya,
        diskon_amount, pajak_amount, total_bayar, keterangan
      ]
    );

    const tagihan_id = billingResult.rows[0].tagihan_id;

    // Insert billing items
    const itemPromises = items.map(item => {
      const subtotal = parseFloat(item.harga_satuan) * parseInt(item.jumlah);
      return client.query(
        `INSERT INTO detail_tagihan_pasien (
          tagihan_id, jenis_item, nama_item, jumlah,
          harga_satuan, subtotal, keterangan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tagihan_id, item.jenis_item, item.nama_item, item.jumlah,
          item.harga_satuan, subtotal, item.keterangan
        ]
      );
    });

    await Promise.all(itemPromises);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Billing created successfully',
      data: {
        ...billingResult.rows[0],
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
 * Process payment
 */
exports.processPayment = async (req, res, next) => {
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
    const { metode_pembayaran, jumlah_bayar, keterangan_pembayaran } = req.body;
    const kasir_id = req.user.user_id;

    // Check if billing exists and is unpaid
    const checkBilling = await pool.query(
      `SELECT status_pembayaran, total_bayar FROM tagihan_pasien 
       WHERE tagihan_id = $1`,
      [id]
    );

    if (checkBilling.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found'
      });
    }

    if (checkBilling.rows[0].status_pembayaran === 'Lunas') {
      return res.status(400).json({
        success: false,
        message: 'Billing already paid'
      });
    }

    const total_bayar = parseFloat(checkBilling.rows[0].total_bayar);
    const jumlah_dibayar = parseFloat(jumlah_bayar);

    if (jumlah_dibayar < total_bayar) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount is less than total bill'
      });
    }

    const kembalian = jumlah_dibayar - total_bayar;

    // Process payment
    const result = await pool.query(
      `UPDATE tagihan_pasien 
      SET status_pembayaran = 'Lunas',
          metode_pembayaran = $1,
          jumlah_bayar = $2,
          kembalian = $3,
          tanggal_pembayaran = NOW(),
          keterangan_pembayaran = $4,
          kasir_id = $5,
          updated_at = NOW()
      WHERE tagihan_id = $6
      RETURNING 
        tagihan_id, no_tagihan, status_pembayaran, 
        metode_pembayaran, total_bayar, jumlah_bayar, 
        kembalian, tanggal_pembayaran`,
      [metode_pembayaran, jumlah_dibayar, kembalian, keterangan_pembayaran, kasir_id, id]
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel billing
 */
exports.cancelBilling = async (req, res, next) => {
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
      `UPDATE tagihan_pasien 
      SET status_pembayaran = 'Dibatalkan', updated_at = NOW()
      WHERE tagihan_id = $1 AND status_pembayaran = 'Belum Dibayar'
      RETURNING 
        tagihan_id, no_tagihan, status_pembayaran`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Billing not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Billing cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get finance statistics
 */
exports.getFinanceStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_billings,
        COUNT(*) FILTER (WHERE DATE(tanggal_tagihan) = $1) as today_billings,
        COUNT(*) FILTER (WHERE status_pembayaran = 'Belum Dibayar') as unpaid,
        COUNT(*) FILTER (WHERE status_pembayaran = 'Lunas') as paid,
        COUNT(*) FILTER (WHERE status_pembayaran = 'Dibatalkan') as cancelled,
        COALESCE(SUM(total_bayar) FILTER (WHERE status_pembayaran = 'Lunas' AND DATE(tanggal_pembayaran) = $1), 0) as today_revenue,
        COALESCE(SUM(total_bayar) FILTER (WHERE status_pembayaran = 'Lunas' AND DATE(tanggal_pembayaran) >= DATE_TRUNC('month', CURRENT_DATE)), 0) as month_revenue,
        COALESCE(SUM(total_bayar) FILTER (WHERE status_pembayaran = 'Belum Dibayar'), 0) as outstanding_amount
      FROM tagihan_pasien
      WHERE DATE(tanggal_tagihan) >= CURRENT_DATE - INTERVAL '30 days'
    `, [today]);

    // Get revenue by payment method
    const byPaymentMethod = await pool.query(`
      SELECT 
        metode_pembayaran,
        COUNT(*) as count,
        SUM(total_bayar) as total
      FROM tagihan_pasien
      WHERE status_pembayaran = 'Lunas'
        AND DATE(tanggal_pembayaran) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY metode_pembayaran
      ORDER BY total DESC
    `);

    // Get revenue by item type
    const byItemType = await pool.query(`
      SELECT 
        dt.jenis_item,
        COUNT(*) as count,
        SUM(dt.subtotal) as total
      FROM detail_tagihan_pasien dt
      INNER JOIN tagihan_pasien t ON dt.tagihan_id = t.tagihan_id
      WHERE t.status_pembayaran = 'Lunas'
        AND DATE(t.tanggal_pembayaran) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dt.jenis_item
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      message: 'Finance statistics retrieved successfully',
      data: {
        ...stats.rows[0],
        by_payment_method: byPaymentMethod.rows,
        by_item_type: byItemType.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unpaid billings
 */
exports.getUnpaidBillings = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        tb.tagihan_id, tb.no_tagihan, tb.tanggal_tagihan,
        tb.total_bayar, tb.status_pembayaran,
        p.no_rm, p.nama_lengkap as nama_pasien, p.telepon,
        prj.jenis_pembayaran
      FROM tagihan_pasien tb
      INNER JOIN pasien p ON tb.pasien_id = p.pasien_id
      LEFT JOIN pendaftaran_rawat_jalan prj ON tb.pendaftaran_id = prj.pendaftaran_id
      WHERE tb.status_pembayaran = 'Belum Dibayar'
      ORDER BY tb.tanggal_tagihan ASC`
    );

    res.json({
      success: true,
      message: 'Unpaid billings retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily revenue report
 */
exports.getDailyRevenue = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const result = await pool.query(
      `SELECT 
        DATE(tanggal_pembayaran) as tanggal,
        COUNT(*) as jumlah_transaksi,
        SUM(total_bayar) as total_pendapatan,
        SUM(diskon) as total_diskon,
        SUM(pajak) as total_pajak
      FROM tagihan_pasien
      WHERE status_pembayaran = 'Lunas'
        AND DATE(tanggal_pembayaran) BETWEEN $1 AND $2
      GROUP BY DATE(tanggal_pembayaran)
      ORDER BY tanggal DESC`,
      [start_date, end_date]
    );

    res.json({
      success: true,
      message: 'Daily revenue report retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
