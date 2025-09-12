const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const xeroRoutes = require('./routes/xero');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: [
    'https://lledgerlink.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration with MongoDB store (works even before connection)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink',
    touchAfter: 24 * 3600, // lazy session update
    ttl: 24 * 60 * 60 // 24 hours session expiry
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

app.use(session(sessionConfig));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('✅ Session store configured with MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  // For development, continue without database
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Running without database connection in development mode');
  } else {
    console.error('💥 Production requires database connection');
    process.exit(1);
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LedgerLink API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    sessionStore: 'MongoDB (MongoStore)'
  });
});

// Additional health check for monitoring
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    sessionStore: 'MongoDB',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.json(health);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({ 
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 LedgerLink server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`💾 Session Store: MongoDB (production-ready)`);
});

module.exports = app;