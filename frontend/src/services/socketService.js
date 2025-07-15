// services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
  }

  // Connect to socket server
  connect(userId) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const serverURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
    
    this.socket = io(serverURL, {
      transports: ['websocket'],
      upgrade: true,
      autoConnect: true,
    });

    this.setupEventHandlers(userId);
    return this.socket;
  }

  // Setup default event handlers
  setupEventHandlers(userId) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Register user
      if (userId) {
        this.socket.emit('register', userId);
      }
    });

    this.socket.on('registered', (data) => {
      console.log('📡 Successfully registered with server:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      // Auto-reconnect on certain disconnection reasons
      if (reason === 'io server disconnect') {
        this.handleReconnect(userId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.handleReconnect(userId);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  // Handle reconnection logic
  handleReconnect(userId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.socket?.connect();
        if (userId && this.socket) {
          this.socket.emit('register', userId);
        }
      }
    }, delay);
  }

  // Subscribe to an event
  on(event, handler) {
    if (!this.socket) {
      console.warn('Socket not connected. Handler will be registered when connected.');
      // Store handler for later registration
      this.eventHandlers.set(event, handler);
      return;
    }

    this.socket.on(event, handler);
    this.eventHandlers.set(event, handler);
  }

  // Unsubscribe from an event
  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
    this.eventHandlers.delete(event);
  }

  // Emit an event
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.eventHandlers.clear();
      console.log('🔌 Socket disconnected manually');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Get socket instance (use carefully)
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();
