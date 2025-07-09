// src/routes/merchantRoutes.js
import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { 
  getMerchantDashboard, 
  getTodayStats, 
  createBill, 
  getPendingBills, 
  updateBillStatus, 
  getMerchantTransactions 
} from '../controllers/merchantController.js';

const router = express.Router();

// Merchant dashboard and stats
router.get('/dashboard', authenticateJWT, getMerchantDashboard);
router.get('/stats/today', authenticateJWT, getTodayStats);

// Bill management
router.post('/create-bill', authenticateJWT, createBill);
router.get('/pending-bills', authenticateJWT, getPendingBills);
router.put('/update-bill-status/:billId', authenticateJWT, updateBillStatus);

// Transaction history
router.get('/transactions', authenticateJWT, getMerchantTransactions);

export default router;
