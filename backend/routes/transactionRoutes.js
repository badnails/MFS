import express from 'express';
import { makeTransfer } from '../controllers/pagesController.js';

const router = express.Router();

// Matches both routes
router.post('/transferBalance', makeTransfer); // POST /transaction/transferBalance
router.post('/transfer', makeTransfer);        // POST /transaction/transfer

export default router;
