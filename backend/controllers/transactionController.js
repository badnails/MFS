import pool from '../db.js';

export const makeTransfer = async (req, res) => {
    const { destination, amount } = req.body;
    const sourceAccountId = req.session.user?.accountId;
    const transferAmount = parseFloat(amount);

    if (!sourceAccountId) return res.status(401).json({ error: 'Unauthorized' });
    if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount.' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const sourceRes = await client.query(
            `SELECT availablebalance, currentbalance FROM accounts WHERE accountid = $1 FOR UPDATE`,
            [sourceAccountId]
        );
        if (sourceRes.rows.length === 0) throw new Error('Source account not found');

        const source = sourceRes.rows[0];
        if (source.availablebalance < transferAmount) throw new Error('Insufficient balance');

        const destRes = await client.query(
            `SELECT accountid FROM accounts WHERE accountid = $1 FOR UPDATE`,
            [destination]
        );
        if (destRes.rows.length === 0) throw new Error('Destination account not found');

        await client.query(`
            UPDATE accounts SET 
                availablebalance = availablebalance - $1,
                currentbalance = currentbalance - $1
             WHERE accountid = $2`,
            [transferAmount, sourceAccountId]
        );

        await client.query(`
            UPDATE accounts SET 
                availablebalance = availablebalance + $1,
                currentbalance = currentbalance + $1
             WHERE accountid = $2`,
            [transferAmount, destination]
        );

        const tx = await client.query(`
            INSERT INTO transaction (
                transactiontypeid, transactionstatus,
                sourceaccountid, destinationaccountid,
                subamount, feesamount, totalamount,
                initiationtimestamp, completiontimestamp, reference
            ) VALUES (
                1111, 'COMPLETED',
                $1, $2,
                $3, 0, $3,
                NOW(), NOW(), $4
            ) RETURNING *`,
            [sourceAccountId, destination, transferAmount, `TX-${Date.now()}`]
        );

        await client.query('COMMIT');
        res.json({ message: 'Transfer successful', transaction: tx.rows[0] });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Transfer Error:', err.message);
        res.status(500).json({ error: 'Transfer failed: ' + err.message });
    } finally {
        if (client) client.release();
    }
};
