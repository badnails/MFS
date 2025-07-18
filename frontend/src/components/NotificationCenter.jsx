// components/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { Bell, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { useAuth } from '../context/AuthContext.jsx';
import socketService from '../services/socketService.js';

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

  // Monitor socket connection status
  useEffect(() => {
    const checkStatus = () => {
      setSocketStatus(socketService.getConnectionStatus());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      await markAsRead(notification.notificationid);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
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
      case 'DEBIT':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'CREDIT':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      default:
        return '📧';
    }
  };

  const getNotificationBgColor = (type, isRead) => {
    const baseColor = isRead ? 'bg-gray-50' : 'bg-blue-50';
    switch (type) {
      case 'DEBIT':
        return isRead ? 'bg-red-50' : 'bg-red-100';
      case 'CREDIT':
        return isRead ? 'bg-green-50' : 'bg-green-100';
      default:
        return baseColor;
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
              notifications.map((notification) => (
                <div
                  key={notification.notificationid}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors last:border-b-0 ${getNotificationBgColor(
                    notification.notification_type,
                    notification.read_at
                  )}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.transactiontype && (
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          Method: {notification.transactiontype}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp || notification.created_at)}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
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
