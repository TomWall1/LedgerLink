import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import xeroRoutes from './src/routes/xeroAuth.js';
import processRoutes from './src/routes/processRoutes.js';
import testRoutes from './src/routes/test.js';
import accountLinkRoutes from './src/routes/accountLinkRoutes.js';

dotenv.config();

const app = express();

// Define allowed origins with the exact frontend URL
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'https://ledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Very permissive CORS configuration to resolve issues
app.use((req, res, next) => {
  // Allow both production and development origins
  const allowedOrigins = [
    'https://lledgerlink.vercel.app',
    'https://ledgerlink.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // In development, allow all origins
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  // Include all potentially needed headers, especially Cache-Control which was missing
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, X-CSRF-Token, X-Auth-Token');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    // Pre-flight request
    return res.status(204).end();
  }
  next();
});

// Standard CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://lledgerlink.vercel.app',
      'https://ledgerlink.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ];
    
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(null, false); 
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Auth-Token',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Regular CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    headers: {
      origin: req.headers.origin,
      host: req.headers.host,
      referer: req.headers.referer
    },
    query: req.query,
    body: Object.keys(req.body || {}).length > 0 ? '(body present)' : '(no body)'
  });
  next();
});

// Mount test routes first
app.use('/test', testRoutes);

// Mount other routes
app.use('/auth', xeroRoutes);

// IMPORTANT: Add this specific route to match frontend expectations
app.use('/auth/xero', xeroRoutes);

app.use('/process-csv', processRoutes);
app.use('/match-data', processRoutes);

// Add the account linking routes
app.use('/link', accountLinkRoutes);

// Add direct mount for the /api path to handle /api/match requests
app.use('/api', processRoutes);

// IMPORTANT: Also mount Xero routes under /api/xero to match frontend expectations
app.use('/api/xero', xeroRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    endpoints: {
      test: '/test/upload',
      auth: ['/auth/*', '/auth/xero/*'],
      process: '/process-csv',
      match: '/match-data',
      link: '/link',
      api: '/api/match',
      xero: ['/auth/xero/*', '/api/xero/*']
    },
    version: '1.1.0' // Added version to track deployment
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