// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService.js';
import { ChartNoAxesColumnDecreasing } from 'lucide-react';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Update state when notifications change
  const handleNotificationUpdate = useCallback((data) => {
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Initialize notification service
    notificationService.initialize(userId);
    
    // Subscribe to updates
    const unsubscribe = notificationService.addListener(handleNotificationUpdate);
    
    // Set initial state
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    setLoading(false);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [userId, handleNotificationUpdate]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await notificationService.loadNotifications(userId);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };
};
