
// src/routes/transactionRoutes.js
import express from 'express';
import { 
  makeTransfer, 
  verifyAccount, 
  initiatePayment, 
  getTransactionStatus 
} from '../controllers/transactionController.js';
import { authenticateJWT } from '../controllers/authController.js';

const router = express.Router();

// Existing routes
router.post('/transferBalance', authenticateJWT, makeTransfer);
router.post('/transfer', authenticateJWT, makeTransfer);

// NEW: Separate verification and payment routes
router.get('/verify-customer/:accountId', authenticateJWT, verifyAccount);
router.post('/initiate', authenticateJWT, initiatePayment);
router.get('/status/:transactionId', getTransactionStatus);

export default router;
