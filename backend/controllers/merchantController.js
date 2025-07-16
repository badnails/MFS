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
        COUNT(CASE WHEN t.transactionstatus = 'PENDING' THEN 1 END) as pending_bills,
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
      pendingBills: parseInt(stats.pending_bills),
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

export const getPendingBills = async (req, res) => {
  const merchantId = req.user?.accountid;

  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const billsResult = await pool.query(`
      SELECT 
        t.*,
        src.username as customer_name
      FROM transactions t
      LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
      WHERE t.destinationaccountid = $1
        AND t.transactiontype = 'PAYMENT'
        AND t.transactionstatus = 'PENDING'
      ORDER BY t.initiationtimestamp DESC
    `, [merchantId]);

    const bills = billsResult.rows.map(bill => {
      let referenceData = {};
      try {
        referenceData = JSON.parse(bill.reference);
      } catch (e) {
        // If reference is not JSON, treat as simple string
        referenceData = { description: bill.reference };
      }

      return {
        id: bill.transactionid,
        customerAccount: bill.sourceaccountid,
        customerName: bill.customer_name,
        amount: parseFloat(bill.subamount),
        description: referenceData.description || '',
        dueDate: referenceData.dueDate || null,
        externalTransactionId: referenceData.externalTxId || '',
        createdAt: bill.initiationtimestamp,
        status: bill.transactionstatus
      };
    });

    res.json({ bills });

  } catch (err) {
    console.error('Get pending bills error:', err);
    res.status(500).json({ error: 'Failed to load pending bills' });
  }
};

export const updateBillStatus = async (req, res) => {
  const merchantId = req.user?.accountId;
  const { billId } = req.params;
  const { status, completedOn } = req.body;

  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get transaction details
    const transactionResult = await client.query(
      `SELECT * FROM transactions WHERE transactionid = $1 AND destinationaccountid = $2 AND transactiontype = 'PAYMENT'`,
      [billId, merchantId]
    );

    if (transactionResult.rows.length === 0) {
      throw new Error('Transaction not found or access denied');
    }

    const transaction = transactionResult.rows[0];

    if (status === 'COMPLETED') {
      // Verify customer has sufficient balance
      const customerResult = await client.query(
        'SELECT availablebalance FROM accounts WHERE accountid = $1 FOR UPDATE',
        [transaction.sourceaccountid]
      );

      if (customerResult.rows.length === 0) {
        throw new Error('Customer account not found');
      }

      const customerBalance = parseFloat(customerResult.rows[0].availablebalance);
      if (customerBalance < parseFloat(transaction.subamount)) {
        throw new Error('Customer has insufficient balance');
      }

      // Process the payment
      await client.query(`
        UPDATE accounts SET
          currentbalance = currentbalance - $1
        WHERE accountid = $2
      `, [transaction.subamount, transaction.sourceaccountid]);

      await client.query(`
        UPDATE accounts SET
          currentbalance = currentbalance + $1
        WHERE accountid = $2
      `, [transaction.subamount, merchantId]);

      // Update transaction to completed
      await client.query(`
        UPDATE transactions SET
          transactionstatus = 'COMPLETED',
          completiontimestamp = NOW()
        WHERE transactionid = $1
      `, [billId]);
    } else {
      // Update transaction status only
      await client.query(`
        UPDATE transactions SET
          transactionstatus = $1
        WHERE transactionid = $2
      `, [status, billId]);
    }

    await client.query('COMMIT');

    res.json({ message: 'Bill status updated successfully' });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Update bill status error:', err);
    res.status(500).json({ error: 'Failed to update bill status: ' + err.message });
  } finally {
    if (client) client.release();
  }
};

export const getMerchantTransactions = async (req, res) => {
  const merchantId = req.user?.accountid;
  const { filter = 'all', dateRange = 'today' } = req.query;

  if (!merchantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let dateCondition = '';
    switch (dateRange) {
      case 'today':
        dateCondition = "AND DATE(t.initiationtimestamp) = CURRENT_DATE";
        break;
      case 'week':
        dateCondition = "AND t.initiationtimestamp >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateCondition = "AND t.initiationtimestamp >= CURRENT_DATE - INTERVAL '30 days'";
        break;
    }

    let statusCondition = '';
    if (filter === 'completed') {
      statusCondition = "AND t.transactionstatus = 'COMPLETED'";
    } else if (filter === 'pending') {
      statusCondition = "AND t.transactionstatus = 'PENDING'";
    }

    const transactionsResult = await pool.query(`
      SELECT 
        t.*,
        src.username as customer_name
      FROM transactions t
      LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
      WHERE t.destinationaccountid = $1 
        AND t.transactiontype = 'PAYMENT'
        ${dateCondition} ${statusCondition}
      ORDER BY t.initiationtimestamp DESC
      LIMIT 100
    `, [merchantId]);

    const transactions = transactionsResult.rows.map(tx => {
      let referenceData = {};
      try {
        referenceData = JSON.parse(tx.reference);
      } catch (e) {
        referenceData = { description: tx.reference };
      }

      return {
        ...tx,
        amount: parseFloat(tx.subamount),
        timestamp: tx.initiationtimestamp,
        status: tx.transactionstatus,
        customerName: tx.customer_name,
        description: referenceData.description || '',
        externalTransactionId: referenceData.externalTxId || ''
      };
    });

    res.json({ transactions });

  } catch (err) {
    console.error('Merchant transactions error:', err);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
};
