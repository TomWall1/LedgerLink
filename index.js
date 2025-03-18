import express from 'express';
import cors from 'cors';
import { XeroClient } from 'xero-node';
import { config } from 'dotenv';
import xeroRoutes from './backend/src/routes/xeroAuth.js';
import { tokenStore } from './backend/src/utils/tokenStore.js';

config();

const app = express();

// Define allowed origins with the exact frontend URL
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Very permissive CORS configuration to resolve issues
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Pragma', 'Cache-Control'],
  credentials: true
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    contentType: req.headers['content-type']
  });
  next();
});

// IMPORTANT: Add preflight handling before other middleware
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Pragma, Cache-Control');
  res.status(204).send();
});

// Body parsing middleware
app.use(express.json());

// Create a shared Xero client instance for direct use in this file
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
});

app.get('/', (req, res) => {
  console.log('Root endpoint accessed from:', req.headers.origin);
  res.json({ status: 'API is running' });
});

// Middleware to sync the token between tokenStore and xeroClient
app.use(async (req, res, next) => {
  // Skip if this is not a Xero-related route
  if (!req.path.includes('/xero/')) {
    return next();
  }
  
  try {
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    if (tokens) {
      // Ensure the XeroClient is using the same token
      xero.setTokenSet(tokens);
      console.log('XeroClient token synchronized with tokenStore');
    }
    next();
  } catch (error) {
    console.error('Error synchronizing tokens:', error);
    next();
  }
});

// Mount the Xero auth routes module
app.use('/auth/xero', xeroRoutes);

// Also mount the Xero auth routes at /api/xero to maintain backward compatibility
app.use('/api/xero', xeroRoutes);

// Backward compatibility for the Xero customer and invoice endpoints
// These will delegate to the xeroAuth implementation
app.get('/api/xero/customers', (req, res, next) => {
  console.log('Forwarding customer request to xeroAuth module');
  next();
});

app.get('/api/xero/customers/:contactId/invoices', (req, res, next) => {
  console.log('Forwarding customer invoices request to xeroAuth module');
  next();
});

app.get('/api/xero/invoices/:tenantId', async (req, res) => {
  try {
    // Get valid tokens from the token store
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated with Xero' });
    }
    
    // Update the client's token set
    xero.setTokenSet(tokens);
    
    const { tenantId } = req.params;
    const invoices = await xero.accountingApi.getInvoices(tenantId);
    res.json(invoices.body);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});
