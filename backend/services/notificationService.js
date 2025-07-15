// services/notificationService.js
import pool from '../db.js';
import socketService from './socketService.js';

class NotificationService {
  constructor() {
    this.dbClient = null;
    this.isListening = false;
  }

  // Initialize database notification listener
  async initialize() {
    try {
      this.dbClient = await pool.connect();
      await this.dbClient.query('LISTEN new_notification');
      
      this.dbClient.on('notification', (msg) => {
        this.handleDatabaseNotification(msg);
      });

      this.dbClient.on('error', (err) => {
        console.error('❌ Database notification client error:', err);
        this.reconnect();
      });

      this.isListening = true;
      console.log('✅ Database notification listener initialized');
    } catch (error) {
      console.error('❌ Error setting up DB notification listener:', error);
      throw error;
    }
  }

  // Handle notifications from database
  handleDatabaseNotification(msg) {
    try {
      const payload = JSON.parse(msg.payload);
      console.log('📧 DB Notification received:', payload);

      // Send notification via socket
      this.sendSocketNotification(payload);
      
      // You can add other notification channels here (email, SMS, etc.)
      // this.sendEmailNotification(payload);
      // this.sendSMSNotification(payload);
    } catch (error) {
      console.error('❌ Error processing database notification:', error);
    }
  }

  // Send notification via socket
  sendSocketNotification(payload) {
    const { recipient_id, message, type, data } = payload;
    
    if (recipient_id) {
      socketService.sendToUser(recipient_id, 'notification', {
        message,
        type: type || 'info',
        data: data || {},
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create and send notification
  async createNotification(recipientId, message, type = 'info', additionalData = {}) {
    try {
      // Insert notification into database
      const query = `
        INSERT INTO notifications (recipient_id, message, type, data, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const values = [recipientId, message, type, JSON.stringify(additionalData)];
      const result = await pool.query(query, values);
      
      // Send via socket immediately
      this.sendSocketNotification({
        recipient_id: recipientId,
        message,
        type,
        data: additionalData
      });

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async createBulkNotification(recipientIds, message, type = 'info', additionalData = {}) {
    try {
      const notifications = await Promise.all(
        recipientIds.map(id => this.createNotification(id, message, type, additionalData))
      );
      
      return notifications;
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM notifications 
        WHERE recipient_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const query = `
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await pool.query(query, [notificationId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all user notifications as read
  async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE recipient_id = $1 AND read_at IS NULL
        RETURNING COUNT(*)
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Reconnect to database on error
  async reconnect() {
    console.log('🔄 Attempting to reconnect database notification listener...');
    
    if (this.dbClient) {
      try {
        this.dbClient.end();
      } catch (error) {
        console.error('Error closing previous connection:', error);
      }
    }

    setTimeout(async () => {
      try {
        await this.initialize();
        console.log('✅ Database notification listener reconnected');
      } catch (error) {
        console.error('❌ Failed to reconnect, retrying in 5 seconds...');
        this.reconnect();
      }
    }, 5000);
  }

  // Cleanup
  async cleanup() {
    if (this.dbClient) {
      try {
        await this.dbClient.query('UNLISTEN new_notification');
        this.dbClient.end();
        this.isListening = false;
        console.log('✅ Notification service cleaned up');
      } catch (error) {
        console.error('❌ Error during cleanup:', error);
      }
    }
  }
}

// Export singleton instance
export default new NotificationService();
