// // src/controllers/transactionController.js
import pool from "../db.js";

export const verifyAccount = async (req, res) => {
  const { accountId } = req.params;

  if (!accountId) {
    return res.status(400).json({ error: "Account ID is required" });
  }

  try {
    const result = await pool.query(
      "SELECT accountid, username, accounttype, accountstatus FROM accounts WHERE accountid = $1",
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = result.rows[0];

    if (account.accountstatus !== "ACTIVE") {
      return res.status(400).json({ error: "Account is not active" });
    }

    res.json({
      success: true,
      account: {
        accountId: account.accountid,
        accountName: account.username,
        accountType: account.accounttype,
      },
    });
  } catch (err) {
    console.error("Account verification error:", err);
    res.status(500).json({ error: "Failed to verify account" });
  }
};

export const fee_calculator = async (req, res) => {
  try{
    const transactiontype = req.params.type;
    const amount = req.params.amount;
    if(!transactiontype || !amount)
    {
      return res.status(400).json({
        valid: false,
        message: "Invalid type or amount"
      })
    }
  
    const response = await pool.query(`SELECT LEAST(max_fee, GREATEST((fee_rate/100)*$2, min_fee)) 
                                      FROM fee_structures 
                                      WHERE transactiontype= $1
                                            AND applicable_from<= $2
                                            AND is_active = true 
                                      ORDER BY applicable_from DESC 
                                      LIMIT 1`, [transactiontype, amount]);
    const feeamount = response.rows[0]?.least || "0";
    return res.status(200).json({
      valid: true,
      feeamount
    });
  }catch(err)
  {
    console.error(err);
    return res.status(500).json({
      valid: false,
      message: "ISO"
    })
  }
}


export async function get_transaction_details(req, res, trxid) {
  try {
    const trxID = req ? req.params.id : trxid;

    if (!trxID) {
      return res.status(400).json({
        valid: false,
        message: "Transaction ID not provided",
      });
    }

    const query = `
            SELECT 
                t.*,
                (SELECT username FROM accounts WHERE accountid = t.sourceaccountid) AS source,
                (SELECT username FROM accounts WHERE accountid = t.destinationaccountid) AS destination
            FROM transactions t 
            WHERE t.transactionid = $1
        `;

    const { rows } = await pool.query(query, [trxID]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Transaction not found",
      });
    }

    const trx = rows[0];

    if (res) {
      return res.status(200).json({
        valid: true,
        transactionDetails: {
          id: trxID,
          type: trx.transactiontype,
          status: trx.transactionstatus,
          sender: trx.source,
          recipient: trx.destination,
          subamount: trx.subamount,
          feesamount: trx.feesamount,
          completed_on: trx.completiontimestamp || null,
        },
      });
    } else {
      return {
        valid: true,
        transactionDetails: {
          id: trxID,
          type: trx.transactiontype,
          status: trx.transactionstatus,
          sender: trx.source,
          recipient: trx.destination,
          subamount: trx.subamount,
          feesamount: trx.feesamount,
          completed_on: trx.completiontimestamp || null,
        },
      };
    }
  } catch (err) {
    console.error("Error fetching transaction details:", err);
    if (res) {
      return res.status(500).json({
        valid: false,
        message: "Internal Server Error",
      });
    }
  }
}

export async function finalizeTransaction(req, res) {
  try {
    const { accountid, transactionid } = req.body;
    
    const final_res = await pool.query(
      "SELECT * FROM finalize_transaction($1, $2)",
      [transactionid, accountid]
    );
    if (final_res.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Transaction Failed",
      });
    }

    const data = final_res.rows[0].finalize_transaction;
    console.log(data);

    return res.status(200).json({
      valid: data.valid,
      message: data.message,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      valid: false,
      message: "DB unreachable",
    });
  }
}

export async function generate_trx_id(req, res) {
  try {
    const { recipientId, subamount, type, feeamount } = req.body;
    if (!subamount)
      return res.status(400).json({
        valid: false,
        message: "Invalid amount",
      });
    if (
      (
        await pool.query(
          `SELECT 1 FROM transactiontype WHERE transactiontype_name = $1`,
          [type]
        )
      ).rowCount == 0
    ) {
      return res.status(400).json({
        valid: false,
        message: "Invalid Type",
      });
    }

    const query = `SELECT create_trx_id($1, $2, $3, $4)`;
    const result = await pool.query(query, [recipientId, type, subamount, feeamount]);
    console.log(result.rows[0]);
    if (result.rows[0].create_trx_id.valid) {
      return res.status(200).json(result.rows[0].create_trx_id);
    } else {
      console.log(result.rows[0].create_trx_id);
      throw new Error(result.rows[0].create_trx_id.message);
    }
  } catch (error) {
    console.error("Error generating transaction ID:", error);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}

export async function getTransactionHistory(req, res) {
  try {
    const { accountid } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      type,
      startDate,
      endDate,
      direction, // 'sent', 'received', 'all'
    } = req.query;

    if (!accountid) {
      return res.status(400).json({
        valid: false,
        message: "Account ID is required",
      });
    }

    // Build WHERE clause based on filters
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Account filter - either source or destination
    if (direction === "sent") {
      whereConditions.push(`t.sourceaccountid = $${paramIndex}`);
      queryParams.push(accountid);
      paramIndex++;
    } else if (direction === "received") {
      whereConditions.push(`t.destinationaccountid = $${paramIndex}`);
      queryParams.push(accountid);
      paramIndex++;
    } else {
      whereConditions.push(
        `(t.sourceaccountid = $${paramIndex} OR t.destinationaccountid = $${paramIndex})`
      );
      queryParams.push(accountid);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`t.transactionstatus = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Type filter
    if (type) {
      whereConditions.push(`t.transactiontype = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    // Date range filter
    if (startDate) {
      whereConditions.push(`t.initiationtimestamp >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`t.initiationtimestamp <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get transactions with pagination
    const transactionsQuery = `
      SELECT 
        t.transactionid,
        t.transactiontype,
        t.transactionstatus,
        t.sourceaccountid,
        t.destinationaccountid,
        t.subamount,
        t.feesamount,
        t.initiationtimestamp,
        t.completiontimestamp,
        t.reference,
        src_acc.username as source_username,
        dest_acc.username as destination_username
      FROM transactions t
      LEFT JOIN accounts src_acc ON t.sourceaccountid = src_acc.accountid
      LEFT JOIN accounts dest_acc ON t.destinationaccountid = dest_acc.accountid
      ${whereClause}
      ORDER BY t.initiationtimestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const transactionsResult = await pool.query(transactionsQuery, queryParams);

    // Format transactions data
    const transactions = transactionsResult.rows.map((tx) => ({
      transactionId: tx.transactionid,
      type: tx.transactiontype,
      status: tx.transactionstatus,
      sourceAccountId: tx.sourceaccountid,
      destinationAccountId: tx.destinationaccountid,
      amount: parseFloat(tx.subamount),
      fees: parseFloat(tx.feesamount),
      totalAmount: parseFloat(tx.subamount) + parseFloat(tx.feesamount),
      initiatedAt: tx.initiationtimestamp,
      completedAt: tx.completiontimestamp,
      reference: tx.reference,
      sourceAccount: {
        username: tx.source_username,
      },
      destinationAccount: {
        username: tx.destination_username,
      },
      // Determine direction for current user
      direction: tx.sourceaccountid === accountid ? "sent" : "received",
    }));

    return res.status(200).json({
      valid: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}

export async function cancelTransaction(req, res) {
  try {
    const { transactionid } = req.body;

    if (!transactionid) {
      return res.status(400).json({
        valid: false,
        message: "Transaction ID is required",
      });
    }

    // Check if transaction exists and is in a cancellable state
    const checkQuery = `
      SELECT transactionid, transactionstatus 
      FROM transactions 
      WHERE transactionid = $1
    `;
    
    const checkResult = await pool.query(checkQuery, [transactionid]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: "Transaction not found",
      });
    }

    const transaction = checkResult.rows[0];
    
    // Only allow cancellation of PENDING transactions
    if (transaction.transactionstatus !== 'PENDING') {
      return res.status(400).json({
        valid: false,
        message: `Cannot cancel transaction with status: ${transaction.transactionstatus}`,
      });
    }

    // Update transaction status to FAILED
    const updateQuery = `
      UPDATE transactions 
      SET transactionstatus = 'FAILED'
      WHERE transactionid = $1
    `;
    
    await pool.query(updateQuery, [transactionid]);

    return res.status(200).json({
      valid: true,
      message: "Transaction cancelled successfully",
    });
    
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}

export async function getTransactionTypes(req, res) {
  try {
    const result = await pool.query(
      "SELECT transactiontype_name FROM transactiontype ORDER BY transactiontype_name"
    );

    return res.status(200).json({
      valid: true,
      types: result.rows.map((row) => row.transactiontype_name),
    });
  } catch (error) {
    console.error("Error fetching transaction types:", error);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}
