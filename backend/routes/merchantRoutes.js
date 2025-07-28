// src/routes/merchantRoutes.js
import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { 
  getMerchantDashboard, 
  getTodayStats, 
  createBill
} from '../controllers/merchantController.js';

const router = express.Router();

// Merchant dashboard and stats
router.get('/dashboard', authenticateJWT, getMerchantDashboard);
router.get('/stats/today', authenticateJWT, getTodayStats);

// Bill management
router.post('/create-bill', authenticateJWT, createBill);

export default router;
