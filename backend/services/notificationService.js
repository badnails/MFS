// services/notificationService.js
import pool from "../db.js";
import socketService from "./socketService.js";

class NotificationService {
  constructor() {
    this.dbClient = null;
    this.isListening = false;
  }

  // Initialize database notification listener
  async initialize() {
    try {
      this.dbClient = await pool.connect();
      await this.dbClient.query("LISTEN new_notification");

      this.dbClient.on("notification", (msg) => {
        this.handleDatabaseNotification(msg.payload);
      });

      this.dbClient.on("error", (err) => {
        console.error("❌ Database notification client error:", err);
        this.reconnect();
      });

      this.isListening = true;
      console.log("✅ Database notification listener initialized");
    } catch (error) {
      console.error("❌ Error setting up DB notification listener:", error);
      throw error;
    }
  }

  // Handle notifications from database - simple relay
  async handleDatabaseNotification(msg) {
    try {
      const notification = JSON.parse(msg);
      console.log("📧 DB Notification received:", notification);

      // Simply relay the raw notification data to frontend
      this.relayToUser(notification);
    } catch (error) {
      console.error("❌ Error processing database notification:", error);
    }
  }

  // Relay notification data to user via socket - no processing
  async relayToUser(notification) {
    const { accountid, notificationid, notification_type, notification_data, created_at } = notification;
    
    if (accountid) {
      socketService.sendToUser(accountid, "notification", {
        notificationid,
        accountid,
        notification_type,
        notification_data,
        created_at,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get user notifications - raw data from DB
  async getUserNotifications(accountid, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          notificationid,
          accountid,
          notification_data,
          notification_type,
          read_at,
          created_at
        FROM notifications 
        WHERE accountid = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [accountid, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error("❌ Error fetching user notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const query = `
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE notificationid = $1 
        RETURNING *
      `;

      const result = await pool.query(query, [notificationId]);
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all user notifications as read
  async markAllAsRead(accountid) {
    try {
      const query = `
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE accountid = $1 AND read_at IS NULL
      `;

      await pool.query(query, [accountid]);
      return true;
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Reconnect to database on error
  async reconnect() {
    console.log("🔄 Attempting to reconnect database notification listener...");

    if (this.dbClient) {
      try {
        this.dbClient.end();
      } catch (error) {
        console.error("Error closing previous connection:", error);
      }
    }

    setTimeout(async () => {
      try {
        await this.initialize();
        console.log("✅ Database notification listener reconnected");
      } catch (error) {
        console.error("❌ Failed to reconnect, retrying in 5 seconds...");
        this.reconnect();
      }
    }, 5000);
  }

  // Cleanup
  async cleanup() {
    if (this.dbClient) {
      try {
        await this.dbClient.query("UNLISTEN new_notification");
        this.dbClient.end();
        this.isListening = false;
        console.log("✅ Notification service cleaned up");
      } catch (error) {
        console.error("❌ Error during cleanup:", error);
      }
    }
  }
}

// Export singleton instance
export default new NotificationService();
