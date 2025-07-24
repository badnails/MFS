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
  const accountId = req.user?.accountid;
  console.log(accountId);
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

export const updateProfileField = async (req, res) => {
  const { accountid, tableName, updates } = req.body;
  console.log(req.body);
  // Validate allowed tables and fields
  const allowedTables = {
    'individualinfo': ['firstname', 'lastname', 'dateofbirth', 'gender', 'nationality'],
    'institutionalinfo': ['merchantname', 'websiteurl', 'category_id'],
    'contactinfo': ['email', 'phonenumber', 'addressline1', 'addressline2', 'city', 'state', 'country', 'postalcode']
  };

  if (!allowedTables[tableName]) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  // Validate that all update fields are allowed
  const invalidFields = Object.keys(updates).filter(field => 
    !allowedTables[tableName].includes(field)
  );
  
  if (invalidFields.length > 0) {
    return res.status(400).json({ 
      error: `Invalid fields: ${invalidFields.join(', ')}` 
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Build dynamic UPDATE query
    const setClause = Object.keys(updates)
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');
    
    const values = [accountid, ...Object.values(updates)];
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}
      WHERE accountid = $1
      RETURNING *
    `;

    const result = await client.query(query, values);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Account not found' });
    }

    await client.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      updatedData: result.rows[0]
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Profile update error:', err);
    
    // Handle specific errors
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Email or phone number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } finally {
    client.release();
  }
};

// Get complete profile data
export const getProfileData = async (req, res) => {
  const { accountid } = req.params;
  //console.log(accountid);
  const client = await pool.connect();
  
  try {
    // Get account info to determine type
    const accountQuery = `
      SELECT a.*, at.typename as tiertype 
      FROM accounts a 
      JOIN accounttiers at ON a.accounttierid = at.accounttierid 
      WHERE a.accountid = $1
    `;
    const accountResult = await client.query(accountQuery, [accountid]);
    
    if (accountResult.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const account = accountResult.rows[0];
    
    // Get contact info (common for all)
    const contactQuery = `SELECT * FROM contactinfo WHERE accountid = $1`;
    const contactResult = await client.query(contactQuery, [accountid]);
    
    let profileData = {
      account: account,
      contact: contactResult.rows[0] || null,
      individual: null,
      institutional: null
    };
    
    // Get specific info based on account type
    if (account.accounttype === 'PERSONAL' || account.accounttype === 'AGENT') {
      const individualQuery = `SELECT * FROM individualinfo WHERE accountid = $1`;
      const individualResult = await client.query(individualQuery, [accountid]);
      console.log(individualResult.rows[0]);
      profileData.individual = individualResult.rows[0] || null;
    } else if (account.accounttype === 'BILLER' || account.accounttype === 'MERCHANT') {
      const institutionalQuery = `
        SELECT i.*, ic.category_name 
        FROM institutionalinfo i 
        LEFT JOIN institution_category ic ON i.category_id = ic.id 
        WHERE i.accountid = $1
      `;
      const institutionalResult = await client.query(institutionalQuery, [accountid]);
      profileData.institutional = institutionalResult.rows[0] || null;
    }
    //console.log(profileData);
    res.status(200).json(profileData);
    
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile data' });
  } finally {
    client.release();
  }
};
