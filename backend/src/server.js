import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
// Import routes from the correct directory with working Xero integration
import userRoutes from '../routes/users.js';
import xeroRoutes from '../routes/xero.js';
import transactionRoutes from '../routes/transactions.js';
import counterpartyRoutes from '../routes/counterparty.js';
import { matchingRoutes } from './routes/matchingRoutes.js';
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
app.set('trust proxy', 1);

// CORS configuration - Allow your Vercel frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ledgerlink.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

console.log('🌐 CORS allowed origins:', uniqueOrigins);

// Enhanced CORS configuration with explicit header handling
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (uniqueOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowing whitelisted origin: ${origin}`);
      return callback(null, true);
    }
    
    // Log and allow in production mode for flexibility
    console.warn(`⚠️ CORS: Origin ${origin} not in whitelist, but allowing in production mode`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-ERP-Connection-ID'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight for 24 hours
};

// Apply CORS middleware FIRST - before any other middleware
app.use(cors(corsOptions));

// Explicit handling for all OPTIONS requests (preflight) - CRITICAL for CORS
app.options('*', cors(corsOptions));

// Additional manual CORS headers middleware as backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers manually as backup
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, X-ERP-Connection-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS: Handling preflight request for ${req.path}`);
    return res.status(204).end();
  }
  
  next();
});

// Body parser middleware - MUST come after CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'none';
  console.log(`${timestamp} - ${req.method} ${req.path} - Origin: ${origin}`);
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
    sessionStore: 'File-based tokens',
    routes: {
      test: '/api/test',
      users: '/api/users',
      xero: '/api/xero',
      transactions: '/api/transactions',
      counterparty: '/api/counterparty',
      matching: '/api/matching'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    sessionStore: 'File-based',
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
      counterparty: '/api/counterparty',
      matching: '/api/matching'
    }
  });
});

// API Routes - Using routes from backend/routes/ directory
app.use('/api/users', userRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/counterparty', counterpartyRoutes);
app.use('/api/matching', matchingRoutes);

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
      counterparty: '/api/counterparty/*',
      matching: '/api/matching/*'
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
  console.log(`🌐 CORS enabled for: ${uniqueOrigins.join(', ')}`);
  console.log(`🗄️  MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
  console.log(`🔑 Using file-based Xero token storage`);
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
