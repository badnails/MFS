import express from 'express';
import { getHomePage, validateAccount, getBalance, searchAccounts, get_notifications, getBills, getBillBatches, getBillFields, searchBills, linkBillTransaction} from '../controllers/userController.js';
import { authenticateJWT } from '../controllers/authController.js';
import { getUserBalance } from '../controllers/userController.js';

const router = express.Router();

// Matches both POST and GET homepage from original
router.post('/homepage', authenticateJWT, getHomePage);   // POST /user/homepage
router.get('/homepage',authenticateJWT, getHomePage);    // GET  /user/homepage
router.get('/validate-account/:accountid',authenticateJWT, validateAccount);
router.get('/assigned/:accountid',authenticateJWT, getBills);

router.get('/balance/:id', authenticateJWT, getBalance);
router.get('/balance', authenticateJWT, getBalance);
router.get('/accountsearch', authenticateJWT, searchAccounts);
router.get('/notifications', authenticateJWT, get_notifications);
router.get('/billbatches/:billerid', authenticateJWT, getBillBatches);
router.get('/billfields/:batchid', authenticateJWT, getBillFields);
router.post('/searchbills', authenticateJWT, searchBills);
router.post('/linkbilltransaction', authenticateJWT, linkBillTransaction);

export default router;
