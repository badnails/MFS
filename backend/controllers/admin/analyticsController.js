import pool from '../../db.js';

// Get transaction volume data for analytics
export const getTransactionVolume = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate, period = 'day' } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        valid: false,
        message: 'Start date and end date are required'
      });
    }

    // Build the SQL query based on period
    let dateGroupBy;
    switch (period) {
      case 'hour':
        dateGroupBy = "DATE_TRUNC('hour', t.initiationtimestamp)";
        break;
      case 'day':
        dateGroupBy = "DATE_TRUNC('day', t.initiationtimestamp)";
        break;
      case 'week':
        dateGroupBy = "DATE_TRUNC('week', t.initiationtimestamp)";
        break;
      case 'month':
        dateGroupBy = "DATE_TRUNC('month', t.initiationtimestamp)";
        break;
      default:
        dateGroupBy = "DATE_TRUNC('day', t.initiationtimestamp)";
    }

    // Base query
    let query = `
      SELECT 
        ${dateGroupBy} as date,
        COUNT(*) as count,
        COALESCE(SUM(t.subamount), 0) as totalAmount,
        COALESCE(SUM(t.feesamount), 0) as feesAmount
      FROM transactions t
      WHERE t.initiationtimestamp >= $1 
        AND t.initiationtimestamp <= $2
    `;

    const params = [startDate, endDate];

    // Add account filter if specified (for personal users)
    if (accountId) {
      query += ` AND (t.sourceaccountid = $3 OR t.destinationaccountid = $3)`;
      params.push(accountId);
    }

    query += `
      GROUP BY ${dateGroupBy}
      ORDER BY date ASC
    `;

    const result = await pool.query(query, params);

    // Format the data
    const data = result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count),
      totalAmount: parseFloat(row.totalamount),
      feesAmount: parseFloat(row.feesamount)
    }));

    res.json({
      valid: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching transaction volume:', error);
    res.status(500).json({
      valid: false,
      message: 'Internal Server Error'
    });
  }
};

// Get transaction status distribution
export const getTransactionStatusDistribution = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        valid: false,
        message: 'Start date and end date are required'
      });
    }

    let query = `
      SELECT 
        t.transactionstatus as status,
        COUNT(*) as count,
        COALESCE(SUM(t.subamount), 0) as total_amount
      FROM transactions t
      WHERE t.initiationtimestamp >= $1 
        AND t.initiationtimestamp <= $2
    `;

    const params = [startDate, endDate];

    // Add account filter if specified (for personal users)
    if (accountId) {
      query += ` AND (t.sourceaccountid = $3 OR t.destinationaccountid = $3)`;
      params.push(accountId);
    }

    query += `
      GROUP BY t.transactionstatus
      ORDER BY count DESC
    `;

    const result = await pool.query(query, params);

    // Format the data
    const data = result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      total_amount: parseFloat(row.total_amount)
    }));

    res.json({
      valid: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching transaction status distribution:', error);
    res.status(500).json({
      valid: false,
      message: 'Internal Server Error'
    });
  }
};

// Get authentication attempts data (Admin only)
export const getAuthenticationData = async (req, res) => {
  try {
    const { startDate, endDate, period = 'day', authType = 'all' } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        valid: false,
        message: 'Start date and end date are required'
      });
    }

    // Build the SQL query based on period
    let dateGroupBy;
    switch (period) {
      case 'hour':
        dateGroupBy = "DATE_TRUNC('hour', ae.eventtimestamp)";
        break;
      case 'day':
        dateGroupBy = "DATE_TRUNC('day', ae.eventtimestamp)";
        break;
      case 'week':
        dateGroupBy = "DATE_TRUNC('week', ae.eventtimestamp)";
        break;
      case 'month':
        dateGroupBy = "DATE_TRUNC('month', ae.eventtimestamp)";
        break;
      default:
        dateGroupBy = "DATE_TRUNC('day', ae.eventtimestamp)";
    }

    let query = `
      SELECT 
        ${dateGroupBy} as date,
        COUNT(CASE WHEN ae.issuccessful = true THEN 1 END) as successful_attempts,
        COUNT(CASE WHEN ae.issuccessful = false THEN 1 END) as failed_attempts
      FROM authenticationevents ae
      WHERE ae.eventtimestamp >= $1 
        AND ae.eventtimestamp <= $2
    `;

    const params = [startDate, endDate];

    // Add auth type filter if specified
    if (authType !== 'all') {
      query += ` AND ae.authtype = $3`;
      params.push(authType);
    }

    query += `
      GROUP BY ${dateGroupBy}
      ORDER BY date ASC
    `;

    const result = await pool.query(query, params);

    // Format the data
    const data = result.rows.map(row => ({
      date: row.date,
      successful_attempts: parseInt(row.successful_attempts),
      failed_attempts: parseInt(row.failed_attempts)
    }));

    res.json({
      valid: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching authentication data:', error);
    res.status(500).json({
      valid: false,
      message: 'Internal Server Error'
    });
  }
};

// Get bills analytics data for billers
export const getBillsData = async (req, res) => {
  try {
    const { accountId } = req.params; // Biller account ID
    const { startDate, endDate, period = 'day' } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        valid: false,
        message: 'Start date and end date are required'
      });
    }

    // Build the SQL query based on period
    let dateGroupBy;
    switch (period) {
      case 'day':
        dateGroupBy = "DATE_TRUNC('day', b.issuedate)";
        break;
      case 'week':
        dateGroupBy = "DATE_TRUNC('week', b.issuedate)";
        break;
      case 'month':
        dateGroupBy = "DATE_TRUNC('month', b.issuedate)";
        break;
      default:
        dateGroupBy = "DATE_TRUNC('day', b.issuedate)";
    }

    const query = `
      SELECT 
        ${dateGroupBy} as date,
        COUNT(CASE 
          WHEN b.transactionid IS NOT NULL 
            AND EXISTS(
              SELECT 1 FROM transactions t 
              WHERE t.transactionid = b.transactionid 
                AND t.transactionstatus = 'COMPLETED'
            ) 
          THEN 1 
        END) as paid_bills,
        COUNT(CASE 
          WHEN b.transactionid IS NULL 
            OR NOT EXISTS(
              SELECT 1 FROM transactions t 
              WHERE t.transactionid = b.transactionid 
                AND t.transactionstatus = 'COMPLETED'
            ) 
          THEN 1 
        END) as unpaid_bills,

        COALESCE(SUM(b.amount), 0) as total_amount,
        COALESCE(SUM(CASE 
          WHEN EXISTS(
            SELECT 1 FROM transactions t 
            WHERE t.transactionid = b.transactionid 
              AND t.transactionstatus = 'COMPLETED'
          ) 
          THEN b.amount 
          ELSE 0 
        END), 0) as paid_amount
      FROM bills b
      JOIN billbatches bb ON b.batchid = bb.batchid
      WHERE bb.accountid = $1
        AND b.issuedate >= $2 
        AND b.issuedate <= $3
      GROUP BY ${dateGroupBy}
      ORDER BY date ASC
    `;

    const params = [accountId, startDate, endDate];
    const result = await pool.query(query, params);

    // Format the data
    const data = result.rows.map(row => ({
      date: row.date,
      paid_bills: parseInt(row.paid_bills),
      unpaid_bills: parseInt(row.unpaid_bills),
      total_amount: parseFloat(row.total_amount),
      paid_amount: parseFloat(row.paid_amount)
    }));

    res.json({
      valid: true,
      data: data
    });

  } catch (error) {
    console.error('Error fetching bills data:', error);
    res.status(500).json({
      valid: false,
      message: 'Internal Server Error'
    });
  }
};
