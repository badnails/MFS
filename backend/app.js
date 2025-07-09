import dotenv from 'dotenv';
dotenv.config();



import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import billerRoutes from './routes/billerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import agentRoutes from './routes/agentRoutes.js'; 
import merchantRoutes from './routes/merchantRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

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

// Register route groups with prefixes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/transaction', transactionRoutes);
app.use('/biller', billerRoutes);
app.use('/admin', adminRoutes);
app.use('/agent', agentRoutes);
app.use('/merchant', merchantRoutes);
// 404 fallback
app.use((req, res) => res.status(404).send('Route not found'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
