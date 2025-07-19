// services/notificationService.js
import { toast } from 'react-toastify';
import socketService from './socketService.js';
import axios from 'axios';
import { triggerReload } from '../hooks/useDataReload';
import { ChartNoAxesColumnDecreasing } from 'lucide-react';

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
    console.log('✅ Notification service initialized');
  }

  // Setup socket listeners for notifications
  setupSocketListeners() {
    socketService.on('notification', (data) => {
      this.handleIncomingNotification(data);
    });

    socketService.on('connect', () => {
      console.log('📡 Notification service connected to socket');
    });

    socketService.on('disconnect', () => {
      console.log('📡 Notification service disconnected from socket');
    });
  }

  // Handle incoming notifications
  handleIncomingNotification(data) {
    const notification = {
      id: data.id,
      message: data.message,
      type: data.type || 'info',
      data: data.data || {},
      timestamp: data.timestamp || new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(notification);
    this.unreadCount++;

    // Show toast notification
    this.showToast(notification);

    // Notify all listeners
    this.notifyListeners();

    // Trigger data reload
    if (notification.type !== 'error') {
      triggerReload();
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
      case 'CREDIT':
        toast.success(notification.message, toastOptions);
        break;
      case 'DEBIT':
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
        this.notifications = response.data.data;
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
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
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

  // Send custom notification (for testing or internal use)
  sendCustomNotification(message, type = 'info', data = {}) {
    this.handleIncomingNotification({
      message,
      type,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup
  cleanup() {
    socketService.disconnect();
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners.clear();
    this.isInitialized = false;
    console.log('✅ Notification service cleaned up');
  }
}

// Export singleton instance
export default new NotificationService();
