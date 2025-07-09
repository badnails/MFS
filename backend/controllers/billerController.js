import pool from '../db.js';


export const generateBillBatch = async (req, res) => {
    const user = req.session.user;
    if (!user || user.accounttype !== 'BILLER') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { batchname, description, recurrencetype, startdate, penalty, isactive } = req.body;

    try {
        await pool.query(
            `INSERT INTO billbatches (batchid, accountid, batchname, description, recurrencetype, startdate, penalty, isactive)
             VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7)`,
            [
                user.accountId,
                batchname,
                description || null,
                recurrencetype,
                startdate,
                penalty ? parseInt(penalty) : null,
                isactive === 'true'
            ]
        );

        res.json({ message: 'Bill batch created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create bill batch' });
    }
};

export const postAssignBill = async (req, res) => {
    const user = req.session.user;
    if (!user || user.accounttype !== 'BILLER') {
        return res.status(403).json({ error: 'Access denied' });
    }

    const { batchid, issuedtoaccountids, billtypeid, amount, issuedate, duedate } = req.body;
    const billAccounts = Array.isArray(issuedtoaccountids) ? issuedtoaccountids : [issuedtoaccountids];

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const accId of billAccounts) {
                const parsedAccId = parseInt(accId);
                const parsedBatchId = batchid ? parseInt(batchid) : null;
                const parsedAmount = parseFloat(amount);

                if (isNaN(parsedAccId) || (batchid && isNaN(parsedBatchId)) || isNaN(parsedAmount)) {
                    return res.status(400).json({ error: "Invalid form data" });
                }

                await client.query(
                    `INSERT INTO bills (billid, billtypeid, batchid, issuedtoaccountid, amount, issuedate, duedate)
                     VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)`,
                    [
                        1111,
                        parsedBatchId,
                        parsedAccId,
                        parsedAmount,
                        issuedate,
                        duedate || null
                    ]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Bills assigned successfully' });
        } catch (e) {
            await client.query('ROLLBACK');
            console.error(e);
            res.status(500).json({ error: "Failed to assign bills." });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection error." });
    }
};

export const getAssignBillPage = async (req, res) => {
    const user = req.session.user;
    if (!user || user.accounttype !== 'BILLER') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const client = await pool.connect();

        const [batchesResult, recipientsResult] = await Promise.all([
            client.query(`SELECT batchid, batchname FROM billbatches WHERE accountid = $1`, [user.accountId]),
            client.query(`SELECT accountid, accountname FROM accounts WHERE accounttype = 'PERSONAL'`)
        ]);

        client.release();

        res.json({
            user,
            batches: batchesResult.rows,
            recipients: recipientsResult.rows
        });
    } catch (err) {
        console.error("Error loading assign bill data:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};