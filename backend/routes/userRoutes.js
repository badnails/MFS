import express from 'express';
import { getHomePage, validateAccount, getBalance } from '../controllers/pagesController.js';

const router = express.Router();

// Matches both POST and GET homepage from original
router.post('/homepage', getHomePage);   // POST /user/homepage
router.get('/homepage', getHomePage);    // GET  /user/homepage
router.post('/validate-account', validateAccount);
router.get('/balance', getBalance);

export default router;
