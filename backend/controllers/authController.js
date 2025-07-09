import pool from '../db.js';
import bcrypt from 'bcrypt';
import otplib from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getLocationInfo } from '../utils/location.js';



export const loginUser_AccPass = async (req, res) => {
    const { username, password } = req.body;
    const { ipAddress, locationInfo } = await getLocationInfo(req);

    try {
        const result = await pool.query('SELECT * FROM accounts WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            // await pool.query(
            //     'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
            //     [username, 'PASSWORD', false, ipAddress, locationInfo]
            // );
            return res.status(401).json({ error: 'Invalid username' });
        }

        const isMatch = await bcrypt.compare(password, user.pinhash);

        if (!isMatch) {
            await pool.query(
                'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
                [user.accountid, 'PASSWORD', false, ipAddress, locationInfo]
            );
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        await pool.query(
            'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
            [user.accountid, 'PASSWORD', true, ipAddress, locationInfo]
        );

        const token = jwt.sign(
            {
                accountid: user.accountid,
                username: user.username,
                accounttype: user.accounttype
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                accountid: user.accountid,
                name: user.accountname,
                accounttype: user.accounttype,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const loginUser_OTP = async (req, res) => {
    const { username, password, otp } = req.body;
    const { ipAddress, locationInfo } = await getLocationInfo(req);

    try {
        const result = await pool.query('SELECT * FROM accounts WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            // await pool.query(
            //     'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
            //     [username, 'OTP', false, ipAddress, locationInfo]
            // );
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.pinhash);
        const otpmatch = otplib.authenticator.check(otp, user.totpcode);

        if (!isMatch || !otpmatch) {
            await pool.query(
                'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
                [user.accountid, 'OTP', false, ipAddress, locationInfo]
            );
            return res.status(401).json({ error: 'Invalid username, password or OTP' });
        }

        await pool.query(
            'INSERT INTO authenticationevents (userid, eventtimestamp, authtype, issuccessful, ipaddress, locationinfo) VALUES ($1, NOW(), $2, $3, $4, $5)',
            [user.accountid, 'OTP', true, ipAddress, locationInfo]
        );

        const token = jwt.sign(
            {
                accountid: user.accountid,
                username: user.accountname,
                accounttype: user.accounttype
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({
            token,
            user: {
                accountid: user.accountid,
                username: user.accountname,
                accounttype: user.accounttype
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};
export const signupUser = async (req, res) => {
    const { username, password, accounttype } = req.body;

    try {
        const existing = await pool.query('SELECT * FROM accounts WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Username already exists in DB' });
        }

        const hash = await bcrypt.hash(password, 12);

        const totpkey = otplib.authenticator.generateSecret();

        await pool.query(`
            INSERT INTO accounts (
                accounttype, username, pinhash,
                accountstatus, totpcode, verificationstatus
            ) VALUES ($1, $2, $3, 'ACTIVE', $4, 'VERIFIED')
        `, [accounttype, username, hash, totpkey]);

        const response = await pool.query('SELECT * FROM accounts WHERE username = $1', [username]);
        const data = response.rows[0];

        // Generate QR URI
        const otpURI = otplib.authenticator.keyuri(username, 'MFS', totpkey);
        const qrURI = await qrcode.toDataURL(otpURI);

        const user = {
            accountId: data.accountid,
            name: data.username,
            accounttype
        };

        return res.status(201).json({ user, qrURI, totpkey });
    } catch (err) {
        console.error('Signup failed:', err);
        return res.status(500).json({ error: 'Signup failed. Try again.' });
    }
};

// export const signupUser = async (req, res) => {
//     const { accountId, accountname, password, accounttype } = req.body;

//     try {
//         const existing = await pool.query('SELECT * FROM accounts WHERE accountid = $1', [accountId]);
//         if (existing.rows.length > 0) {
//             return res.status(409).json({ error: 'Account ID already exists.' });
//         }

//         const salt = crypto.randomBytes(16).toString('hex');
//         const hash = await bcrypt.hash(password + salt, 10);
//         const totpkey = otplib.authenticator.generateSecret();

//         await pool.query(`
//             INSERT INTO accounts (accountid, accounttype, accountname, salt, pinhash, accountstatus, availablebalance, currentbalance, totpcode, accounttierid, verificationstatus)
//             VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 0.00, 0.00, $6, 1, 'UNVERIFIED')
//         `, [accountId, accounttype, accountname, salt, hash, totpkey]);

//         const otpURI = otplib.authenticator.keyuri(`MFS: ${accountname}`, 'MFS', totpkey);
//         const qrURI = await qrcode.toDataURL(otpURI);

//         res.json({ accountId, qrURI, totpkey });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Signup failed. Try again.' });
//     }
// };
export const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // access via req.user.accountId
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const availableUsernames = async (req, res) => {
  const username = req.params['username'];
  console.log(username);

  if (!username) {
    return res.status(400).json({ valid: false, message: 'Username is required' });
  }

  try {
    const result = await pool.query(
      'SELECT 1 FROM accounts WHERE username = $1 LIMIT 1',
      [username]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({ valid: false, message: 'Username not available' });
    }

    return res.status(200).json({ valid: true, message: 'Username available' });

  } catch (err) {
    console.error('Error checking username:', err);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
};