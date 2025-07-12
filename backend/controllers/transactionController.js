// // src/controllers/transactionController.js
import pool from '../db.js';

// // Existing makeTransfer function (keep as is)
// export const makeTransfer = async (req, res) => {
//   const { destination, amount } = req.body;
//   const sourceAccountId = req.user?.accountId; // Updated to use JWT auth
//   const transferAmount = parseFloat(amount);

//   if (!sourceAccountId) return res.status(401).json({ error: 'Unauthorized' });
//   if (isNaN(transferAmount) || transferAmount <= 0) {
//     return res.status(400).json({ error: 'Invalid amount.' });
//   }

//   let client;
//   try {
//     client = await pool.connect();
//     await client.query('BEGIN');

//     const sourceRes = await client.query(
//       `SELECT availablebalance, currentbalance FROM accounts WHERE accountid = $1 FOR UPDATE`,
//       [sourceAccountId]
//     );

//     if (sourceRes.rows.length === 0) throw new Error('Source account not found');

//     const source = sourceRes.rows[0];
//     if (source.availablebalance < transferAmount) throw new Error('Insufficient balance');

//     const destRes = await client.query(
//       `SELECT accountid FROM accounts WHERE accountid = $1 FOR UPDATE`,
//       [destination]
//     );

//     if (destRes.rows.length === 0) throw new Error('Destination account not found');

//     await client.query(`
//       UPDATE accounts SET
//         availablebalance = availablebalance - $1,
//         currentbalance = currentbalance - $1
//       WHERE accountid = $2`,
//       [transferAmount, sourceAccountId]
//     );

//     await client.query(`
//       UPDATE accounts SET
//         availablebalance = availablebalance + $1,
//         currentbalance = currentbalance + $1
//       WHERE accountid = $2`,
//       [transferAmount, destination]
//     );

//     const tx = await client.query(`
//       INSERT INTO transaction (
//         transactiontypeid, transactionstatus,
//         sourceaccountid, destinationaccountid,
//         subamount, feesamount, totalamount,
//         initiationtimestamp, completiontimestamp, reference
//       ) VALUES (
//         1111, 'COMPLETED',
//         $1, $2,
//         $3, 0, $3,
//         NOW(), NOW(), $4
//       ) RETURNING *`,
//       [sourceAccountId, destination, transferAmount, `TX-${Date.now()}`]
//     );

//     await client.query('COMMIT');
//     res.json({ message: 'Transfer successful', transaction: tx.rows[0] });

//   } catch (err) {
//     if (client) await client.query('ROLLBACK');
//     console.error('Transfer Error:', err.message);
//     res.status(500).json({ error: 'Transfer failed: ' + err.message });
//   } finally {
//     if (client) client.release();
//   }
// };

// // NEW: Separate verification endpoint
export const verifyAccount = async (req, res) => {
  const { accountId } = req.params;

  if (!accountId) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  try {
    const result = await pool.query(
      'SELECT accountid, username, accounttype, accountstatus FROM accounts WHERE accountid = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = result.rows[0];

    if (account.accountstatus !== 'ACTIVE') {
      return res.status(400).json({ error: 'Account is not active' });
    }

    res.json({
      success: true,
      account: {
        accountId: account.accountid,
        accountName: account.accountname,
        accountType: account.accounttype
      }
    });

  } catch (err) {
    console.error('Account verification error:', err);
    res.status(500).json({ error: 'Failed to verify account' });
  }
};

// // NEW: Initiate payment endpoint
// export const initiatePayment = async (req, res) => {
//   const { recipientId, amount, paymentType, description } = req.body;
//   const sourceAccountId = req.user?.accountid;

//   if (!sourceAccountId) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   const paymentAmount = parseFloat(amount);
//   if (isNaN(paymentAmount) || paymentAmount <= 0) {
//     return res.status(400).json({ error: 'Invalid amount' });
//   }

//   try {
//     // Verify source account has sufficient balance
//     const sourceResult = await pool.query(
//       'SELECT availablebalance FROM accounts WHERE accountid = $1',
//       [sourceAccountId]
//     );

//     if (sourceResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Source account not found' });
//     }

//     const sourceBalance = parseFloat(sourceResult.rows[0].availablebalance);
//     if (sourceBalance < paymentAmount) {
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }

//     // Verify recipient account exists
//     const recipientResult = await pool.query(
//       'SELECT accountid, username FROM accounts WHERE accountid = $1',
//       [recipientId]
//     );

//     if (recipientResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Recipient account not found' });
//     }

//     // Create transaction record in PENDING status
//     const transactionResult = await pool.query(
//       "SELECT create_trx_id($1, $2, $3)",
//       [
//         recipientId,
//         1,
//         paymentAmount
//       ]
//     );

//     const transactionId = transactionResult.rows[0].create_trx_id;

//     res.json({
//       success: true,
//       transactionId,
//       message: 'Payment initiated successfully'
//     });

//   } catch (err) {
//     console.error('Payment initiation error:', err);
//     res.status(500).json({ error: 'Failed to initiate payment' });
//   }
// };

// // NEW: Check transaction status endpoint
// export const getTransactionStatus = async (req, res) => {
//   const { transactionId } = req.params;

//   try {
//     const result = await pool.query(`
//       SELECT
//         t.*,
//         src.accountname as source_name,
//         dest.accountname as destination_name
//       FROM transaction t
//       LEFT JOIN accounts src ON t.sourceaccountid = src.accountid
//       LEFT JOIN accounts dest ON t.destinationaccountid = dest.accountid
//       WHERE t.transactionid = $1
//     `, [transactionId]);

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Transaction not found' });
//     }

//     const transaction = result.rows[0];

//     res.json({
//       status: transaction.transactionstatus,
//       transaction: {
//         id: transaction.transactionid,
//         amount: parseFloat(transaction.totalamount),
//         recipientId: transaction.destinationaccountid,
//         recipientName: transaction.destination_name,
//         completedAt: transaction.completiontimestamp,
//         reference: transaction.reference
//       }
//     });

//   } catch (err) {
//     console.error('Transaction status error:', err);
//     res.status(500).json({ error: 'Failed to get transaction status' });
//   }
// };

// // Helper function to get transaction type ID
// function getTransactionTypeId(paymentType) {
//   const typeMap = {
//     'send-money': 1111,
//     'cash-out': 3333,
//     'merchant-payment': 4444,
//     'bill-payment': 5555
//   };
//   return typeMap[paymentType] || 1111;
// }

import bcrypt from "bcrypt";

export async function get_transaction_details(req, res) {
  try {
    const trxID = req.params.id;

    if (!trxID) {
      return res.status(400).json({
        valid: false,
        message: "Transaction ID not provided",
      });
    }

    const query = `
            SELECT 
                u.transactiontypename, 
                a.username, 
                t.subamount, 
                t.feesamount, 
                t.transactionstatus,
                t.completiontimestamp
            FROM transactions t 
            JOIN transactiontype u ON t.transactiontypeid = u.transactiontypeid 
            JOIN accounts a ON t.destinationaccountid = a.accountid 
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

    // if (trx.transactiontypename !== expType) {
    //   return res.status(400).json({
    //     valid: false,
    //     message: "Invalid transaction type",
    //   });
    // }

    // if (trx.transactionstatus === "COMPLETED") {
    //   return res.status(400).json({
    //     valid: false,
    //     message: "Bill has already been paid",
    //   });
    // }

    return res.status(200).json({
      valid: true,
      transactionDetails: {
        status: trx.transactionstatus,
        recipient: trx.username,
        subamount: trx.subamount,
        feesamount: trx.feesamount,
        completed_on: !trx.completiontimestamp ? null : trx.completiontimestamp,
      },
    });
  } catch (err) {
    console.error("Error fetching transaction details:", err);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}

// export async function validateUser(req, res) {
//   try {
//     const amount = req.body.amount;

//     if (amount > req.user.availablebalance) {
//       return res.status(403).json({
//         valid: false,
//         message: "Insufficient Balance",
//       });
//     }

//     return res.status(200).json({
//       valid: true,
//       message: "User Validated",
//     });

//   } catch (error) {
//     console.error("User Validation Error", error);
//     return res.status(500).json({
//       valid: false,
//       message: "ISE",
//     });
//   }
// }

export async function finalizeTransaction(req, res) {
  try {
    const { accountid, transactionid } = req.body;
    //console.log(password+' '+transactionid+' '+req.user.accountid);
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
    const { recipientId, amount } = req.body;
    if (!amount)
      return res.status(400).json({
        valid: false,
        message: "Amount missing",
      });

    const query = `SELECT create_trx_id($1, $2, $3)`;
    const result = await pool.query(query, [recipientId, 1, amount]);
    console.log(result.rows[0]);
    return res.status(200).json({
      valid: true,
      transactionId: result.rows[0].create_trx_id,
    });
  } catch (error) {
    console.error("Error generating transaction ID:", error);
    return res.status(500).json({
      valid: false,
      message: "Internal Server Error",
    });
  }
}
