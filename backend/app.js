// app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import pool from './db.js'; // PostgreSQL pool

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billerRoutes from './routes/billerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust to your frontend origin
    methods: ['GET', 'POST'],
  },
});

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

// 404 fallback
app.use((req, res) => res.status(404).send('Route not found'));

// connect with user
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('register', (userId) => {
    console.log(`📡 Socket joined user room: ${userId}`);
    socket.join(userId); // Join a room named after the user ID
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// PostgreSQL LISTEN for new notifications
const listenForNotifications = async () => {
  const client = await pool.connect();
  await client.query('LISTEN new_notification');

  client.on('notification', (msg) => {
    const payload = JSON.parse(msg.payload);
    const { recipient_id } = payload;
    console.log('DB Notification:', payload);

    // Send notification to the intended user's socket room
    io.to(recipient_id).emit('notification', payload);
  });
};

listenForNotifications().catch((err) => {
  console.error('Error setting up DB notification listener:', err);
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
