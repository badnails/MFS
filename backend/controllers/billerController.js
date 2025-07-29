// controllers/billerController.js
import { v4 as uuidv4 } from "uuid";
import pool from "../db.js"; // assuming you have a configured pg Pool
import { DateTime, Duration } from "luxon";

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
      pool.query(recentBatchesQuery, [accountId]),
    ]);

    const billerData = {
      totalAmount: parseFloat(totalsResult.rows[0].totalAmount),
      monthlyAmount: parseFloat(totalsResult.rows[0].monthlyAmount),
      recentBatches: recentBatchesResult.rows.map((row) => ({
        batchId: row.batchId,
        batchname: row.batchname,
        billCount: Number(row.billCount),
        totalAmount: parseFloat(row.totalAmount),
        createdAt: row.createdAt,
      })),
    };

    res.json(billerData);
  } catch (err) {
    console.error("Error fetching biller dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch biller dashboard data" });
  }
};

export const getBillerStats = async (req, res) => {
  const accountId = req.user.accountid;
  const now = DateTime.now();
  const { timeRange, startDate, endDate } = req.query;

  let ltime = now;
  let htime = now;

  switch (timeRange) {
    case "today":
      ltime = now.startOf("day");
      break;
    case "last3days":
      ltime = now.minus({ days: 2 });
      break;
    case "last7days":
      ltime = now.minus({ days: 6 });
      break;
    case "lastMonth":
      ltime = now.minus({ months: 1 });
      break;
    case "lastYear":
      ltime = now.minus({ years: 1 });
      break;
    case "custom":
      ltime = DateTime.fromISO(startDate).startOf("day");
      htime = DateTime.fromISO(endDate).endOf("day");
      break;
    default:
      ltime = now;
  }

  ltime = ltime.toISO();
  htime = htime.toISO();

  try {
    const statsQuery = `
    SELECT
      COUNT(*) AS "totalBills",
      COUNT(*) FILTER (WHERE t.transactionstatus = 'COMPLETED') AS "paidBills",
      COUNT(*) FILTER (WHERE t.transactionid IS NULL OR t.transactionstatus <> 'COMPLETED') AS "unpaidBills",
      SUM(b.amount) AS "totalAmount",
      SUM(b.amount) FILTER (WHERE t.transactionstatus = 'COMPLETED') AS "paidAmount",
      SUM(b.amount) FILTER (WHERE t.transactionid IS NULL OR t.transactionstatus <> 'COMPLETED') AS "unpaidAmount"
    FROM bills b
    JOIN billbatches bb ON b.batchid = bb.batchid
    LEFT JOIN transactions t ON b.transactionid = t.transactionid 
    WHERE bb.accountid = $1 AND b.issuedate BETWEEN $2 AND $3
  `;

    const result = await pool.query(statsQuery, [accountId, ltime, htime]);

    const row = result.rows[0];

    const stats = {
      totalBills: Number(row.totalBills),
      paidBills: Number(row.paidBills),
      unpaidBills: Number(row.unpaidBills),
      totalAmount: parseFloat(row.totalAmount) || 0,
      paidAmount: parseFloat(row.paidAmount) || 0,
      unpaidAmount: parseFloat(row.unpaidAmount) || 0,
    };

    res.json(stats);
  } catch (err) {
    console.error("Error fetching biller stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
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
    dynamic_fields,
  } = req.body;

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
      default_duration || "1 day",
      JSON.stringify(dynamic_fields),
    ]);

    // If there are dynamic fields, we could store them in a separate table
    // For now, we'll return them in the response for confirmation
    const batchid = response.rows[0].create_bill_batch;
    const responseData = {
      message: "Batch created successfully",
      batchid,
      batchname,
      description,
      recurrencetype,
      startdate,
      penalty_rate,
      min_penalty,
      max_penalty,
      default_duration,
      dynamic_fields,
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ error: "Failed to create batch" });
  }
};

export const getBatches = async (req, res) => {
  const accountid = req.user.accountid;

  try {
    const result = await pool.query(
      `SELECT
        bb.batchid AS id,
        bb.batchname AS name,
        bb.startdate AS startDate,
        bb.lastrecurrencedate AS lastRecurrenceDate,
        CASE
          WHEN bb.recurrencetype = 'ONE_TIME' THEN NULL
          WHEN bb.recurrencetype = 'DAILY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '1 day'
          WHEN bb.recurrencetype = 'WEEKLY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '1 week'
          WHEN bb.recurrencetype = 'MONTHLY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '1 month'
          WHEN bb.recurrencetype = 'QUARTERLY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '3 months'
          WHEN bb.recurrencetype = 'YEARLY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '1 year'
          WHEN bb.recurrencetype = 'MINUTELY' THEN COALESCE(bb.lastrecurrencedate, bb.startdate) + INTERVAL '1 minute'
          ELSE NULL
        END AS nextRecurrenceDate,
        bb.recurrencetype AS recurrenceType,
        bb.penalty_rate AS penaltyRate,
        bb.min_penalty AS minimumPenalty,
        bb.max_penalty AS maximumPenalty,

        COUNT(b.billid) AS totalBills,
        COUNT(t.transactionid) AS paidBills,
        COUNT(b.billid) - COUNT(t.transactionid) AS unpaidBills
      FROM billbatches bb
      LEFT JOIN bills b ON b.batchid = bb.batchid
      LEFT JOIN transactions t ON b.transactionid = t.transactionid AND t.transactionstatus = 'COMPLETED'
      WHERE bb.accountid = $1
      GROUP BY
        bb.batchid, bb.batchname, bb.startdate, bb.lastrecurrencedate,
        bb.recurrencetype, bb.penalty_rate, bb.min_penalty, bb.max_penalty
      ORDER BY bb.batchid DESC;
      `,
      [accountid]
    );

    // Format the response to match frontend expectations
    const formattedBatches = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.startdate,
      lastRecurrenceDate: row.lastrecurrencedate,
      nextRecurrenceDate: row.nextrecurrencedate,
      recurrenceType: row.recurrencetype,
      penaltyRate: parseFloat(row.penaltyrate) || 0,
      minimumPenalty: parseFloat(row.minimumpenalty) || 0,
      maximumPenalty: parseFloat(row.maximumpenalty) || 0,
      // defaultDuration: parseInt(row.defaultduration) || 30, // TODO: Fix interval parsing
      totalBills: parseInt(row.totalbills) || 0,
      paidBills: parseInt(row.paidbills) || 0,
      unpaidBills: parseInt(row.unpaidbills) || 0,
    }));

    res.json(formattedBatches);
  } catch (err) {
    console.error("Error fetching bill batches:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBillBatch = async (req, res) => {
  const accountid = req.user.accountid;
  const { id } = req.params;
  const {
    recurrenceType,
    penaltyRate,
    minimumPenalty,
    maximumPenalty,
    // defaultDuration // TODO: Fix interval parsing
  } = req.body;

  try {
    // First, verify that the batch belongs to the authenticated user
    const authQuery = `
      SELECT batchid FROM billbatches 
      WHERE batchid = $1 AND accountid = $2
    `;
    const authResult = await pool.query(authQuery, [id, accountid]);

    if (authResult.rows.length === 0) {
      return res.status(404).json({
        error: "Bill batch not found or you don't have permission to update it",
      });
    }

    // Validate recurrence type
    const validRecurrenceTypes = [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "yearly",
    ];
    if (
      recurrenceType &&
      !validRecurrenceTypes.includes(recurrenceType.toLowerCase())
    ) {
      return res.status(400).json({
        error:
          "Invalid recurrence type. Must be one of: daily, weekly, monthly, quarterly, yearly",
      });
    }

    // Validate numeric values
    if (penaltyRate !== undefined && (penaltyRate < 0 || penaltyRate > 100)) {
      return res.status(400).json({
        error: "Penalty rate must be between 0 and 100",
      });
    }

    if (minimumPenalty !== undefined && minimumPenalty < 0) {
      return res.status(400).json({
        error: "Minimum penalty cannot be negative",
      });
    }

    if (maximumPenalty !== undefined && maximumPenalty < 0) {
      return res.status(400).json({
        error: "Maximum penalty cannot be negative",
      });
    }

    if (
      minimumPenalty !== undefined &&
      maximumPenalty !== undefined &&
      minimumPenalty > maximumPenalty
    ) {
      return res.status(400).json({
        error: "Minimum penalty cannot be greater than maximum penalty",
      });
    }

    // TODO: Fix interval parsing for default duration
    /*
    if (defaultDuration !== undefined && defaultDuration <= 0) {
      return res.status(400).json({ 
        error: "Default duration must be greater than 0" 
      });
    }
    */

    // Build the update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (recurrenceType !== undefined) {
      updateFields.push(`recurrencetype = $${paramIndex}`);
      values.push(recurrenceType.toUpperCase());
      paramIndex++;
    }

    if (penaltyRate !== undefined) {
      updateFields.push(`penalty_rate = $${paramIndex}`);
      values.push(penaltyRate);
      paramIndex++;
    }

    if (minimumPenalty !== undefined) {
      updateFields.push(`min_penalty = $${paramIndex}`);
      values.push(minimumPenalty);
      paramIndex++;
    }

    if (maximumPenalty !== undefined) {
      updateFields.push(`max_penalty = $${paramIndex}`);
      values.push(maximumPenalty);
      paramIndex++;
    }

    // TODO: Fix interval parsing for default duration
    /*
    if (defaultDuration !== undefined) {
      updateFields.push(`default_duration = INTERVAL '${defaultDuration} days'`);
    }
    */

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No valid fields provided for update",
      });
    }

    // Add batch ID and account ID to values
    values.push(id, accountid);

    const updateQuery = `
      UPDATE billbatches 
      SET ${updateFields.join(", ")}
      WHERE batchid = $${paramIndex} AND accountid = $${paramIndex + 1}
      RETURNING 
        batchid AS id,
        batchname AS name,
        startdate AS startDate,
        lastrecurrencedate AS lastRecurrenceDate,
        CASE
          WHEN recurrencetype = 'ONE_TIME' THEN NULL
          WHEN recurrencetype = 'DAILY' THEN COALESCE(lastrecurrencedate, startdate) + INTERVAL '1 day'
          WHEN recurrencetype = 'WEEKLY' THEN COALESCE(lastrecurrencedate, startdate) + INTERVAL '1 week'
          WHEN recurrencetype = 'MONTHLY' THEN COALESCE(lastrecurrencedate, startdate) + INTERVAL '1 month'
          WHEN recurrencetype = 'QUARTERLY' THEN COALESCE(lastrecurrencedate, startdate) + INTERVAL '3 months'
          WHEN recurrencetype = 'YEARLY' THEN COALESCE(lastrecurrencedate, startdate) + INTERVAL '1 year'
          ELSE NULL
        END AS nextRecurrenceDate,
        recurrencetype AS recurrenceType,
        penalty_rate AS penaltyRate,
        min_penalty AS minimumPenalty,
        max_penalty AS maximumPenalty
        -- EXTRACT(EPOCH FROM default_duration)/86400 AS defaultDuration -- TODO: Fix interval parsing
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Bill batch not found after update",
      });
    }

    // Format the response
    const updatedBatch = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      startDate: result.rows[0].startdate,
      lastRecurrenceDate: result.rows[0].lastrecurrencedate,
      nextRecurrenceDate: result.rows[0].nextrecurrencedate,
      recurrenceType: result.rows[0].recurrencetype.toLowerCase(),
      penaltyRate: parseFloat(result.rows[0].penaltyrate) || 0,
      minimumPenalty: parseFloat(result.rows[0].minimumpenalty) || 0,
      maximumPenalty: parseFloat(result.rows[0].maximumpenalty) || 0,
      // defaultDuration: parseInt(result.rows[0].defaultduration) || 30 // TODO: Fix interval parsing
    };

    res.json({
      success: true,
      message: "Bill batch updated successfully",
      data: updatedBatch,
    });
  } catch (err) {
    console.error("Error updating bill batch:", err);
    res.status(500).json({ error: "Internal server error" });
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
    console.error("Error checking batch name availability:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBillFields = async (req, res) => {
  const { batchid } = req.params;
  const accountId = req.user.accountid;

  try {
    const batchQuery = `
      SELECT batchid FROM billbatches 
      WHERE batchid = $1 AND accountid = $2
    `;
    const batchResult = await pool.query(batchQuery, [batchid, accountId]);

    if (batchResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Batch not found or not authorized" });
    }

    const fieldsQuery = `
      SELECT field_name, field_type 
      FROM bill_fields 
      WHERE batchid = $1 
      ORDER BY id
    `;
    const fieldsResult = await pool.query(fieldsQuery, [batchid]);

    res.json(fieldsResult.rows);
  } catch (err) {
    console.error("Error fetching bill fields:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createBills = async (req, res) => {
  const batchid = req.params.batchid;
  const data = req.body.bills;

  try {
    const response = await pool.query(`SELECT create_bills($1, $2)`, [
      batchid,
      JSON.stringify(data),
    ]);
    return res.status(200).json(response.rows[0].create_bills);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO",
    });
  }
};

export const getBillsForBatch = async (req, res) => {
  const { batchid } = req.params;
  const accountId = req.user.accountid;

  try {
    // First verify that the batch belongs to the authenticated user
    const batchQuery = `
      SELECT batchid FROM billbatches 
      WHERE batchid = $1 AND accountid = $2
    `;
    const batchResult = await pool.query(batchQuery, [batchid, accountId]);

    if (batchResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Batch not found or not authorized" });
    }

    const billsQuery = `
      SELECT 
        b.billid,
        b.amount,
        b.issuedate,
        b.duedate,
        b.transactionid,
        CASE 
            WHEN t.transactionid IS NOT NULL AND t.transactionstatus = 'COMPLETED' 
            THEN true 
            ELSE false 
        END AS isPaid
        FROM bills b
        LEFT JOIN transactions t 
            ON b.transactionid = t.transactionid
        WHERE b.batchid = $1
        ORDER BY b.issuedate DESC;
    `;

    const billsResult = await pool.query(billsQuery, [batchid]);

    return res.json(billsResult.rows);
  } catch (err) {
    console.error("Error fetching bills:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBillFieldValues = async (req, res) => {
  const { billid } = req.params;
  const accountId = req.user.accountid;

  try {
    // First verify that the bill belongs to a batch owned by the authenticated user
    const authQuery = `
      SELECT b.billid 
      FROM bills b
      JOIN billbatches bb ON b.batchid = bb.batchid
      WHERE b.billid = $1 AND bb.accountid = $2
    `;
    const authResult = await pool.query(authQuery, [billid, accountId]);

    if (authResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Bill not found or not authorized" });
    }

    // Get field values for the bill
    const fieldsQuery = `
      SELECT bf.field_name, bad.field_value
      FROM bill_auth_data bad
      JOIN bill_fields bf ON bad.field_id = bf.id
      WHERE bad.billid = $1
    `;
    const fieldsResult = await pool.query(fieldsQuery, [billid]);

    return res.json(fieldsResult.rows);
  } catch (err) {
    console.error("Error fetching bill field values:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBill = async (req, res) => {
  const { billid } = req.params;
  const { batchid, amount, issuedate, duedate, fieldValues } = req.body;
  const accountId = req.user.accountid;

  try {

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (amount || issuedate || duedate) {
        let updateFields = [];
        let values = [];
        let paramIndex = 1;

        if (amount) {
          updateFields.push(`amount = $${paramIndex++}`);
          values.push(parseFloat(amount));
        }

        if (issuedate) {
          updateFields.push(`issuedate = $${paramIndex++}`);
          values.push(issuedate);
        }

        if (duedate) {
          updateFields.push(`duedate = $${paramIndex++}`);
          values.push(duedate);
        }

        if (updateFields.length > 0) {
          values.push(billid);
          const updateQuery = `
            UPDATE bills 
            SET ${updateFields.join(", ")}
            WHERE billid = $${paramIndex}
          `;
          await client.query(updateQuery, values);
        }
      }

      if (fieldValues && fieldValues.length > 0) {
        for (const fieldValue of fieldValues) {
          await client.query(
            `UPDATE bill_auth_data 
              SET field_value = $1 
              WHERE billid = $2 AND field_id = (SELECT id FROM bill_fields WHERE field_name = $3 AND batchid = $4)`,
            [fieldValue.field_value, billid, fieldValue.field_name, batchid]
          );
        }
      }

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Bill updated successfully",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error updating bill:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteBill = async (req, res) => {
  const { billid } = req.params;
  const accountId = req.user.accountid;

  try {

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM bills WHERE billid = $1", [billid]);

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Bill deleted successfully",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error deleting bill:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
