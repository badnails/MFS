import pool from '../../db.js';


export async function updateBalance(req, res) {
    try {
        const { accountId } = req.body;
        const amount = parseFloat(req.body.amount);

        await pool.query('SELECT update_balance($1, $2, $3, $4, $5)', [accountId, amount, amount>0?'MINT':'BURN', null, 'DEFAULT_STATEMENT']);
        return res.status(200).json({
            valid: true,
            message: "Balance Updated Successfully"
        })
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message : 'updateBalance: invalid accountid or amount'
        })
    }

}