import pool from '../../db.js';

export async function getSummary(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM get_statscard_data();`);

        const data = result.rows[0];

        res.json({
            totalAccounts: Number(data.total_accounts),
            totalBalance: parseFloat(data.total_balance) || 0,
            activeUsers: Number(data.active_users),
            recentCount: Number(data.recent_transactions)
        });
    } catch (error) {
        console.error('Error fetching account stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
