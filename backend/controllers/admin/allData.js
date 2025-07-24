import pool from '../../db.js';

export async function getAllData(req, res) {
    try {
        const result = await pool.query(`
            SELECT * FROM accounts   
        `);

        const data = result.rows;
        res.json(
            data
        );
    } catch (error) {
        console.error('Error fetching account stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
