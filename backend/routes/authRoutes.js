import express from 'express';
import { loginUser_AccPass, loginUser_OTP, signupUser } from '../controllers/pagesController.js';

const router = express.Router();

// Matches your original routes
router.post('/loginUserInit', loginUser_AccPass); // POST /auth/loginUserInit
router.post('/loginUserFin', loginUser_OTP);      // POST /auth/loginUserFin
router.post('/signup', signupUser);               // POST /auth/signup

export default router;
