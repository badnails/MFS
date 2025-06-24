import pool from '../db/index.js';
import bcrypt from 'bcrypt';
import otplib from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';



export const loginUser_AccPass = async (req, res) => {
    const { accountId, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE accountid = $1', [accountId]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password + user.salt, user.pinhash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username, password or OTP' });
        }

        req.session.user = {
            accountId: user.accountid,
            name: user.accountname,
            accounttype: user.accounttype
        };

        res.json({ message: 'Login successful', user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const loginUser_OTP = async (req, res) => {
    const { accountId, password, otp } = req.body;
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE accountid = $1', [accountId]);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password + user.salt, user.pinhash);
        const otpmatch = otplib.authenticator.check(otp, user.totpcode);

        if (!isMatch || !otpmatch) {
            return res.status(401).json({ error: 'Invalid username, password or OTP' });
        }

        res.json({ message: 'Login successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const signupUser = async (req, res) => {
    const { accountId, accountname, password, accounttype } = req.body;

    try {
        const existing = await pool.query('SELECT * FROM accounts WHERE accountid = $1', [accountId]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Account ID already exists.' });
        }

        const salt = crypto.randomBytes(16).toString('hex');
        const hash = await bcrypt.hash(password + salt, 10);
        const totpkey = otplib.authenticator.generateSecret();

        await pool.query(`
            INSERT INTO accounts (accountid, accounttype, accountname, salt, pinhash, accountstatus, availablebalance, currentbalance, totpcode, accounttierid, verificationstatus)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 0.00, 0.00, $6, 1, 'UNVERIFIED')
        `, [accountId, accounttype, accountname, salt, hash, totpkey]);

        const otpURI = otplib.authenticator.keyuri(`MFS: ${accountname}`, 'MFS', totpkey);
        const qrURI = await qrcode.toDataURL(otpURI);

        res.json({ accountId, qrURI, totpkey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Signup failed. Try again.' });
    }
};