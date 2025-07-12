
// src/routes/transactionRoutes.js
import express from 'express';
import { 
  // makeTransfer, 
  verifyAccount, 
  // initiatePayment, 
  // getTransactionStatus, 
  generate_trx_id,
  get_transaction_details,
  finalizeTransaction
} from '../controllers/transactionController.js';
import { authenticateJWT } from '../controllers/authController.js';

const router = express.Router();

// Existing routes
// router.post('/transferBalance', authenticateJWT, makeTransfer);
// router.post('/transfer', authenticateJWT, makeTransfer);

// NEW: Separate verification and payment routes
router.get('/verify-customer/:accountId', authenticateJWT, verifyAccount);
router.post('/initiate', authenticateJWT, generate_trx_id);
router.get('/details/:id', get_transaction_details);
router.post('/finalize-transaction', finalizeTransaction)

export default router;
