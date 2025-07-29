import express from 'express';
import { createBillBatch, getBatches, updateBillBatch, getBillerDashboard, getBillerStats, checkBatchNameAvailability, getBillFields, createBills } from '../controllers/billerController.js';
import { authenticateJWT } from '../controllers/authController.js';
import { getBillsData } from '../controllers/admin/analyticsController.js';

const router = express.Router();

// Matches your original bill routes
// router.get('/assignbill', getAssignBillPage);   // GET /biller/assignbill
// router.post('/assignbill', postAssignBill);     // POST /biller/assignbill
router.get('/dashboard', authenticateJWT, getBillerDashboard);
router.get('/stats', authenticateJWT, getBillerStats);

// Bill batch routes
router.get('/bill-batches', authenticateJWT, getBatches);
router.put('/bill-batches/:id', authenticateJWT, updateBillBatch);
router.post('/createbatch', authenticateJWT, createBillBatch);
router.get('/check-batch-name/:batchname', authenticateJWT, checkBatchNameAvailability);
router.get('/bill-fields/:batchid', authenticateJWT, getBillFields);
router.post('/create-bills/:batchid', authenticateJWT, createBills);

// Analytics routes for billers
router.get('/analytics/bills/:accountId', authenticateJWT, getBillsData);

export default router;
