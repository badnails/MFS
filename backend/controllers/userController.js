import pool from "../db.js";
import jwt from "jsonwebtoken";
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export const uploadMiddleware = upload.single('profilePicture');

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
  console.log('Update request:', { accountid, tableName, updates });
  
  // Validate required fields
  if (!accountid || !tableName || !updates) {
    return res.status(400).json({ error: 'Missing required fields: accountid, tableName, updates' });
  }
  
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

    // First, check if record exists
    const checkQuery = `SELECT 1 FROM ${tableName} WHERE accountid = $1`;
    const checkResult = await client.query(checkQuery, [accountid]);
    
    let result;
    
    if (checkResult.rowCount === 0) {
      // Record doesn't exist, INSERT
      const insertFields = Object.keys(updates);
      const insertValues = Object.values(updates);
      const placeholders = insertValues.map((_, index) => `$${index + 2}`).join(', ');
      
      const insertQuery = `
        INSERT INTO ${tableName} (accountid, ${insertFields.join(', ')})
        VALUES ($1, ${placeholders})
        RETURNING *
      `;
      
      result = await client.query(insertQuery, [accountid, ...insertValues]);
    } else {
      // Record exists, UPDATE
      const setClause = Object.keys(updates)
        .map((field, index) => `${field} = $${index + 2}`)
        .join(', ');
      
      const values = [accountid, ...Object.values(updates)];
      
      const updateQuery = `
        UPDATE ${tableName} 
        SET ${setClause}
        WHERE accountid = $1
        RETURNING *
      `;

      result = await client.query(updateQuery, values);
    }
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Failed to update profile' });
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
      const individualQuery = `
        SELECT accountid, firstname, lastname, dateofbirth, gender, nationality, 
               profile_picture_filename, profile_picture_upload_date,
               CASE WHEN profile_picture IS NOT NULL THEN true ELSE false END as has_profile_picture
        FROM individualinfo 
        WHERE accountid = $1
      `;
      const individualResult = await client.query(individualQuery, [accountid]);
      console.log(individualResult.rows[0]);
      profileData.individual = individualResult.rows[0] || null;
    } else if (account.accounttype === 'BILLER' || account.accounttype === 'MERCHANT') {
      const institutionalQuery = `
        SELECT i.*, ic.category_name,
               i.profile_picture_filename, i.profile_picture_upload_date,
               CASE WHEN i.profile_picture IS NOT NULL THEN true ELSE false END as has_profile_picture
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

// Upload or update profile picture
export const uploadProfilePicture = async (req, res) => {
  const { accountid } = req.body;
  
  if (!accountid) {
    return res.status(400).json({ error: 'Account ID is required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check account type to determine which table to use
    const accountCheck = await client.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [accountid]
    );
    
    if (accountCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountType = accountCheck.rows[0].accounttype;
    const isIndividualAccount = accountType === 'PERSONAL' || accountType === 'AGENT';
    const isBusinessAccount = accountType === 'MERCHANT' || accountType === 'BILLER';
    
    if (!isIndividualAccount && !isBusinessAccount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid account type for profile pictures' });
    }
    
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const filename = req.file.originalname;
    
    let result;
    let tableName = isIndividualAccount ? 'individualinfo' : 'institutionalinfo';
    
    // Check if record exists
    const recordCheck = await client.query(
      `SELECT accountid FROM ${tableName} WHERE accountid = $1`,
      [accountid]
    );
    
    if (recordCheck.rowCount === 0) {
      // Create new record with profile picture
      result = await client.query(
        `INSERT INTO ${tableName} (accountid, profile_picture, profile_picture_mime_type, profile_picture_filename, profile_picture_upload_date)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING accountid`,
        [accountid, imageBuffer, mimeType, filename]
      );
    } else {
      // Update existing record
      result = await client.query(
        `UPDATE ${tableName} 
         SET profile_picture = $2, 
             profile_picture_mime_type = $3, 
             profile_picture_filename = $4, 
             profile_picture_upload_date = CURRENT_TIMESTAMP
         WHERE accountid = $1
         RETURNING accountid`,
        [accountid, imageBuffer, mimeType, filename]
      );
    }
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to save profile picture' });
    }
    
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      filename: filename,
      uploadDate: new Date().toISOString()
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Profile picture upload error:', err);
    
    if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    res.status(500).json({ error: 'Failed to upload profile picture' });
  } finally {
    client.release();
  }
};

// Get profile picture
export const getProfilePicture = async (req, res) => {
  const { accountid } = req.params;
  
  if (!accountid) {
    return res.status(400).json({ error: 'Account ID is required' });
  }
  
  try {
    // First check account type to determine which table to query
    const accountCheck = await pool.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [accountid]
    );
    
    if (accountCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountType = accountCheck.rows[0].accounttype;
    const isIndividualAccount = accountType === 'PERSONAL' || accountType === 'AGENT';
    const isBusinessAccount = accountType === 'MERCHANT' || accountType === 'BILLER';
    
    if (!isIndividualAccount && !isBusinessAccount) {
      return res.status(400).json({ error: 'Invalid account type for profile pictures' });
    }
    
    const tableName = isIndividualAccount ? 'individualinfo' : 'institutionalinfo';
    
    const result = await pool.query(
      `SELECT profile_picture, profile_picture_mime_type, profile_picture_filename 
       FROM ${tableName} 
       WHERE accountid = $1 AND profile_picture IS NOT NULL`,
      [accountid]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }
    
    const { profile_picture, profile_picture_mime_type, profile_picture_filename } = result.rows[0];
    
    // Set appropriate headers
    res.set({
      'Content-Type': profile_picture_mime_type,
      'Content-Length': profile_picture.length,
      'Content-Disposition': `inline; filename="${profile_picture_filename}"`
    });
    
    // Send the image buffer
    res.send(profile_picture);
    
  } catch (err) {
    console.error('Get profile picture error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile picture' });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  const { accountid } = req.body;
  
  if (!accountid) {
    return res.status(400).json({ error: 'Account ID is required' });
  }
  
  try {
    // First check account type to determine which table to update
    const accountCheck = await pool.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [accountid]
    );
    
    if (accountCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountType = accountCheck.rows[0].accounttype;
    const isIndividualAccount = accountType === 'PERSONAL' || accountType === 'AGENT';
    const isBusinessAccount = accountType === 'MERCHANT' || accountType === 'BILLER';
    
    if (!isIndividualAccount && !isBusinessAccount) {
      return res.status(400).json({ error: 'Invalid account type for profile pictures' });
    }
    
    const tableName = isIndividualAccount ? 'individualinfo' : 'institutionalinfo';
    
    const result = await pool.query(
      `UPDATE ${tableName} 
       SET profile_picture = NULL, 
           profile_picture_mime_type = NULL, 
           profile_picture_filename = NULL, 
           profile_picture_upload_date = NULL
       WHERE accountid = $1 AND profile_picture IS NOT NULL
       RETURNING accountid`,
      [accountid]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }
    
    res.status(200).json({ message: 'Profile picture deleted successfully' });
    
  } catch (err) {
    console.error('Delete profile picture error:', err);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
};


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