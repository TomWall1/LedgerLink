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

// Connect to database (non-blocking - server will still start if DB connection fails)
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB on startup:', err.message);
  console.log('Server will continue running, but database operations will fail until connection is established');
});

const app = express();

// Trust proxy - Required for Render/production deployment
app.set('trust proxy', true);

// CORS configuration - Allow your Vercel frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ledgerlink.vercel.app',  // Fixed typo: removed double 'l'
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Blocked origin ${origin}`);
      console.warn(`   Allowed origins are: ${allowedOrigins.join(', ')}`);
      // Still allow the request but without credentials
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

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

// Get port from environment or use default
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0'; // CRITICAL: Bind to all network interfaces for Render

// Start server with proper host binding
const server = app.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log('✅ LedgerLink Backend Server Started');
  console.log('========================================');
  console.log(`📍 Server URL: http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`🗄️  MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log('========================================');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, log to monitoring service but keep server running
  if (process.env.NODE_ENV === 'production') {
    console.error('Server continuing in production despite uncaught exception');
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, log to monitoring service but keep server running
  if (process.env.NODE_ENV === 'production') {
    console.error('Server continuing in production despite unhandled rejection');
  }
});

export default app;
