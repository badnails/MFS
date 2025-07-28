import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { updateBalance } from '../controllers/admin/BalanceUpdate.js';
import { getSummary } from '../controllers/admin/Summary.js';
import { getAllData } from '../controllers/admin/allData.js';
import { getAllTransactions } from '../controllers/admin/allTransactions.js';
import { 
  getTransactionVolume, 
  getTransactionStatusDistribution, 
  getAuthenticationData 
} from '../controllers/admin/analyticsController.js';

const router = express.Router();

router.post('/balanceupdate', authenticateJWT, updateBalance);

router.get('/accountsummary', authenticateJWT, getSummary);
router.get('/alldata', authenticateJWT, getAllData);
router.get('/transactions', authenticateJWT, getAllTransactions);

// Analytics routes
router.get('/analytics/transactions/volume', authenticateJWT, getTransactionVolume);
router.get('/analytics/transactions/status', authenticateJWT, getTransactionStatusDistribution);
router.get('/analytics/authentication', authenticateJWT, getAuthenticationData);

export default router;