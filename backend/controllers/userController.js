import pool from '../db.js';

export const getHomePage = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM accounts WHERE accountid = $1',
            [req.session.user.accountId]
        );

        const user = result.rows[0];

        const txResult = await pool.query(
            `SELECT t.*, tt.transactiontypename 
             FROM transaction t
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
        console.error(err);
        res.status(500).json({ error: 'Failed to load homepage data' });
    }
};



export const validateAccount = async (req, res) => {
    const { accountId } = req.body;

    if (!accountId ) {
        return res.status(400).json({ success: false, error: 'Invalid account ID format.' });
    }

    try {
        const result = await pool.query(
            `SELECT accountid, accountname FROM accounts WHERE accountid = $1`,
            [accountId]
        );

        if (result.rows.length > 0) {
            return res.json({
                success: true,
                data: {
                    exists: true,
                    accountId: result.rows[0].accountid,
                    accountname: result.rows[0].accountname
                }
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
    const accountId = req.session.user?.accountId;
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