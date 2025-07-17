import express from 'express';
import { assignBills, createBillBatch,  getBatches,  getBillerDashboard, getBillerStatsToday } from '../controllers/billerController.js';
import { authenticateJWT } from '../controllers/authController.js';

const router = express.Router();

// Matches your original bill routes
// router.get('/assignbill', getAssignBillPage);   // GET /biller/assignbill
// router.post('/assignbill', postAssignBill);     // POST /biller/assignbill
router.get('/dashboard', authenticateJWT, getBillerDashboard);
router.get('/stats/today', authenticateJWT, getBillerStatsToday);


router.post('/createbatch', authenticateJWT, createBillBatch);
router.post('/assignbills', authenticateJWT, assignBills);
router.get('/batches', authenticateJWT, getBatches);


export default router;
