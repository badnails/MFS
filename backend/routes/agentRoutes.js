// src/routes/agentRoutes.js
import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { 
  getAgentDashboard, 
  getTodayStats, 
  verifyCustomer, 
  processCashIn, 
  processCashOut, 
  getAgentTransactions,
  submitFloatRequest,
  getFloatRequests,
  getFloatRequestDocument,
  uploadMiddleware
} from '../controllers/agentController.js';

const router = express.Router();

// Agent dashboard and stats
router.get('/dashboard', authenticateJWT, getAgentDashboard);
router.get('/stats/today', authenticateJWT, getTodayStats);

// Customer verification
router.get('/verify-customer/:accountId', authenticateJWT, verifyCustomer);

// Cash in/out operations
router.post('/cash-in', authenticateJWT, processCashIn);
router.post('/cash-out', authenticateJWT, processCashOut);

// Transaction history
router.get('/transactions', authenticateJWT, getAgentTransactions);

// Float request management
router.post('/add-money-request', authenticateJWT, uploadMiddleware, submitFloatRequest);
router.get('/float-requests', authenticateJWT, getFloatRequests);
router.get('/float-request-document/:requestId', authenticateJWT, getFloatRequestDocument);

export default router;
