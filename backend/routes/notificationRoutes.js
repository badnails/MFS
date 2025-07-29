// routes/notificationRoutes.js
import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/:accountid', async (req, res) => {
  try {
    const { accountid } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      accountid, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await notificationService.markAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all user notifications as read
router.patch('/user/:accountid/read-all', async (req, res) => {
  try {
    const { accountid } = req.params;
    
    const result = await notificationService.markAllAsRead(accountid);
    
    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

export default router;
