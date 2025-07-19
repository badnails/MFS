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
        COUNT(issuedtoaccountid) AS "assignedBills",
        COUNT(*) - COUNT(issuedtoaccountid) AS "unassignedBills",
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
  //console.log(req.body);
  const {
    batchname,
    description,
    recurrencetype,
    startdate,
    penalty, 
    amount
  } = req.body;

  const batchid = uuidv4();

  try {
    const query = `
      INSERT INTO billbatches (
        batchid,
        accountid,
        batchname,
        description,
        recurrencetype,
        startdate,
        penalty,
        amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(query, [
      batchid,
      accountid,
      batchname,
      description || null,
      recurrencetype,
      startdate,
      penalty !== '' ? parseInt(penalty) : null,
      amount
    ]);

    res.status(201).json({ message: 'Batch created successfully', batchid });
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
      `SELECT batchid, batchname, amount FROM billbatches WHERE accountid = $1 AND isactive = true ORDER BY startdate DESC`,
      [accountid]
    );
    //console.log(result);
    res.json(result.rows); // send array of { batchid, batchname }
  } catch (err) {
    console.error('Error fetching bill batches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

