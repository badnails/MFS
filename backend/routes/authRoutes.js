import express from 'express';
import { PassCheck, LoginOTPCheck, signupUser, availableUsernames, userBlockCheck, completeAccountSetup, checkEmail, checkPhoneNumber, regenerateTOTP } from '../controllers/authController.js';

const router = express.Router();

// Matches your original routes
router.post('/PassCheck', PassCheck);
router.post('/OTPCheck', LoginOTPCheck);      // POST /auth/loginUserFin
router.post('/signup', signupUser);     
router.get('/check-username/:username', availableUsernames);
router.get('/check-email/:email', checkEmail);
router.get('/check-phone/:phone', checkPhoneNumber);
router.get('/check-user-block/:username', userBlockCheck);

router.post('/complete-account-setup', completeAccountSetup);
router.post('/regenerate-totp', regenerateTOTP);

export default router;
