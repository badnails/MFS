import pool from '../../db.js';


export async function updateBalance(req, res) {

    try {
        const { accountId, amount } = req.body;

        const result = await pool.query('SELECT updatebalance($1, $2)', [accountId, amount]);
        const out = result.rows[0].updatebalance;
        if(out.valid){
            return res.status(200).json(out);
        }
        else {return res.status(403).json(out)}

    }
    catch (error) {
        res.status(500).json({
            message : 'internal server error'
        })
    }

}