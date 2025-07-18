// routes/notificationRoutes.js
import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      userId, 
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
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await notificationService.markAllAsRead(userId);
    
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

// Create a new notification (admin/system use)
router.post('/', async (req, res) => {
  try {
    const { recipientId, message, type = 'info', data = {} } = req.body;
    
    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        error: 'recipientId and message are required'
      });
    }
    
    const notification = await notificationService.createNotification(
      recipientId,
      message,
      type,
      data
    );
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// Create bulk notifications
router.post('/bulk', async (req, res) => {
  try {
    const { recipientIds, message, type = 'info', data = {} } = req.body;
    
    if (!recipientIds || !Array.isArray(recipientIds) || !message) {
      return res.status(400).json({
        success: false,
        error: 'recipientIds (array) and message are required'
      });
    }
    
    const notifications = await notificationService.createBulkNotification(
      recipientIds,
      message,
      type,
      data
    );
    
    res.status(201).json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk notifications'
    });
  }
});

export default router;
