// src/controllers/agentController.js
import pool from '../db.js';

export const getAgentDashboard = async (req, res) => {
  const agentId = req.user?.accountid;
  
  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get agent account info
    const agentResult = await pool.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2',
      [agentId, 'AGENT']
    );

    if (agentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. Agent account required.' });
    }

    const agent = agentResult.rows[0];

    // Get recent transactions (last 10)
    // const recentTransactionsResult = await pool.query(`
    //   SELECT 
    //     t.*
    //     CASE 
    //       WHEN t.sourceaccountid = $1 THEN 'CASH_OUT'
    //       WHEN t.destinationaccountid = $1 THEN 'CASH_IN'
    //     END as type,
    //     CASE 
    //       WHEN t.sourceaccountid = $1 THEN dest.username
    //       WHEN t.destinationaccountid = $1 THEN src.username
    //     END as customerName,
    //     CASE 
    //       WHEN t.sourceaccountid = $1 THEN t.destinationaccountid
    //       WHEN t.destinationaccountid = $1 THEN t.sourceaccountid
    //     END as customerAccount
    //   FROM transactions t
    //   LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
    //   LEFT JOIN accounts dest ON t.destinationaccountid = dest.accountid
    //   WHERE (t.sourceaccountid = $1 OR t.destinationaccountid = $1)
    //     AND t.transactionstatus = 'COMPLETED'
    //   ORDER BY t.initiationtimestamp DESC
    //   LIMIT 10
    // `, [agentId]);

    // const recentTransactions = recentTransactionsResult.rows.map(tx => ({
    //   ...tx,
    //   amount: parseFloat(tx.totalamount),
    //   commission: parseFloat(tx.feesamount || 0),
    //   timestamp: tx.initiationtimestamp
    // }));

    res.json({
      balance: parseFloat(agent.availablebalance)
    });

  } catch (err) {
    console.error('Agent dashboard error:', err);
    res.status(500).json({ error: 'Failed to load agent dashboard' });
  }
};

export const getTodayStats = async (req, res) => {
  const agentId = req.user?.accountid;
  
  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get today's statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN t.destinationaccountid = $1 THEN 1 END) as cash_in_count,
        COUNT(CASE WHEN t.sourceaccountid = $1 THEN 1 END) as cash_out_count,
        COALESCE(SUM(CASE WHEN t.destinationaccountid = $1 THEN t.subamount END), 0) as total_cash_in,
        COALESCE(SUM(CASE WHEN t.sourceaccountid = $1 THEN t.subamount END), 0) as total_cash_out,
        COALESCE(SUM(t.feesamount), 0) as total_commission
      FROM transactions t
      WHERE (t.sourceaccountid = $1 OR t.destinationaccountid = $1)
        AND t.transactionstatus = 'COMPLETED'
        AND DATE(t.initiationtimestamp) = CURRENT_DATE
    `, [agentId]);

    const stats = statsResult.rows[0];

    res.json({
      cashInCount: parseInt(stats.cash_in_count),
      cashOutCount: parseInt(stats.cash_out_count),
      totalCashIn: parseFloat(stats.total_cash_in),
      totalCashOut: parseFloat(stats.total_cash_out),
      commission: parseFloat(stats.total_commission)
    });

  } catch (err) {
    console.error('Agent stats error:', err);
    res.status(500).json({ error: 'Failed to load agent statistics' });
  }
};

export const verifyCustomer = async (req, res) => {
  const agentId = req.user?.accountId;
  const customerAccountId = req.params.accountId;

  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify agent account
    const agentResult = await pool.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [agentId]
    );

    if (agentResult.rows.length === 0 || agentResult.rows[0].accounttype !== 'AGENT') {
      return res.status(403).json({ error: 'Access denied. Agent account required.' });
    }

    // Get customer account info
    const customerResult = await pool.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2',
      [customerAccountId, 'PERSONAL']
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const customer = customerResult.rows[0];

    res.json({
      customer: {
        accountid: customer.accountid,
        accountname: customer.accountname,
        currentbalance: parseFloat(customer.currentbalance),
        availablebalance: parseFloat(customer.availablebalance),
        accountstatus: customer.accountstatus
      }
    });

  } catch (err) {
    console.error('Customer verification error:', err);
    res.status(500).json({ error: 'Failed to verify customer' });
  }
};

export const processCashIn = async (req, res) => {
  const agentId = req.user?.accountId;
  const { customerAccount, amount, customerPhone } = req.body;
  const cashInAmount = parseFloat(amount);

  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isNaN(cashInAmount) || cashInAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Verify agent account
    const agentResult = await client.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2 FOR UPDATE',
      [agentId, 'AGENT']
    );

    if (agentResult.rows.length === 0) {
      throw new Error('Agent account not found');
    }

    const agent = agentResult.rows[0];

    // Check if agent has sufficient balance
    if (parseFloat(agent.availablebalance) < cashInAmount) {
      throw new Error('Insufficient agent balance');
    }

    // Verify customer account
    const customerResult = await client.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2 FOR UPDATE',
      [customerAccount, 'PERSONAL']
    );

    if (customerResult.rows.length === 0) {
      throw new Error('Customer account not found');
    }

    // Calculate commission (e.g., 1% of transaction amount)
    const commissionRate = 0.01; // 1%
    const commission = cashInAmount * commissionRate;

    // Debit from agent account
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance - $1,
        currentbalance = currentbalance - $1
      WHERE accountid = $2
    `, [cashInAmount, agentId]);

    // Credit to customer account
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance + $1,
        currentbalance = currentbalance + $1
      WHERE accountid = $2
    `, [cashInAmount, customerAccount]);

    // Record transaction
    const transactionResult = await client.query(`
      INSERT INTO transaction (
        transactiontypeid, transactionstatus,
        sourceaccountid, destinationaccountid,
        subamount, feesamount, totalamount,
        initiationtimestamp, completiontimestamp, reference
      ) VALUES (
        2222, 'COMPLETED',
        $1, $2,
        $3, $4, $3,
        NOW(), NOW(), $5
      ) RETURNING *
    `, [agentId, customerAccount, cashInAmount, commission, `CASHIN-${Date.now()}`]);

    // Credit commission back to agent
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance + $1,
        currentbalance = currentbalance + $1
      WHERE accountid = $2
    `, [commission, agentId]);

    await client.query('COMMIT');

    res.json({ 
      message: 'Cash in successful', 
      transaction: transactionResult.rows[0],
      commission: commission
    });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Cash in error:', err.message);
    res.status(500).json({ error: 'Cash in failed: ' + err.message });
  } finally {
    if (client) client.release();
  }
};

export const processCashOut = async (req, res) => {
  const agentId = req.user?.accountId;
  const { customerAccount, amount, customerPhone } = req.body;
  const cashOutAmount = parseFloat(amount);

  if (!agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isNaN(cashOutAmount) || cashOutAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Verify agent account
    const agentResult = await client.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2 FOR UPDATE',
      [agentId, 'AGENT']
    );

    if (agentResult.rows.length === 0) {
      throw new Error('Agent account not found');
    }

    // Verify customer account and check balance
    const customerResult = await client.query(
      'SELECT * FROM accounts WHERE accountid = $1 AND accounttype = $2 FOR UPDATE',
      [customerAccount, 'PERSONAL']
    );

    if (customerResult.rows.length === 0) {
      throw new Error('Customer account not found');
    }

    const customer = customerResult.rows[0];

    if (parseFloat(customer.availablebalance) < cashOutAmount) {
      throw new Error('Insufficient customer balance');
    }

    // Calculate commission
    const commissionRate = 0.01; // 1%
    const commission = cashOutAmount * commissionRate;

    // Debit from customer account
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance - $1,
        currentbalance = currentbalance - $1
      WHERE accountid = $2
    `, [cashOutAmount, customerAccount]);

    // Credit to agent account
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance + $1,
        currentbalance = currentbalance + $1
      WHERE accountid = $2
    `, [cashOutAmount, agentId]);

    // Record transaction
    const transactionResult = await client.query(`
      INSERT INTO transaction (
        transactiontypeid, transactionstatus,
        sourceaccountid, destinationaccountid,
        subamount, feesamount, totalamount,
        initiationtimestamp, completiontimestamp, reference
      ) VALUES (
        3333, 'COMPLETED',
        $1, $2,
        $3, $4, $3,
        NOW(), NOW(), $5
      ) RETURNING *
    `, [customerAccount, agentId, cashOutAmount, commission, `CASHOUT-${Date.now()}`]);

    // Credit commission to agent
    await client.query(`
      UPDATE accounts SET
        availablebalance = availablebalance + $1,
        currentbalance = currentbalance + $1
      WHERE accountid = $2
    `, [commission, agentId]);

    await client.query('COMMIT');

    res.json({ 
      message: 'Cash out successful', 
      transaction: transactionResult.rows[0],
      commission: commission
    });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Cash out error:', err.message);
    res.status(500).json({ error: 'Cash out failed: ' + err.message });
  } finally {
    if (client) client.release();
  }
};

export const getAgentTransactions = async (req, res) => {
  const agentId = req.user?.accountId;
  const { filter = 'all', dateRange = 'today' } = req.query;

  if (!agentId) {
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

    let filterCondition = '';
    if (filter === 'cash-in') {
      filterCondition = "AND t.destinationaccountid = $1";
    } else if (filter === 'cash-out') {
      filterCondition = "AND t.sourceaccountid = $1";
    } else {
      filterCondition = "AND (t.sourceaccountid = $1 OR t.destinationaccountid = $1)";
    }

    const transactionsResult = await pool.query(`
      SELECT 
        t.*,
        tt.transactiontypename,
        CASE 
          WHEN t.sourceaccountid = $1 THEN 'CASH_OUT'
          WHEN t.destinationaccountid = $1 THEN 'CASH_IN'
        END as type,
        CASE 
          WHEN t.sourceaccountid = $1 THEN dest.accountname
          WHEN t.destinationaccountid = $1 THEN src.accountname
        END as customerName,
        CASE 
          WHEN t.sourceaccountid = $1 THEN t.destinationaccountid
          WHEN t.destinationaccountid = $1 THEN t.sourceaccountid
        END as customerAccount
      FROM transaction t
      JOIN transactiontype tt ON t.transactiontypeid = tt.transactiontypeid
      LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
      LEFT JOIN accounts dest ON t.destinationaccountid = dest.accountid
      WHERE 1=1 ${filterCondition} ${dateCondition}
      ORDER BY t.initiationtimestamp DESC
      LIMIT 100
    `, [agentId]);

    const transactions = transactionsResult.rows.map(tx => ({
      ...tx,
      amount: parseFloat(tx.totalamount),
      commission: parseFloat(tx.feesamount || 0),
      timestamp: tx.initiationtimestamp,
      status: tx.transactionstatus
    }));

    res.json({ transactions });

  } catch (err) {
    console.error('Agent transactions error:', err);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
};
