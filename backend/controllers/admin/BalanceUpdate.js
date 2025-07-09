import pool from '../../db.js';


export async function updateBalance(req, res) {

    try {
        const { accountId } = req.body;
        const amount = parseFloat(req.body.amount);

        const result = await pool.query('SELECT update_balance($1, $2)', [accountId, amount]);
        const out = result.rows[0].update_balance;
        if(out.valid){
            return res.status(200).json(out);
        }
        else {return res.status(403).json(out)}

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message : 'updateBalance: invalid accountid or amount'
        })
    }

}