// services/socketService.js
import { Server } from 'socket.io';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Track connected users
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      //console.log('✅ Socket connected:', socket.id);

      // Handle user registration
      socket.on('register', (userId) => {
        this.registerUser(socket, userId);
      });

      // Handle user disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle typing events (for chat features)
      // socket.on('typing', (data) => {
      //   socket.to(data.room).emit('typing', {
      //     userId: data.userId,
      //     isTyping: data.isTyping
      //   });
      // });
    });
  }

  registerUser(socket, userId) {
    console.log(`📡 Socket joined user room: ${userId}`);
    
    // Leave previous rooms if any
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join user-specific room
    socket.join(userId);
    
    // Track the user
    this.connectedUsers.set(socket.id, {
      userId,
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Notify user of successful connection
    socket.emit('registered', {
      message: 'Successfully connected to notifications',
      userId
    });
  }

  handleDisconnect(socket) {
    const userData = this.connectedUsers.get(socket.id);
    if (userData) {
      console.log(`❌ User ${userData.userId} disconnected:`, socket.id);
      this.connectedUsers.delete(socket.id);
    } else {
      console.log('❌ Socket disconnected:', socket.id);
    }
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
      console.log(`📤 Sent ${event} to user ${userId}:`, data);
    }
  }

  // Send notification to multiple users
  sendToUsers(userIds, event, data) {
    if (this.io && Array.isArray(userIds)) {
      userIds.forEach(userId => {
        this.sendToUser(userId, event, data);
      });
    }
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📡 Broadcasted ${event}:`, data);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
  }

  // Get socket instance
  getIO() {
    return this.io;
  }
}

// Export singleton instance
export default new SocketService();
