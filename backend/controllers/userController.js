import pool from "../db.js";
import jwt from "jsonwebtoken";

export const getHomePage = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure JWT_SECRET is defined
    const accountid = decoded.accountid;

    const result = await pool.query(
      "SELECT * FROM accounts WHERE accountid = $1",
      [accountid]
    );

    const user = result.rows[0];

    const txResult = await pool.query(
      `SELECT t.*
       FROM transactions t
       WHERE t.sourceaccountid = $1
       ORDER BY initiationtimestamp DESC
       LIMIT 10`,
      [user.accountid]
    );

    const transactions = txResult.rows.map((tx) => ({
      ...tx,
      totalamount: parseFloat(tx.subamount + tx.feesamount),
      subamount: parseFloat(tx.subamount),
      feesamount: parseFloat(tx.feesamount),
    }));

    user.availablebalance = parseFloat(user.availablebalance);

    res.json({ user, transactions });
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const validateAccount = async (req, res) => {
  const accountId = req.params.accountid;
  if (!accountId) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid account ID format." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM accounts WHERE accountid = $1 OR username = $1`,
      [accountId]
    );

    if (result.rows.length > 0) {
      console.log(result.rows[0].accountid + " " + result.rows[0].username);
      return res.json({
        exists: true,
        accountId: result.rows[0].accountid,
        accountname: result.rows[0].username,
        accounttype: result.rows[0].accounttype,
        availablebalance: result.rows[0].availablebalance,
      });
    } else {
      return res.json({ success: true, data: { exists: false } });
    }
  } catch (err) {
    console.error("Validate Account Error:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error." });
  }
};

export const getBalance = async (req, res) => {
  const accountId = req.params?.id || req.user?.accountid;
  if (!accountId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      `SELECT availablebalance FROM accounts WHERE accountid = $1`,
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    return res.json({ availableBalance: result.rows[0].availablebalance });
  } catch (err) {
    console.error("Get Balance Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export async function searchAccounts(req, res) {
  try {
    const type = req.query.type || "";
    const query = req.query.query || "";

    if (!type || !query) {
      return res
        .status(400)
        .json({ error: "Type and query parameters are required" });
    }

    if (query.length < 3) {
      return res.json({ accounts: [] });
    }

    // Search by both account ID and account name
    const result = await pool.query(
      `
      SELECT accountid, username, accounttype, accountstatus
      FROM accounts 
      WHERE accounttype = $1 
        AND accountstatus = 'ACTIVE'
        AND (
          LOWER(username) LIKE LOWER($2) 
          OR accountid::text LIKE $3
        )
      ORDER BY username
      LIMIT 20
    `,
      [type, `%${query}%`, `%${query}%`]
    );

    const accounts = result.rows.map((account) => ({
      accountid: account.accountid,
      accountname: account.username,
      accounttype: account.accounttype,
    }));

    return res.json({ accounts });
  } catch (err) {
    console.error("Search accounts error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const getUserBalance = async (req, res) => {
  const accountId = req.user?.accountid;
  console.log(accountId);
  //if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      "SELECT availablebalance FROM accounts WHERE accountid = $1",
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ availableBalance: parseFloat(result.rows[0].availablebalance) });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ error: "Failed to get balance" });
  }
};

export const get_notifications = async (req, res) => {
  const accountId = req.user?.accountid;

  try {
    const result = await pool.query(
      "SELECT * FROM get_recent_notifications($1)",
      [accountId]
    );

    const notifications = result.rows;
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to retrieve notifications" });
  }
};


export const getBills = async(req, res) => {
    const customerId = req.user.accountid;
  const billerId = req.params.accountid;
  console.log(customerId);

  try {
    const result = await pool.query(
      `SELECT b.billid, bb.batchname, b.amount, b.duedate
       FROM bills b 
       JOIN billbatches bb on b.batchid = bb.batchid
       WHERE bb.accountid = $1 AND b.issuedtoaccountid = $2 AND transactionid is NULL
       ORDER BY duedate ASC`,
      [billerId, customerId]
    );
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assigned bills:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }

}

export const getBillBatches = async(req, res) =>{
  const billerid = req.params.billerid;
  try{
    const result = await pool.query(`SELECT batchid, batchname FROM billbatches WHERE accountid = $1`, [billerid]);
    return res.status(200).json(result.rows);
  }catch(e)
  {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    })
  }
}

export const getBillFields = async(req, res) =>{
  const batchid = req.params.batchid;
  try{
    const result = await pool.query(`SELECT batchid, field_name, field_type FROM bill_fields WHERE batchid = $1`, [batchid]);
    return res.status(200).json(result.rows);
  }catch(e)
  {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    })
  }
}

export const searchBills = async (req, res) =>{
  const batchid = req.body.batchid;
  const fieldValues = req.body.fieldValues;
  console.log(fieldValues);
  try{
    const sql = `
    SELECT b.billid, b.transactionid, b.amount, b.issuedate, b.duedate
    FROM bills b
    WHERE b.batchid = $1
      AND b.billid IN (
        SELECT bad.billid
        FROM bill_auth_data bad
        JOIN bill_fields bf ON bad.field_id = bf.id
        JOIN jsonb_each_text($2) AS input(field_name, field_value)
          ON bf.field_name = input.field_name AND bad.field_value = input.field_value
        WHERE bf.batchid = $1
        GROUP BY bad.billid
        HAVING COUNT(DISTINCT bf.field_name) = (
          SELECT COUNT(*) FROM jsonb_each_text($2)
        )
      ) AND NOT EXISTS(SELECT 1 FROM transactions WHERE transactionid = b.transactionid AND transactionstatus = 'COMPLETED');
    `;

const params = [batchid, JSON.stringify(fieldValues)];
const { rows } = await pool.query(sql, params);
console.log(rows);
return res.status(200).json(rows);

  }catch(e)
  {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    })
  }
}

export const linkBillTransaction = async (req, res) =>{
  const {transactionId, billId} = req.body;
  try{
    await pool.query(`UPDATE bills
                      SET transactionid = $1
                      WHERE billid = $2`, [transactionId, billId]);
    return res.status(200).json({
      valid: true,
      message: "Trx Linked"
    })
  }catch(e)
  {
    console.log(e);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    });
  }
}