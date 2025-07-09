import pool from '../../db.js';

export async function getSummary(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM accounts) AS accnum,
                (SELECT SUM(availablebalance) FROM accounts) AS totalbalance,
                (SELECT COUNT(*) FROM accounts WHERE accountstatus = 'ACTIVE') AS activeusers,
                (SELECT COUNT(*) FROM transaction WHERE transactionstatus = 'COMPLETED') AS recentcount;
        `);

        const data = result.rows[0];

        res.json({
            totalAccounts: parseInt(data.accnum),
            totalBalance: parseFloat(data.totalbalance) || 0,
            activeUsers: parseInt(data.activeusers),
            recentCount: parseInt(data.recentcount)
        });
    } catch (error) {
        console.error('Error fetching account stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
