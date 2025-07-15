// components/NotificationTest.jsx
import React from 'react';
import notificationService from '../services/notificationService.js';

const NotificationTest = () => {
  const sendTestNotification = () => {
    notificationService.sendCustomNotification(
      'This is a test notification!',
      'info'
    );
  };

  const sendSuccessNotification = () => {
    notificationService.sendCustomNotification(
      'Transaction completed successfully!',
      'success',
      { transactionId: 'test123', amount: 100 }
    );
  };

  const sendErrorNotification = () => {
    notificationService.sendCustomNotification(
      'Something went wrong!',
      'error'
    );
  };

  const sendWarningNotification = () => {
    notificationService.sendCustomNotification(
      'Your balance is running low',
      'warning'
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        🧪 Notification System Test
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Use these buttons to test the notification system. You should see both toast notifications and updates in the notification center.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={sendTestNotification}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          📧 Info
        </button>
        
        <button
          onClick={sendSuccessNotification}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          ✅ Success
        </button>
        
        <button
          onClick={sendErrorNotification}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          ❌ Error
        </button>
        
        <button
          onClick={sendWarningNotification}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          ⚠️ Warning
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
        <strong>Note:</strong> In production, notifications will come from the database via Socket.IO. 
        These test buttons simulate that behavior for development purposes.
      </div>
    </div>
  );
};

export default NotificationTest;
