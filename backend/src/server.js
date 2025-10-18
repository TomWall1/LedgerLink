import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import xeroRoutes from './routes/xeroRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import counterpartyRoutes from './routes/counterpartyRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ledgerlink.vercel.app',
    'https://lledgerlink.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'LedgerLink API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    sessionStore: 'MongoDB (MongoStore)',
    routes: {
      test: '/api/test',
      users: '/api/users',
      xero: '/api/xero',
      transactions: '/api/transactions',
      counterparty: '/api/counterparty'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    sessionStore: 'MongoDB',
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'LedgerLink API is working!',
    timestamp: new Date().toISOString(),
    routes: {
      users: '/api/users',
      xero: '/api/xero',
      transactions: '/api/transactions',
      counterparty: '/api/counterparty'
    }
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/counterparty', counterpartyRoutes);

// 404 handler for unknown routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      root: '/',
      health: '/health',
      test: '/api/test',
      users: '/api/users/*',
      xero: '/api/xero/*',
      transactions: '/api/transactions/*',
      counterparty: '/api/counterparty/*'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;