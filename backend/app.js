// app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import http from 'http';

// Service imports
import socketService from './services/socketService.js';
import notificationService from './services/notificationService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billerRoutes from './routes/billerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);

// Express middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60, httpOnly: true }
}));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transaction', transactionRoutes);
app.use('/biller', billerRoutes);
app.use('/admin', adminRoutes);
app.use('/agent', agentRoutes);
app.use('/merchant', merchantRoutes);
app.use('/notifications', notificationRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Send error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 fallback
app.use((req, res) => res.status(404).send('Route not found'));

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize Socket.IO
    socketService.initialize(server);
    console.log('✅ Socket service initialized');

    // Initialize notification service
    await notificationService.initialize();
    console.log('✅ Notification service initialized');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeServices();
  
  server.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
