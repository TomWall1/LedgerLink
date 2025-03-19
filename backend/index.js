import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import xeroAuthRouter from './src/routes/xeroAuth.js';
import accountLinkRouter from './src/routes/accountLinkRoutes.js';
import processRouter from './src/routes/processRoutes.js';
import testRouter from './src/routes/test.js';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Configure CORS
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'https://ledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`CORS request from non-allowed origin: ${origin}`);
      // Still allow the request to go through
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: true
}));

// Add response headers for all requests
app.use((req, res, next) => {
  // Log the request
  console.log(`${req.method} ${req.path} from ${req.headers.origin || 'Unknown origin'}`);
  
  // Additional CORS headers for all responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Continue to the next middleware
  next();
});

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  res.status(204).end();
});

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.get('/', (req, res) => {
  res.send('LedgerLink API is running');
});

// Add a direct route for Xero auth URL
app.get('/direct-xero-auth', async (req, res) => {
  try {
    console.log('Direct endpoint accessed');
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ url: 'https://login.xero.com/identity/connect/authorize' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/auth', xeroAuthRouter);
app.use('/accountLink', accountLinkRouter);
app.use('/process', processRouter);
app.use('/test', testRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
