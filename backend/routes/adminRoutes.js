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
import { 
  getAllFloatRequests, 
  updateFloatRequestStatus, 
  getFloatRequestDocument 
} from '../controllers/admin/floatRequestsController.js';

const router = express.Router();

router.post('/balanceupdate', authenticateJWT, updateBalance);

router.get('/accountsummary', authenticateJWT, getSummary);
router.get('/alldata', authenticateJWT, getAllData);
router.get('/transactions', authenticateJWT, getAllTransactions);

// Analytics routes
router.get('/analytics/transactions/volume', authenticateJWT, getTransactionVolume);
router.get('/analytics/transactions/status', authenticateJWT, getTransactionStatusDistribution);
router.get('/analytics/authentication', authenticateJWT, getAuthenticationData);
// Float requests management
router.get('/float-requests', authenticateJWT, getAllFloatRequests);
router.put('/float-request/:requestId/status', authenticateJWT, updateFloatRequestStatus);
router.get('/float-request-document/:requestId', authenticateJWT, getFloatRequestDocument);

export default router;