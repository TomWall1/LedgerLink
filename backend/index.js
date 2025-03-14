import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import xeroRoutes from './src/routes/xeroAuth.js';
import processRoutes from './src/routes/processRoutes.js';
import testRoutes from './src/routes/test.js';
import accountLinkRoutes from './src/routes/accountLinkRoutes.js';

dotenv.config();

const app = express();

// Define allowed origins
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Set up CORS middleware with more specific configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`CORS blocked request from origin: ${origin}`);
      // For debugging: still allow all origins in production for now
      if (process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    headers: req.headers
  });
  next();
});

// Mount test routes first
app.use('/test', testRoutes);

// Mount other routes
app.use('/auth', xeroRoutes);
app.use('/process-csv', processRoutes);
app.use('/match-data', processRoutes);
// Add the account linking routes
app.use('/link', accountLinkRoutes);
// Add direct mount for the /api path as well to handle /api/match requests
app.use('/api', processRoutes);

// Create a simple non-authenticated status endpoint
app.get('/xero-public-status', (req, res) => {
  res.json({ serverRunning: true });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    endpoints: {
      test: '/test/upload',
      auth: '/auth',
      process: '/process-csv',
      match: '/match-data',
      link: '/link',
      api: '/api/match'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err,
    message: err.message,
    code: err.code,
    field: err.field,
    storageErrors: err.storageErrors,
    stack: err.stack
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path,
    timestamp: new Date().toISOString(),
    details: JSON.stringify(err, Object.getOwnPropertyNames(err))
  });
});

// Start server
const PORT = process.env.PORT || 3002; // Changed default port to 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    node_env: process.env.NODE_ENV,
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
    frontend: process.env.FRONTEND_URL
  });
});

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});