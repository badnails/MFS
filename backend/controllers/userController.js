import pool from '../db.js';
import jwt from 'jsonwebtoken';

export const getHomePage = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure JWT_SECRET is defined
        const accountid = decoded.accountid;

        const result = await pool.query(
            'SELECT * FROM accounts WHERE accountid = $1',
            [accountid]
        );

        const user = result.rows[0];

        const txResult = await pool.query(
            `SELECT t.*, tt.transactiontypename 
       FROM transactions t
       JOIN transactiontype tt ON t.transactiontypeid = tt.transactiontypeid
       WHERE t.sourceaccountid = $1
       ORDER BY initiationtimestamp DESC
       LIMIT 10`,
            [user.accountid]
        );

        const transactions = txResult.rows.map(tx => ({
            ...tx,
            totalamount: parseFloat(tx.totalamount),
            subamount: parseFloat(tx.subamount),
            feesamount: parseFloat(tx.feesamount),
        }));

        user.availablebalance = parseFloat(user.availablebalance);
        user.currentbalance = parseFloat(user.currentbalance);

        res.json({ user, transactions });
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};


export const validateAccount = async (req, res) => {
    const accountId = req.params.accountid;
    if (!accountId) {
        return res.status(400).json({ success: false, error: 'Invalid account ID format.' });
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
                availablebalance: result.rows[0].availablebalance
            });
        } else {
            return res.json({ success: true, data: { exists: false } });
        }
    } catch (err) {
        console.error('Validate Account Error:', err.message);
        return res.status(500).json({ success: false, error: 'Internal server error.' });
    }
};


export const getBalance = async (req, res) => {
    const accountId = req.user?.accountId;
    if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const result = await pool.query(
            `SELECT availablebalance FROM accounts WHERE accountid = $1`,
            [accountId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        return res.json({ availableBalance: result.rows[0].availablebalance });
    } catch (err) {
        console.error('Get Balance Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};





export async function searchAccounts(req, res) {
  try {
    const type = req.query.type || '';
    const query = req.query.query || '';
    
    if (!type || !query) {
      return res.status(400).json({ error: 'Type and query parameters are required' });
    }

    if (query.length < 3) {
      return res.json({ accounts: [] });
    }

    // Search by both account ID and account name
    const result = await pool.query(`
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
    `, [type, `%${query}%`, `%${query}%`]);

    const accounts = result.rows.map(account => ({
      accountid: account.accountid,
      accountname: account.username,
      accounttype: account.accounttype
    }));

    return res.json({ accounts });

  } catch (err) {
    console.error('Search accounts error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const getUserBalance = async (req, res) => {
  const accountId = req.user?.accountId;
  if (!accountId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      'SELECT availablebalance FROM accounts WHERE accountid = $1',
      [accountId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ availableBalance: parseFloat(result.rows[0].availablebalance) });
  } catch (err) {
    console.error('Get balance error:', err);
    res.status(500).json({ error: 'Failed to get balance' });
  }
};



// export async function searchAccounts(req, res) {
//     try {
//         const type = req.query.type || '';
//         const query = req.query.query || '';
//         const accid = parseInt(query) || null;
//         const result = await pool.query(`SELECT * FROM accounts WHERE accounttype=$1 AND (accountid=$2 OR accountname=$3)`, [type, accid, query]);
//         const out = result.rows;
//         console.log(out)
//         return res.json({ accounts: out });
//     } catch (err) {
//         console.error('SEARCH ACC:', err.message);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// }