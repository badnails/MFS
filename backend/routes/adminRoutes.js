import express from 'express';
import { authenticateJWT } from '../controllers/authController.js';
import { updateBalance } from '../controllers/admin/BalanceUpdate.js';
import { getSummary } from '../controllers/admin/Summary.js';
import { getAllData } from '../controllers/admin/allData.js';
const router = express.Router();

router.post('/balanceupdate', authenticateJWT, updateBalance);

router.get('/accountsummary', authenticateJWT, getSummary);
router.get('/alldata', authenticateJWT, getAllData);



export default router;