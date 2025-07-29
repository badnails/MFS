// components/NotificationCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useAuth } from '../../context/AuthContext.jsx';
import socketService from '../../services/socketService.js';
import notificationFormatter from '../../utils/notificationFormatter.js';

const NotificationCenter = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications(user?.accountid);
  
  const [isOpen, setIsOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState({ isConnected: false });
  const [detailedNotifications, setDetailedNotifications] = useState({});

  // Monitor socket connection status
  useEffect(() => {
    const checkStatus = () => {
      setSocketStatus(socketService.getConnectionStatus());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Load detailed messages when notification center is opened
  const loadDetailedMessages = useCallback(async () => {
    const transactionNotifications = notifications.filter(n => 
      (n.type === 'TRX_CREDIT' || n.type === 'TRX_DEBIT') && 
      n.data?.transactionid &&
      !detailedNotifications[n.notificationid]
    );

    if (transactionNotifications.length === 0) return;

          const detailed = {};
          await Promise.all(
            transactionNotifications.map(async (notification) => {
              try {
                const transactionDetails = await notificationFormatter.getTransactionDetails(
                  notification.data.transactionid
                );
                if (transactionDetails) {
                  detailed[notification.notificationid] = {
                    ...notification,
                    message: notificationFormatter.createMessage(notification.type, transactionDetails),
                    transactionDetails,
                    fee: parseFloat(transactionDetails.feesamount || 0),
                    formattedTransactionType: notificationFormatter.formatTransactionType(transactionDetails.type)
                  };
                }
              } catch (error) {
                console.error('Error loading detailed notification:', error);
              }
            })
          );    setDetailedNotifications(prev => ({ ...prev, ...detailed }));
  }, [notifications, detailedNotifications]);

  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      loadDetailedMessages();
    }
  }, [isOpen, notifications.length, loadDetailedMessages]);

  const getDisplayNotification = (notification) => {
    const detailed = detailedNotifications[notification.notificationid];
    if (detailed) {
      // Merge the current notification state (especially read_at) with detailed data
      // This ensures UI updates immediately when notifications are marked as read
      return {
        ...detailed,
        read_at: notification.read_at, // Always use current read status
        timestamp: notification.timestamp,
        created_at: notification.created_at
      };
    }
    return notification;
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read_at) {
        // Mark as read - the notification service will update the main notifications array
        await markAsRead(notification.notificationid);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TRX_CREDIT':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'TRX_DEBIT':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      default:
        return '📧';
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    if (isRead) {
      // Read notifications - subtle backgrounds
      switch (type) {
        case 'TRX_DEBIT':
          return 'bg-red-50/30 border-l-4 border-red-200';
        case 'TRX_CREDIT':
          return 'bg-green-50/30 border-l-4 border-green-200';
        default:
          return 'bg-gray-50/30 border-l-4 border-gray-200';
      }
    } else {
      // Unread notifications - more prominent backgrounds
      switch (type) {
        case 'TRX_DEBIT':
          return 'bg-red-50 border-l-4 border-red-400';
        case 'TRX_CREDIT':
          return 'bg-green-50 border-l-4 border-green-400';
        default:
          return 'bg-blue-50 border-l-4 border-blue-400';
      }
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] sm:max-w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              Notifications
              {/* Connection Status Indicator */}
              <div className={`ml-2 w-2 h-2 rounded-full ${socketStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={socketStatus.isConnected ? 'Connected' : 'Disconnected'}></div>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={refreshNotifications}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const displayNotification = getDisplayNotification(notification);
                const isLast = index === notifications.length - 1;
                return (
                  <div
                    key={notification.notificationid}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50/50 cursor-pointer transition-all duration-200 ${
                      !isLast ? 'border-b border-gray-150' : ''
                    } ${getNotificationBgColor(
                      displayNotification.type,
                      displayNotification.read_at
                    )} hover:shadow-sm`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg flex-shrink-0 mt-1">
                        {getNotificationIcon(displayNotification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${
                          displayNotification.read_at ? 'text-gray-700' : 'text-gray-900 font-medium'
                        }`}>
                          {displayNotification.message}
                        </p>
                        
                        {/* Transaction Type - Show for transaction notifications */}
                        {(displayNotification.type === 'TRX_CREDIT' || displayNotification.type === 'TRX_DEBIT') && 
                         displayNotification.formattedTransactionType && (
                          <p className="text-xs text-gray-500 mt-1.5 font-normal">
                            {displayNotification.formattedTransactionType}
                          </p>
                        )}
                        
                        {/* Legacy transaction type display (fallback) */}
                        {displayNotification.transactiontype && !displayNotification.formattedTransactionType && (
                          <p className="text-xs text-gray-500 mt-1.5 font-normal">
                            {notificationFormatter.formatTransactionType(displayNotification.transactiontype)}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(displayNotification.timestamp || displayNotification.created_at)}
                        </p>
                      </div>
                      {!displayNotification.read_at && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2 shadow-sm" title="Unread"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center sticky bottom-0 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationCenter;
