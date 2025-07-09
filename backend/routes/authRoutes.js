import express from 'express';
import { loginUser_AccPass, loginUser_OTP, signupUser, availableUsernames } from '../controllers/authController.js';

const router = express.Router();

// Matches your original routes
router.post('/loginUserInit', loginUser_AccPass); // POST /auth/loginUserInit
router.post('/loginUserFin', loginUser_OTP);      // POST /auth/loginUserFin
router.post('/signup', signupUser);     
router.get('/check-username/:username', availableUsernames);

export default router;
