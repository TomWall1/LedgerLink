/**
 * LedgerLink Backend Server
 * Main server file with Xero integration, matching functionality, and counterparty management
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Import middleware
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const corsMiddleware = require('./middleware/cors');
const { handleXeroErrors } = require('./middleware/xeroAuth');

// Import routes
const xeroRoutes = require('./routes/xero');
const healthRoutes = require('./routes/health');
const matchingRoutes = require('./routes/matching');
const counterpartyRoutes = require('./routes/counterparties');

// Import Xero sync jobs
const xeroSyncJob = require('./jobs/xeroSyncJob');

// Import database manager
const dbManager = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.xero.com", "https://identity.xero.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(corsMiddleware);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check routes (before authentication)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Basic health endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LedgerLink API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: ['matching', 'xero-integration', 'counterparty-management']
  });
});

// Authentication middleware (implement based on your existing auth system)
const auth = (req, res, next) => {
  // TODO: Implement your existing authentication logic here
  // For now, we'll create a simple mock that you can replace
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    // TODO: Replace with your actual JWT verification
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // Mock user for development - REPLACE THIS
    req.user = {
      id: 'user_123',
      email: 'demo@ledgerlink.com',
      name: 'Demo User',
      companyId: 'company_123',
      companyName: 'Demo Company'
    };
    
    next();
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Special route for counterparty invitations (public access for invitation viewing)
app.use('/api/counterparties/invitation', counterpartyRoutes);

// API Routes (with authentication)
app.use('/api/xero', auth, xeroRoutes);
app.use('/api/matching', auth, matchingRoutes);
app.use('/api/counterparties', auth, counterpartyRoutes);

// Add your existing routes here
// app.use('/api/users', auth, userRoutes);
// app.use('/api/companies', auth, companyRoutes);
// app.use('/api/transactions', auth, transactionRoutes);
// app.use('/api/matches', matchRoutes); // Public route example

// Xero error handling middleware
app.use(handleXeroErrors);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('📁 Created uploads directory');
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 LedgerLink API server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`✅ Matching API available at /api/matching`);
  console.log(`👥 Counterparty API available at /api/counterparties`);
  console.log(`🔗 Xero integration available at /api/xero`);
  
  // Start Xero sync jobs in production
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_XERO_SYNC_JOBS === 'true') {
    try {
      xeroSyncJob.start();
      console.log('✅ Xero sync jobs started');
    } catch (error) {
      console.error('❌ Failed to start Xero sync jobs:', error.message);
    }
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📥 ${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    console.log('🔒 HTTP server closed');
    
    // Stop Xero sync jobs
    try {
      xeroSyncJob.stop();
      console.log('⏹️ Xero sync jobs stopped');
    } catch (error) {
      console.error('❌ Error stopping sync jobs:', error.message);
    }
    
    // Close database connections
    dbManager.disconnect().then(() => {
      console.log('💾 Database disconnected');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error disconnecting from database:', error.message);
      process.exit(1);
    });
  });
  
  // Force close server after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;