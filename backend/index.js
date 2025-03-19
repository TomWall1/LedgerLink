import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { XeroClient } from 'xero-node';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xeroAuthRouter from './src/routes/xeroAuth.js';
import accountLinkRouter from './src/routes/accountLinkRoutes.js';
import processRouter from './src/routes/processRoutes.js';
import testRouter from './src/routes/test.js';
import { tokenStore } from './src/utils/tokenStore.js';

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Get token file path for debug info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_FILE_PATH = tokenStore.getTokenFilePath ? tokenStore.getTokenFilePath() : path.join(__dirname, 'data', 'xero-tokens.json');

// Create Xero client for direct endpoint
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback'],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000
});

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

// Add a direct route for Xero auth URL for more reliable connection
app.get('/direct-xero-auth', async (req, res) => {
  try {
    console.log('Direct Xero auth endpoint accessed');
    res.header('Access-Control-Allow-Origin', '*');
    
    // Update the redirect URI from environment
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    xero.config.redirectUris = [redirectUri];
    
    // Generate a random state for security
    const state = crypto.randomBytes(16).toString('hex');
    
    // Generate consent URL
    const consentUrl = await xero.buildConsentUrl();
    const url = new URL(consentUrl);
    url.searchParams.set('state', state);
    
    console.log('Generated Xero auth URL:', url.toString());
    res.json({ url: url.toString() });
  } catch (error) {
    console.error('Error generating Xero auth URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add direct auth status endpoint
app.get('/direct-auth-status', (req, res) => {
  try {
    console.log('Direct auth status endpoint accessed');
    res.header('Access-Control-Allow-Origin', '*');
    
    // Check token status
    const isAuthenticated = tokenStore.hasTokens();
    console.log('Authentication status:', isAuthenticated);
    res.json({ isAuthenticated });
  } catch (error) {
    console.error('Error checking authentication status:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      details: error.message
    });
  }
});

// Add direct debug endpoint
app.get('/direct-debug-auth', (req, res) => {
  try {
    console.log('Direct debug auth endpoint accessed');
    res.header('Access-Control-Allow-Origin', '*');
    
    // Gather detailed token info
    const now = new Date();
    const tokenFilePath = tokenStore.getTokenFilePath ? tokenStore.getTokenFilePath() : TOKEN_FILE_PATH;
    
    const tokenStatus = {
      hasTokens: tokenStore.hasTokens(),
      expiry: tokenStore.expiry,
      isExpired: tokenStore.expiry ? now > tokenStore.expiry : true,
      timeUntilExpiry: tokenStore.expiry ? Math.floor((tokenStore.expiry - now) / 1000) + ' seconds' : 'N/A',
      hasAccessToken: !!tokenStore.tokens?.access_token,
      hasRefreshToken: !!tokenStore.tokens?.refresh_token,
      tokenType: tokenStore.tokens?.token_type || 'none',
      currentTime: now,
      fileStatus: tokenFilePath && fs.existsSync(tokenFilePath) ? 'exists' : 'missing',
      tokenFileLocation: tokenFilePath || 'not set',
      environment: process.env.NODE_ENV || 'not set',
    };
    
    res.json({
      status: 'Debug information',
      tokenInfo: tokenStatus
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch debug information',
      details: error.message,
      stack: error.stack
    });
  }
});

// Use router modules
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
