import express from 'express';
import { PassCheck, LoginOTPCheck, signupUser, availableUsernames, userBlockCheck } from '../controllers/authController.js';

const router = express.Router();

// Matches your original routes
router.post('/PassCheck', PassCheck);
router.post('/OTPCheck', LoginOTPCheck);      // POST /auth/loginUserFin
router.post('/signup', signupUser);     
router.get('/check-username/:username', availableUsernames);
router.get('/check-user-block/:username', userBlockCheck);

export default router;
