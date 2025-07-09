import express from 'express';
import { getAssignBillPage, postAssignBill } from '../controllers/billerController.js';

const router = express.Router();

// Matches your original bill routes
router.get('/assignbill', getAssignBillPage);   // GET /biller/assignbill
router.post('/assignbill', postAssignBill);     // POST /biller/assignbill

export default router;
