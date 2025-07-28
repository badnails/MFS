// src/controllers/merchantController.js
import pool from '../db.js';

export const getMerchantDashboard = async (req, res) => {
  const merchantId = req.user?.accountid;
  
  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify merchant account
    const merchantResult = await pool.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2',
      [merchantId, 'MERCHANT']
    );

    if (merchantResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Merchant account required.' });
    }

    const merchant = merchantResult.rows[0];

    // Get total revenue from completed transactions
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN t.transactionstatus = 'COMPLETED' THEN t.subamount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN t.transactionstatus = 'COMPLETED' AND DATE_TRUNC('month', t.completiontimestamp) = DATE_TRUNC('month', CURRENT_DATE) THEN t.subamount END), 0) as monthly_revenue
      FROM transactions t
      WHERE t.destinationaccountid = $1 AND t.transactiontype = 'PAYMENT'
    `, [merchantId]);

    const revenue = revenueResult.rows[0];

    // Get recent bills (transactions with merchant bill type)
    const recentBillsResult = await pool.query(`
      SELECT 
        t.*,
        src.username as customer_name
      FROM transactions t
      LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
      WHERE t.destinationaccountid = $1 AND t.transactiontype = 'PAYMENT'
      ORDER BY t.initiationtimestamp DESC
      LIMIT 10
    `, [merchantId]);

    const recentBills = recentBillsResult.rows.map(bill => ({
      transactionId: bill.transactionid,
      customerAccount: bill.sourceaccountid,
      customerName: bill.customer_name,
      amount: parseFloat(bill.subamount),
      status: bill.transactionstatus,
      createdAt: bill.initiationtimestamp,
      reference: bill.reference
    }));

    res.json({
      totalRevenue: parseFloat(revenue.total_revenue),
      monthlyRevenue: parseFloat(revenue.monthly_revenue),
      recentBills
    });

  } catch (err) {
    console.error('Merchant dashboard error:', err);
    res.status(500).json({ error: 'Failed to load merchant dashboard' });
  }
};

export const getTodayStats = async (req, res) => {
  const merchantId = req.user?.accountid;
  
  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get today's statistics for merchant bills
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_bills,
        COUNT(CASE WHEN t.transactionstatus = 'COMPLETED' THEN 1 END) as paid_bills,
        COALESCE(SUM(CASE WHEN t.transactionstatus = 'COMPLETED' THEN t.subamount END), 0) as total_revenue
      FROM transactions t
      WHERE t.destinationaccountid = $1 
        AND t.transactiontype = 'PAYMENT'
        AND DATE(t.initiationtimestamp) = CURRENT_DATE
    `, [merchantId]);

    const stats = statsResult.rows[0];

    res.json({
      totalBills: parseInt(stats.total_bills),
      paidBills: parseInt(stats.paid_bills),
      totalRevenue: parseFloat(stats.total_revenue)
    });

  } catch (err) {
    console.error('Merchant stats error:', err);
    res.status(500).json({ error: 'Failed to load merchant statistics' });
  }
};

export const createBill = async (req, res) => {
  const merchantId = req.user?.accountid;
  const { customerAccount, amount, description, dueDate, externalTransactionId } = req.body;

  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify merchant account
    const merchantResult = await pool.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [merchantId]
    );

    if (merchantResult.rows.length === 0 || merchantResult.rows[0].accounttype !== 'MERCHANT') {
      return res.status(403).json({ error: 'Access denied. Merchant account required.' });
    }

    // Verify customer account exists
    const customerResult = await pool.query(
      'SELECT accountid, username FROM accounts WHERE accountid = $1',
      [customerAccount]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    // Create pending transaction record with merchant bill type (4444)
    // Store external transaction ID and description in reference field
    const referenceData = {
      externalTxId: externalTransactionId,
      description: description,
      dueDate: dueDate,
      type: 'MERCHANT_BILL'
    };

    const transactionResult = await pool.query(`
      INSERT INTO transactions (
        transactiontype, transactionstatus,
        sourceaccountid, destinationaccountid,
        subamount, feesamount, subamount,
        initiationtimestamp, reference
      ) VALUES (
        'PAYMENT', 'PENDING',
        $1, $2,
        $3, 0, $3,
        NOW(), $4
      ) RETURNING transactionid
    `, [customerAccount, merchantId, amount, JSON.stringify(referenceData)]);

    const transactionId = transactionResult.rows[0].transactionid;

    res.json({
      message: 'Bill created successfully',
      transactionId,
      externalTransactionId
    });

  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ error: 'Failed to create bill' });
  }
};
