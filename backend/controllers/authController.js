import pool from "../db.js";
import bcrypt from "bcrypt";
import otplib from "otplib";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import { getLocationInfo } from "../utils/location.js";

export const PassCheck = async (req, res) => {
  const {username, password, authFor} = req.body;
  const { ipAddress, locationInfo } = await getLocationInfo(req);
  const result = await passcheckutil(username, password, ipAddress, locationInfo);
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

const passcheckutil = async (username, password, ipAddress, locationInfo) => {
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
      await pool.query(
        "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)",
        [user.accountid, "PASSWORD", false, ipAddress, locationInfo]
      );
      return {valid:false, error: "Incorrect Password"};
    }

    await pool.query(
      "INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)",
      [user.accountid, "PASSWORD", true, ipAddress, locationInfo]
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

export const userBlockCheck = async (req, res) => {
  const username = req.params["username"] || req.body.username;
  if (!username) {
    return res
      .status(400)
      .json({ valid: false, message: "Username is required" });
  }

  const block = await pool.query(
    "SELECT a.authtype, b.blocked_until from blocked_accounts b join authenticationevents a on (a.eventid = b.blocked_by) join accounts accs on (accs.accountid = b.accountid) where accs.username = $1 AND b.blocked_until>now() order by blocked_until desc limit 1",
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
