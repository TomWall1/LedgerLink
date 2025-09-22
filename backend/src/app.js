import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

console.log('🔍 APP: Starting to load app.js');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust proxy - Required for Render/production deployment
// This allows Express to properly handle X-Forwarded-For headers from the proxy
app.set('trust proxy', true);
console.log('🔍 APP: Trust proxy set to true');

// Import routes with error handling
let xeroRoutes = null;
let transactionRoutes = null;

try {
  console.log('🔍 APP: Attempting to import xeroRoutes');
  const xeroModule = await import('./routes/xeroRoutes.js');
  xeroRoutes = xeroModule.default;
  console.log('🔍 APP: Successfully imported xeroRoutes');
} catch (error) {
  console.error('🚨 APP: Failed to import xeroRoutes:', error);
}

try {
  console.log('🔍 APP: Attempting to import transactionRoutes');
  const transactionModule = await import('./routes/transactionRoutes.js');
  transactionRoutes = transactionModule.default;
  console.log('🔍 APP: Successfully imported transactionRoutes');
} catch (error) {
  console.error('🚨 APP: Failed to import transactionRoutes:', error);
}

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
      transactions: '/api/transactions'
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
      transactions: '/api/transactions'
    }
  });
});

// API Routes
console.log('🔍 APP: Setting up API routes');

app.use('/api/users', userRoutes);

if (xeroRoutes) {
  console.log('🔍 APP: Mounting xeroRoutes at /api/xero');
  app.use('/api/xero', xeroRoutes);
} else {
  console.error('🚨 APP: xeroRoutes not available, creating fallback');
  app.use('/api/xero', (req, res) => {
    res.status(500).json({
      error: 'Xero routes failed to load',
      message: 'xeroRoutes module could not be imported',
      path: req.path
    });
  });
}

if (transactionRoutes) {
  console.log('🔍 APP: Mounting transactionRoutes at /api/transactions');
  app.use('/api/transactions', transactionRoutes);
} else {
  console.error('🚨 APP: transactionRoutes not available, creating fallback');
  app.use('/api/transactions', (req, res) => {
    res.status(500).json({
      error: 'Transaction routes failed to load',
      message: 'transactionRoutes module could not be imported',
      path: req.path
    });
  });
}

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
      transactions: '/api/transactions/*'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🔍 APP: Server running on port ${PORT}`);
});

console.log('🔍 APP: app.js fully loaded');

export default app;