import pool from '../../db.js';

export async function getAllTransactions(req, res) {
    try {
        const result = await pool.query(`
            SELECT 
                t.*, 
                a1.username AS source_name,
                a2.username AS destination_name,
                tt.transactiontypename as transactiontypename
                
            FROM transactions t
            LEFT JOIN accounts a1 ON t.sourceaccountid = a1.accountid
            JOIN accounts a2 ON t.destinationaccountid = a2.accountid
            JOIN transactiontype tt on t.transactiontypeid = tt.transactiontypeid
        `);

        const data = result.rows;
        //console.log(data);
        res.json(
            data
        );

    } catch (error) {
        console.error('Error fetching account stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
