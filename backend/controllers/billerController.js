// controllers/billerController.js
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js'; // assuming you have a configured pg Pool

export const getBillerDashboard = async (req, res) => {
  const accountId = req.user.accountid;

  try {
    // 1. Total amount and monthly total
    const totalsQuery = `
      SELECT
        COALESCE(SUM(b.amount), 0) AS "totalAmount",
        COALESCE(SUM(CASE WHEN date_trunc('month', b.issuedate) = date_trunc('month', current_date)
                         THEN b.amount ELSE 0 END), 0) AS "monthlyAmount"
      FROM bills b
      JOIN billbatches bb ON b.batchid = bb.batchid
      WHERE bb.accountid = $1;
    `;

    // 2. Recent batches with bill count and total amount
    const recentBatchesQuery = `
      SELECT
        bb.batchid AS "batchId",
        bb.batchname,
        COALESCE(COUNT(b.billid), 0) AS "billCount",
        COALESCE(SUM(b.amount), 0) AS "totalAmount",
        MAX(b.issuedate) AS "createdAt"
      FROM billbatches bb
      LEFT JOIN bills b ON bb.batchid = b.batchid
      WHERE bb.accountid = $1
      GROUP BY bb.batchid
      ORDER BY MAX(b.issuedate) DESC NULLS LAST
      LIMIT 5;
    `;

    const [totalsResult, recentBatchesResult] = await Promise.all([
      pool.query(totalsQuery, [accountId]),
      pool.query(recentBatchesQuery, [accountId])
    ]);

    const billerData = {
      totalAmount: parseFloat(totalsResult.rows[0].totalAmount),
      monthlyAmount: parseFloat(totalsResult.rows[0].monthlyAmount),
      recentBatches: recentBatchesResult.rows.map(row => ({
        batchId: row.batchId,
        batchname: row.batchname,
        billCount: Number(row.billCount),
        totalAmount: parseFloat(row.totalAmount),
        createdAt: row.createdAt
      }))
    };

    res.json(billerData);
  } catch (err) {
    console.error('Error fetching biller dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch biller dashboard data' });
  }
};




export const getBillerStatsToday = async (req, res) => {
  const accountId = req.user.accountid;

  try {
    const statsQuery = `
      SELECT
        COUNT(*) AS "totalBills",
        COUNT(*) AS "assignedBills",
        COUNT(*) - COUNT(*) AS "unassignedBills",
        COALESCE(SUM(b.amount), 0) AS "totalAmount"
      FROM bills b
      JOIN billbatches bb ON b.batchid = bb.batchid
      WHERE bb.accountid = $1
        AND DATE(b.issuedate) = CURRENT_DATE;
    `;

    const result = await pool.query(statsQuery, [accountId]);
    const row = result.rows[0];

    const stats = {
      totalBills: Number(row.totalBills),
      assignedBills: Number(row.assignedBills),
      unassignedBills: Number(row.unassignedBills),
      totalAmount: parseFloat(row.totalAmount)
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching today\'s biller stats:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s stats' });
  }
};

export const createBillBatch = async (req, res) => {
  const accountid = req.user.accountid;
  
  const {
    batchname,
    description,
    recurrencetype,
    startdate,
    penalty_rate,
    min_penalty,
    max_penalty,
    default_duration,
    penalty_period,
    dynamic_fields
  } = req.body;

  console.log({batchname,
    description,
    recurrencetype,
    startdate,
    penalty_rate,
    min_penalty,
    max_penalty,
    default_duration,
    penalty_period,
    dynamic_fields});


  try {
    const query = `
      SELECT create_bill_batch($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const response = await pool.query(query, [
      batchname,
      description || null,
      recurrencetype,
      startdate,
      accountid,
      penalty_rate ? parseFloat(penalty_rate) : 0,
      min_penalty ? parseFloat(min_penalty) : 0,
      max_penalty ? parseFloat(max_penalty) : 0,
      default_duration || '1 day',
      JSON.stringify(dynamic_fields)
    ]);

    // If there are dynamic fields, we could store them in a separate table
    // For now, we'll return them in the response for confirmation
    const batchid = response.rows[0].create_bill_batch;
    const responseData = {
      message: 'Batch created successfully',
      batchid,
      batchname,
      description,
      recurrencetype,
      startdate,
      penalty_rate,
      min_penalty,
      max_penalty,
      default_duration,
      dynamic_fields
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
};

export const assignBills = async (req, res) => {
  const { batchid, amount, duedate, accountids } = req.body;
  const bills = accountids.map(accountid => ({
    billid: uuidv4(),
    batchid,
    amount,
    issuedtoaccountid: accountid,
    duedate,
    issuedate: new Date()
  }));

  try {
    for (const bill of bills) {
      await pool.query(
        `INSERT INTO bills (billid, batchid, amount, issuedtoaccountid, duedate, issuedate)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [bill.billid, bill.batchid, bill.amount, bill.issuedtoaccountid, bill.duedate, bill.issuedate]
      );
    }
    res.status(201).json({ message: 'Bills assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error assigning bills' });
  }

};

export const getBatches = async(req, res) => {
   const accountid  = req.user.accountid;

  try {
    const result = await pool.query(
      `SELECT batchid, batchname, description, recurrencetype, startdate, penalty_rate, min_penalty, max_penalty, default_duration 
       FROM billbatches WHERE accountid = $1 AND isactive = true ORDER BY startdate DESC`,
      [accountid]
    );
    
    res.json({ batches: result.rows });
  } catch (err) {
    console.error('Error fetching bill batches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkBatchNameAvailability = async (req, res) => {
  const accountid = req.user.accountid;
  const { batchname } = req.params;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM billbatches WHERE accountid = $1 AND LOWER(batchname) = LOWER($2)`,
      [accountid, batchname]
    );
    
    const isAvailable = parseInt(result.rows[0].count) === 0;
    res.json({ available: isAvailable });
  } catch (err) {
    console.error('Error checking batch name availability:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBillFields = async (req, res) => {
  const { batchid } = req.params;
  const accountId = req.user.accountid;

  try {
    // First verify that the batch belongs to the current user
    const batchQuery = `
      SELECT batchid FROM billbatches 
      WHERE batchid = $1 AND accountid = $2
    `;
    const batchResult = await pool.query(batchQuery, [batchid, accountId]);
    
    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found or not authorized' });
    }

    // Get the bill fields for this batch
    const fieldsQuery = `
      SELECT field_name, field_type 
      FROM bill_fields 
      WHERE batchid = $1 
      ORDER BY id
    `;
    const fieldsResult = await pool.query(fieldsQuery, [batchid]);

    res.json(fieldsResult.rows);
  } catch (err) {
    console.error('Error fetching bill fields:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBills = async(req, res) => {
  const batchid = req.params.batchid;
  const data = req.body.bills;
  
  try{
    const response = await pool.query(`SELECT create_bills($1, $2)`, [batchid, JSON.stringify(data)]);
    return res.status(200).json(response.rows[0].create_bills);
  }catch(e)
  {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    });
  }

}

