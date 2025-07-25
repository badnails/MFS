import express from 'express';
import { getHomePage, validateAccount, getBalance, searchAccounts, get_notifications, getBills, getProfileData, updateProfileField, uploadProfilePicture, getProfilePicture, deleteProfilePicture, uploadMiddleware} from '../controllers/userController.js';
import { authenticateJWT } from '../controllers/authController.js';
import { getUserBalance } from '../controllers/userController.js';

const router = express.Router();

// Matches both POST and GET homepage from original
router.post('/homepage', authenticateJWT, getHomePage);   // POST /user/homepage
router.get('/homepage',authenticateJWT, getHomePage);    // GET  /user/homepage
router.get('/validate-account/:accountid',authenticateJWT, validateAccount);
router.get('/assigned/:accountid',authenticateJWT, getBills);

router.get('/balance', authenticateJWT, getBalance);
router.get('/accountsearch', authenticateJWT, searchAccounts);
router.get('/notifications', authenticateJWT, get_notifications);
router.get('/profileData/:accountid', authenticateJWT, getProfileData);
router.put('/updateProfile',authenticateJWT, updateProfileField);

// Profile picture routes
router.post('/uploadProfilePicture', authenticateJWT, uploadMiddleware, uploadProfilePicture);
router.get('/profilePicture/:accountid', getProfilePicture); // Public endpoint for viewing pictures
router.delete('/deleteProfilePicture', authenticateJWT, deleteProfilePicture);

//router.get('/balance', authenticateJWT, getUserBalance);

export default router;
