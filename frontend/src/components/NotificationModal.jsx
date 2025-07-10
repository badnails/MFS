
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const NotificationModal = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/user/notifications').then(res => {
      setNotifications(res.data.notifications || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Notifications</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : notifications.length === 0 ? (
          <div>No notifications found.</div>
        ) : (
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map(n => (
              <li key={n.notificationid} className={`p-3 rounded ${n.isread ? 'bg-gray-100' : 'bg-blue-50'}`}>
                <div className="font-medium">{n.notificationbody}</div>
                <div className="text-xs text-gray-500">Type: {n.notificationtypeid}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
