# Notification System

This document explains the separated Socket.IO and notification handling system.

## Backend Architecture

### Services

#### 1. SocketService (`services/socketService.js`)
- Manages WebSocket connections
- Handles user registration and disconnection
- Provides methods for sending messages to specific users or broadcasting
- Tracks connected users
- Handles reconnection logic

#### 2. NotificationService (`services/notificationService.js`)
- Manages database notifications using PostgreSQL LISTEN/NOTIFY
- Creates and stores notifications in the database
- Sends real-time notifications via SocketService
- Provides APIs for notification management (read, mark as read, etc.)
- Handles notification persistence and retrieval

### Routes

#### NotificationRoutes (`routes/notificationRoutes.js`)
- `GET /notifications/:userId` - Get user notifications
- `PATCH /notifications/:notificationId/read` - Mark notification as read
- `PATCH /notifications/user/:userId/read-all` - Mark all user notifications as read
- `POST /notifications` - Create a new notification
- `POST /notifications/bulk` - Create bulk notifications

### Database Setup

Run the SQL script in `sql/notifications.sql` to create the necessary table and triggers:

```sql
psql -d your_database -f sql/notifications.sql
```

## Frontend Architecture

### Services

#### 1. SocketService (`services/socketService.js`)
- Handles WebSocket connection to the backend
- Manages connection state and reconnection logic
- Provides event subscription and emission methods
- Singleton service for consistent connection management

#### 2. NotificationService (`services/notificationService.js`)
- Manages notification state on the frontend
- Handles incoming notifications from WebSocket
- Shows toast notifications using react-toastify
- Provides notification persistence and management
- Exposes listener pattern for components to subscribe to changes

### Hooks

#### useNotifications (`hooks/useNotifications.js`)
React hook that provides:
- `notifications` - Array of all notifications
- `unreadCount` - Number of unread notifications
- `loading` - Loading state
- `markAsRead(id)` - Mark specific notification as read
- `markAllAsRead()` - Mark all notifications as read
- `refreshNotifications()` - Refresh notifications from server

### Components

#### NotificationCenter (`components/NotificationCenter.jsx`)
A complete notification UI component that includes:
- Notification bell icon with unread count badge
- Dropdown with notification list
- Mark as read functionality
- Real-time updates

## Usage Examples

### Backend - Sending Notifications

```javascript
import notificationService from './services/notificationService.js';

// Send a notification to a specific user
await notificationService.createNotification(
  'user123',
  'Your transaction was successful!',
  'success',
  { transactionId: 'txn123', amount: 100 }
);

// Send bulk notifications
await notificationService.createBulkNotification(
  ['user1', 'user2', 'user3'],
  'System maintenance scheduled',
  'warning'
);
```

### Frontend - Using Notifications

```jsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications(user?.accountid);

  return (
    <div>
      <h3>You have {unreadCount} unread notifications</h3>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          {notification.message}
        </div>
      ))}
    </div>
  );
};
```

### Adding NotificationCenter to Your App

```jsx
import NotificationCenter from './components/NotificationCenter';

const Header = () => {
  return (
    <header>
      <div>Your App</div>
      <NotificationCenter />
    </header>
  );
};
```

## Migration from Old System

1. **Backend**: The old socket logic in `app.js` has been moved to separate services
2. **Frontend**: The socket logic in `AuthContext.jsx` has been replaced with the new services
3. **Backward Compatibility**: The old `socket.js` file still works but shows deprecation warnings

## Environment Variables

### Frontend (.env)
```
VITE_SOCKET_URL=http://localhost:3000
```

### Backend (.env)
```
FRONTEND_URL=http://localhost:5173
```

## Features

- ✅ Real-time notifications via WebSocket
- ✅ Persistent notifications in database
- ✅ Toast notifications for immediate feedback
- ✅ Notification center UI component
- ✅ Read/unread status tracking
- ✅ Bulk notification support
- ✅ Automatic reconnection handling
- ✅ Clean separation of concerns
- ✅ React hooks for easy integration
- ✅ Graceful error handling and cleanup

## Testing

### Backend Testing
```bash
# Start the server
npm start

# Test notification creation
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "user123", "message": "Test notification", "type": "info"}'
```

### Frontend Testing
```javascript
import notificationService from './services/notificationService';

// Send a test notification
notificationService.sendCustomNotification(
  'This is a test notification',
  'info'
);
```
