import pool from "../db.js";
import bcrypt from "bcrypt";
import otplib from "otplib";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import { getLocationInfo } from "../utils/location.js";
import { response } from "express";

export const PassCheck = async (req, res) => {
  const {username, password, authFor, transactionid} = req.body;
  const { ipAddress, locationInfo } = await getLocationInfo(req);
  const result = await passcheckutil(username, password, ipAddress, locationInfo, transactionid);
  if(result.valid)
  {
    const data = result.data;
    if(authFor==="LOGIN")
    {
      const token = jwt.sign({accountid: data.accountid, username: data.username, accounttype: data.accounttype}, process.env.JWT_SECRET, {expiresIn: "1h"});
      return res.status(200).json({valid: true, token, user: { accountid: data.accountid, username: data.username, accounttype: data.accounttype}});
    }
    else if(authFor==="TRX")
    {
      return res.status(200).json({valid: true, message: "User verified"});
    }
  }
  else
  {
    if(result.error === "BLOCK") return userBlockCheck(req, res);
    return res.status(401).json({valid: false, message: result.error});
  }
}

const passcheckutil = async (username, password, ipAddress, locationInfo, transactionid) => {
  try {
    const result = await pool.query(
      "SELECT * FROM accounts WHERE username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      return {valid:false, error: "User not found"};
    }

    if(user.accountstatus === "BLOCKED")
    {
        return {valid:false, error:"BLOCK"};
    }

    const isMatch = await bcrypt.compare(password, user.pinhash);

    if (!isMatch) {
      const response = await pool.query(
        "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo, transactionid) VALUES ($1, NOW(), $2, $3, $4, $5, $6) RETURNING GREATEST(0, (SELECT (SELECT int_value FROM db_constants WHERE key = 'max_login_attempts') - (SELECT COUNT(*) FROM authenticationevents WHERE userid = $1 AND authtype = 'PASSWORD' AND issuccessful = false AND now()-eventtimestamp<=(SELECT interval_value FROM db_constants WHERE key = 'login_block_duration')))) AS attempts_remaining",
        [user.accountid, "PASSWORD", false, ipAddress, locationInfo, transactionid]
      );
      return {valid:false, error: "Incorrect Password; Attempts Left: "+response.rows[0].attempts_remaining, attemptsLeft: response.rows[0].attempts_remaining};
    }

    await pool.query(
      "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo, transactionid) VALUES ($1, NOW(), $2, $3, $4, $5, $6)",
      [user.accountid, "PASSWORD", true, ipAddress, locationInfo, transactionid]
    );

    return {valid: true, data:{accountid: user.accountid, username: user.username, accounttype: user.accounttype}};

  } catch (err) {
    console.error(err);
    return {valid:false, error: "Something went wrong"};
  }
};

export const LoginOTPCheck = async (req, res) => {
  const {username, otp} = req.body;
  const result = otpchecker(username, password);
  if(result.valid)
  {
    const data = result.data;
    const token = jwt.sign({accountid: data.accountid, username: data.username, accounttype: data.accounttype}, process.env.JWT_SECRET, {expiresIn: "1h"});
    return res.status(200).json({valid: true, token, user: { accountid: user.accountid, name: user.accountname, accounttype: user.accounttype,}});
  }
  else
  {
    if(result.error === "BLOCK") return userBlockCheck(req, res);
    return res.status(401).json({valid: false, message: result.error});
  }
}

const otpchecker = async (username, otp) => {
  const { ipAddress, locationInfo } = await getLocationInfo(req);

  try {
    const result = await pool.query(
      "SELECT * FROM accounts WHERE username = $1",
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      return {valid:false, error: "User not found"};
    }

    if(user.accountstatus === "BLOCKED")
    {
        return {valid:false, error:"BLOCK"};
    }

    const otpmatch = otplib.authenticator.check(otp, user.totpcode);

    if (!otpmatch) {
      await pool.query(
        "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)",
        [user.accountid, "OTP", false, ipAddress, locationInfo]
      );
      return {valid:false, error: "Incorrect Password"};
    }

    await pool.query(
      "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)",
      [user.accountid, "OTP", true, ipAddress, locationInfo]
    );

    return {valid: true, data:{accountid: user.accountid, username: user.username, accounttype: user.accounttype}};

  } catch (err) {
    console.error(err);
    return {valid:false, error: "Something went wrong"};
  }
};


export const signupUser = async (req, res) => {
  const { username, password, accounttype } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM accounts WHERE username = $1",
      [username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Username already exists in DB" });
    }

    const hash = await bcrypt.hash(password, 12);

    const totpkey = otplib.authenticator.generateSecret();

    await pool.query(
      `
            INSERT INTO accounts (
                accounttype, username, pinhash,
                accountstatus, totpcode, verificationstatus
            ) VALUES ($1, $2, $3, 'ACTIVE', $4, 'VERIFIED')
        `,
      [accounttype, username, hash, totpkey]
    );

    const response = await pool.query(
      "SELECT * FROM accounts WHERE username = $1",
      [username]
    );
    const data = response.rows[0];

    // Generate QR URI
    const otpURI = otplib.authenticator.keyuri(username, "MFS", totpkey);
    const qrURI = await qrcode.toDataURL(otpURI);

    const user = {
      accountId: data.accountid,
      name: data.username,
      accounttype,
    };

    return res.status(201).json({ user, qrURI, totpkey });
  } catch (err) {
    console.error("Signup failed:", err);
    return res.status(500).json({ error: "Signup failed. Try again." });
  }
};

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const availableUsernames = async (req, res) => {
  const username = req.params["username"];
  console.log(username);

  if (!username) {
    return res
      .status(400)
      .json({ valid: false, message: "Username is required" });
  }

  try {
    const result = await pool.query(
      "SELECT accountstatus FROM accounts WHERE username = $1 LIMIT 1",
      [username]
    );

    if (result.rowCount > 0) {
      return res
        .status(200)
        .json({
          valid: false,
          message: "Username not available",
          accountstatus: result.rows[0].accountstatus,
        });
    }

    return res.status(200).json({ valid: true, message: "Username available" });
  } catch (err) {
    console.error("Error checking username:", err);
    return res
      .status(500)
      .json({ valid: false, message: "Internal server error" });
  }
};

export const checkEmail = async (req, res) => {
  const email = req.params["email"];
  console.log("Checking email:", email);

  if (!email) {
    return res
      .status(400)
      .json({ valid: false, message: "Email is required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ valid: false, message: "Invalid email format" });
  }

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM contactinfo WHERE email = $1",
      [email]
    );

    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      return res
        .status(200)
        .json({
          valid: false,
          message: "Email already registered",
        });
    }

    return res.status(200).json({ valid: true, message: "Email available" });
  } catch (err) {
    console.error("Error checking email:", err);
    return res
      .status(500)
      .json({ valid: false, message: "Internal server error" });
  }
};

export const checkPhoneNumber = async (req, res) => {
  const phone = req.params["phone"];
  console.log("Checking phone:", phone);

  if (!phone) {
    return res
      .status(400)
      .json({ valid: false, message: "Phone number is required" });
  }

  // Basic phone validation - remove spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[0-9][\d]{0,15}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return res
      .status(400)
      .json({ valid: false, message: "Invalid phone number format" });
  }

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM contactinfo WHERE phonenumber = $1",
      [phone]
    );

    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      return res
        .status(200)
        .json({
          valid: false,
          message: "Phone number already registered",
        });
    }

    return res.status(200).json({ valid: true, message: "Phone number available" });
  } catch (err) {
    console.error("Error checking phone number:", err);
    return res
      .status(500)
      .json({ valid: false, message: "Internal server error" });
  }
};

export const userBlockCheck = async (req, res) => {
  const username = req.params["username"] || req.body.username;
  if (!username) {
    return res
      .status(400)
      .json({ valid: false, message: "Username is required" });
  }

  const block = await pool.query(
    "SELECT a.authtype, to_char((b.blocked_until AT TIME ZONE 'Asia/Dhaka'), 'YYYY-MM-DD HH24:MI:SS') AS blocked_until from blocked_accounts b join authenticationevents a on (a.eventid = b.blocked_by) join accounts accs on (accs.accountid = b.accountid) where accs.username = $1 AND b.blocked_until>now() order by blocked_until desc limit 1",
    [username]
  );
  
  if (block.rowCount > 0) {
    return res.status(403).json({
      valid: false,
      message:
        "Blocked until " +
        block.rows[0].blocked_until +
        " due to multiple wrong: " +
        block.rows[0].authtype +
        " attempts",
    });
  }

  return res.status(404).json({ valid: true, message: "Please try again after a some time" });
};

export const addUserInformation = async (req, res) => {
  const { isIndividual, formData, accountid } = req.body; 


  try {
    if (isIndividual) {
      const { firstname, lastname, dateofbirth, gender, nationality } = formData;
      console.log(formData);
      console.log(accountid);
      await pool.query(
        `INSERT INTO individualinfo (accountid, firstname, lastname, dateofbirth, gender, nationality)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [accountid, firstname, lastname, dateofbirth, gender, nationality]
      );
    } else {
      const { merchantname, websiteurl, category_id } = formData;
      await pool.query(
        `INSERT INTO institutionalinfo (accountid, merchantname, websiteurl, category_id)
         VALUES ($1, $2, $3, $4)`,
        [accountid, merchantname, websiteurl, category_id]
      );
    } 


    res.status(200).json({ message: 'Information saved successfully' });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to save information' });
  }
};

export const addUserContactInformation = async (req, res) => {
  const { formData, accountid } = req.body;
  const {
    email,
    phone,
    addressline1,
    addressline2,
    city,
    state,
    country,
    zipcode,
  } = formData;
  

  if (!email || !phone || !accountid) {
    return res.status(400).json({ error: 'Email, phone number, and account ID are required.' });
  }

  try {
    await pool.query(
      `INSERT INTO contactinfo (
        accountid, email, phonenumber, addressline1, addressline2, city, state, country, postalcode
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (accountid) DO UPDATE SET
        email = EXCLUDED.email,
        phonenumber = EXCLUDED.phonenumber,
        addressline1 = EXCLUDED.addressline1,
        addressline2 = EXCLUDED.addressline2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        postalcode = EXCLUDED.postalcode`,
      [
        accountid,
        email,
        phone,
        addressline1,
        addressline2,
        city,
        state,
        country,
        zipcode
      ]
    );

    res.json({ message: 'Contact information saved successfully.' });
  } catch (err) {
    console.error('Error inserting contact info:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Add this function to your authController.js
export const completeAccountSetup = async (req, res) => {
  const { accountid, accountType, isIndividual, personalData, institutionalData, contactData } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Insert personal or institutional data
    if (isIndividual && personalData) {
      const { firstname, lastname, dateofbirth, gender, nationality } = personalData;
      
      await client.query(
        `INSERT INTO individualinfo (accountid, firstname, lastname, dateofbirth, gender, nationality)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (accountid) DO UPDATE SET
         firstname = EXCLUDED.firstname,
         lastname = EXCLUDED.lastname,
         dateofbirth = EXCLUDED.dateofbirth,
         gender = EXCLUDED.gender,
         nationality = EXCLUDED.nationality`,
        [accountid, firstname, lastname, dateofbirth, gender, nationality]
      );
    } else if (!isIndividual && institutionalData) {
      const { merchantname, websiteurl, category_id } = institutionalData;
      
      await client.query(
        `INSERT INTO institutionalinfo (accountid, merchantname, websiteurl, category_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (accountid) DO UPDATE SET
         merchantname = EXCLUDED.merchantname,
         websiteurl = EXCLUDED.websiteurl,
         category_id = EXCLUDED.category_id`,
        [accountid, merchantname, websiteurl, category_id]
      );
    }

    // Insert contact data
    const { email, phone, addressline1, addressline2, city, state, country, zipcode } = contactData;
    
    await client.query(
      `INSERT INTO contactinfo (
        accountid, email, phonenumber, addressline1, addressline2, city, state, country, postalcode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (accountid) DO UPDATE SET
      email = EXCLUDED.email,
      phonenumber = EXCLUDED.phonenumber,
      addressline1 = EXCLUDED.addressline1,
      addressline2 = EXCLUDED.addressline2,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      postalcode = EXCLUDED.postalcode`,
      [accountid, email, phone, addressline1, addressline2, city, state, country, zipcode]
    );

    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Account setup completed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Account setup error:', err);
    res.status(500).json({ error: 'Failed to complete account setup' });
  } finally {
    client.release();
  }
};

// Add TOTP regeneration endpoint
export const regenerateTOTP = async (req, res) => {
  const { accountid } = req.body;

  if (!accountid) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  try {
    // Generate new TOTP secret
    const totpkey = otplib.authenticator.generateSecret();

    // Update the account with new TOTP secret
    const result = await pool.query(
      "UPDATE accounts SET totpcode = $1 WHERE accountid = $2 RETURNING username",
      [totpkey, accountid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const username = result.rows[0].username;

    // Generate QR URI
    const otpURI = otplib.authenticator.keyuri(username, "MFS", totpkey);
    const qrURI = await qrcode.toDataURL(otpURI);

    return res.status(200).json({ 
      qrURI, 
      totpkey,
      message: 'TOTP regenerated successfully'
    });
  } catch (err) {
    console.error("TOTP regeneration failed:", err);
    return res.status(500).json({ error: "Failed to regenerate TOTP" });
  }
};
