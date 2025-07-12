import express from 'express';
import { getHomePage, validateAccount, getBalance, searchAccounts, get_notifications } from '../controllers/userController.js';
import { authenticateJWT } from '../controllers/authController.js';
import { getUserBalance } from '../controllers/userController.js';

const router = express.Router();

// Matches both POST and GET homepage from original
router.post('/homepage', authenticateJWT, getHomePage);   // POST /user/homepage
router.get('/homepage',authenticateJWT, getHomePage);    // GET  /user/homepage
router.get('/validate-account/:accountid',authenticateJWT, validateAccount);
router.get('/balance', authenticateJWT, getBalance);
router.get('/accountsearch', authenticateJWT, searchAccounts);
router.get('/notifications', authenticateJWT, get_notifications)
//router.get('/balance', authenticateJWT, getUserBalance);

export default router;
