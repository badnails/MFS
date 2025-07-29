// services/notificationService.js
import { toast } from 'react-toastify';
import socketService from './socketService.js';
import axios from 'axios';
import { triggerReload } from '../hooks/useDataReload';
import notificationFormatter from '../utils/notificationFormatter.js';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
    this.listeners = new Set();
  }

  // Initialize notification service
  initialize(userId) {
    if (this.isInitialized) {
      console.log('Notification service already initialized');
      return;
    }

    // Connect socket and listen for notifications
    socketService.connect(userId);
    this.setupSocketListeners();
    
    // Load existing notifications
    this.loadNotifications(userId);
    
    this.isInitialized = true;
  }

  // Setup socket listeners for notifications
  setupSocketListeners() {
    socketService.on('notification', (data) => {
      // Handle async notification processing
      this.handleIncomingNotification(data).catch(error => {
        console.error('Error handling socket notification:', error);
      });
    });

    socketService.on('connect', () => {
      console.log('📡 Notification service connected to socket');
    });

    socketService.on('disconnect', () => {
      console.log('📡 Notification service disconnected from socket');
    });
  }

  // Handle incoming notifications from backend (raw data)
  async handleIncomingNotification(data) {
    
    try {
      // Format the raw notification data (now synchronous)
      const formattedNotification = notificationFormatter.formatNotification(data);
      
      // Add to local notifications array
      this.notifications.unshift(formattedNotification);
      this.unreadCount++;

      // For transaction notifications, fetch details and show toast
      if (formattedNotification.type === 'TRX_CREDIT' || formattedNotification.type === 'TRX_DEBIT') {
        this.handleTransactionNotification(formattedNotification);
      } else {
        // For non-transaction notifications, show basic toast
        this.showToast(formattedNotification);
      }

      // Notify all listeners
      this.notifyListeners();

      // Trigger data reload for non-error notifications
      if (formattedNotification.type !== 'error') {
        triggerReload();
      }
    } catch (error) {
      console.error('❌ Error handling incoming notification:', error);
      
      // Fallback: create a basic notification
      const fallbackNotification = {
        id: data.notificationid || Date.now(),
        notificationid: data.notificationid,
        accountid: data.accountid,
        type: data.notification_type || 'info',
        data: data.notification_data || {},
        timestamp: data.created_at || new Date().toISOString(),
        created_at: data.created_at,
        read_at: data.read_at,
        message: 'New notification received',
        read: false
      };

      this.notifications.unshift(fallbackNotification);
      this.unreadCount++;
      this.showToast(fallbackNotification);
      this.notifyListeners();
    }
  }

  // Handle transaction notifications with detail fetching
  async handleTransactionNotification(notification) {
    try {
      const transactionId = notification.data?.transactionid;
      
      if (transactionId) {
        // Fetch transaction details for toast
        const transactionDetails = await notificationFormatter.getTransactionDetails(transactionId);
        
        if (transactionDetails) {
          // Update notification with detailed message
          const detailedMessage = notificationFormatter.createMessage(
            notification.type,
            transactionDetails
          );
          
          // Update the notification in the array
          const notificationIndex = this.notifications.findIndex(n => 
            n.notificationid === notification.notificationid
          );
          
          if (notificationIndex !== -1) {
            this.notifications[notificationIndex] = {
              ...this.notifications[notificationIndex],
              message: detailedMessage,
              transactionDetails
            };
          }

          // Show toast with detailed message
          this.showToast({
            ...notification,
            message: detailedMessage
          });
        } else {
          // Fallback to basic toast if details fetch failed
          this.showToast(notification);
        }
      } else {
        // No transaction ID, show basic toast
        this.showToast(notification);
      }
    } catch (error) {
      console.error('❌ Error handling transaction notification:', error);
      // Fallback to basic toast
      this.showToast(notification);
    }
  }

  // Show toast notification
  showToast(notification) {
    const toastOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (notification.type) {
      case 'TRX_CREDIT':
        toast.success(notification.message, toastOptions);
        break;
      case 'TRX_DEBIT':
        toast.success(notification.message, toastOptions);
        break;
      case 'error':
        toast.error(notification.message, toastOptions);
        break;
      case 'warning':
        toast.warning(notification.message, toastOptions);
        break;
      default:
        toast.info(notification.message, toastOptions);
    }
  }

  // Load notifications from server
  async loadNotifications(userId, limit = 50) {
    try {
      const response = await axios.get(`/notifications/${userId}?limit=${limit}`);
      
      if (response.data.success) {
        // Simple formatting for existing notifications - no heavy processing
        const formattedNotifications = response.data.data.map(notification => 
          notificationFormatter.formatNotification(notification)
        );
        
        this.notifications = formattedNotifications;
        this.unreadCount = this.notifications.filter(n => !n.read_at).length;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state - look for both id and notificationid
        const notification = this.notifications.find(n => 
          n.id === notificationId || n.notificationid === notificationId
        );
        
        if (notification && !notification.read_at) {
          notification.read_at = new Date().toISOString();
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.notifyListeners();
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const response = await axios.patch(`/notifications/user/${userId}/read-all`);
      
      if (response.data.success) {
        // Update local state
        this.notifications.forEach(notification => {
          if (!notification.read_at) {
            notification.read_at = new Date().toISOString();
          }
        });
        this.unreadCount = 0;
        this.notifyListeners();
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Add listener for notification updates
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of updates
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
      } catch (error) {
        console.error('Error calling notification listener:', error);
      }
    });
  }

  // Cleanup
  cleanup() {
    socketService.disconnect();
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export default new NotificationService();
