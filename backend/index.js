import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { XeroClient } from 'xero-node';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Import database connection
import connectDB from './src/config/db.js';

// Import routes
import xeroAuthRouter from './src/routes/xeroAuth.js';
import accountLinkRouter from './src/routes/accountLinkRoutes.js';
import processRouter from './src/routes/processRoutes.js';
import testRouter from './src/routes/test.js';

// Import the new API routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import companyRoutes from './src/routes/companyRoutes.js';
import companyLinkRoutes from './src/routes/companyLinkRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import erpConnectionRoutes from './src/routes/erpConnectionRoutes.js';

// Import utilities
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
console.log('Using token file path:', TOKEN_FILE_PATH);
// Log token file existence
if (fs.existsSync(TOKEN_FILE_PATH)) {
  console.log('Token file exists');
} else {
  console.log('No token file exists yet');
}

// Ensure uploads directory exists
try {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  }
} catch (error) {
  console.error('Error creating uploads directory:', error);
}

// Create Xero client for direct endpoint
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback'],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000
});

// Configure CORS - Updated configuration to ensure proper access
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'https://ledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Simplified CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Always allow all origins in development/testing
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Add response headers for all requests
app.use((req, res, next) => {
  // Log the request
  console.log(`${req.method} ${req.path} from ${req.headers.origin || 'Unknown origin'}`);
  
  // Set CORS headers for all responses - allow any origin for now to debug
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle CORS preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Continue to the next middleware
  next();
});

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper function to make authenticated Xero API calls
async function callXeroApi(url, options = {}) {
  try {
    console.log('Making API call to Xero:', url);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log(`Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      console.error('API call failed:', {
        status: response.status,
        text: text.substring(0, 500) // Limit response size in logs
      });
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse response:', text.substring(0, 500));
      throw new Error('Invalid JSON response from Xero');
    }
  } catch (error) {
    console.error('Error in callXeroApi:', error);
    throw error;
  }
}

// Middleware to verify Xero authentication
const requireXeroAuth = async (req, res, next) => {
  try {
    const tokens = await tokenStore.getValidTokens();
    if (!tokens) {
      throw new Error('Not authenticated with Xero');
    }
    req.xeroTokens = tokens;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication required',
      details: error.message
    });
  }
};

// Base API Routes
app.get('/', (req, res) => {
  res.send('LedgerLink API is running');
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount our new API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/links', companyLinkRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/erp-connections', erpConnectionRoutes);

// Also mount routes without /api prefix for compatibility
app.use('/erp-connections', erpConnectionRoutes);

// Xero Integration Routes

// Add a direct route for Xero connection details
app.get('/direct-connection-details', requireXeroAuth, async (req, res) => {
  try {
    console.log('Direct connection details endpoint accessed');
    
    // Get the tokens from middleware
    const tokens = req.xeroTokens;
    
    // Get organization details
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenant = tenants[0];
    
    // Get organization details
    const organizationsData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Organisation', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenant.tenantId
        }
      }
    );

    const organization = organizationsData.Organisations?.[0] || {
      Name: tenant.tenantName,
      LegalName: tenant.tenantName
    };

    // Return combined information
    res.json({
      success: true,
      organization: {
        id: tenant.tenantId,
        name: organization.Name,
        legalName: organization.LegalName,
        shortCode: organization.ShortCode,
        country: organization.CountryCode,
        timezone: organization.TimeZone,
        status: tenant.tenantType
      },
      connectionInfo: {
        createdDate: tenant.createdDateUtc,
        updatedDate: tenant.updatedDateUtc
      }
    });
  } catch (error) {
    console.error('Error fetching connection details:', error);
    res.status(500).json({
      error: 'Failed to fetch connection details',
      details: error.message
    });
  }
});

// Add a direct route for Xero auth URL for more reliable connection
app.get('/direct-xero-auth', async (req, res) => {
  try {
    console.log('Direct Xero auth endpoint accessed');
    
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

// Add direct callback notification route
app.post('/auth/xero/callback-notify', async (req, res) => {
  try {
    console.log('Callback notification received:', req.body);
    
    const { code, state } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }
    
    // Get the redirect URI from environment
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    console.log('Using redirect URI for token exchange:', redirectUri);
    
    // Exchange code for tokens manually
    try {
      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return res.status(400).json({ error: `Token exchange failed: ${tokenResponse.status} ${errorText}` });
      }

      const tokens = await tokenResponse.json();
      console.log('Token exchange successful:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });

      // Store tokens
      const saveResult = await tokenStore.saveTokens(tokens);
      console.log('Token save result:', saveResult);
      
      // Double-check token save was successful
      if (!saveResult) {
        console.warn('Token save may have failed - attempting second save');
        // Try one more time with explicit expiry
        tokens.expires_in = tokens.expires_in || 1800; // Default to 30 min if not set
        await tokenStore.saveTokens(tokens);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Error in callback notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add direct auth status endpoint
app.get('/direct-auth-status', (req, res) => {
  try {
    console.log('Direct auth status endpoint accessed');
    
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

// Add direct route for Xero customers
app.get('/api/xero/customers', requireXeroAuth, async (req, res) => {
  try {
    console.log('Direct Xero customers endpoint accessed');
    
    // Get the tokens from middleware
    const tokens = req.xeroTokens;
    console.log('Using tokens with expiry:', tokens.expires_in || 'unknown');
    
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;
    console.log('Using tenant:', { id: tenantId, name: tenants[0].tenantName });

    // Get customers
    const customersData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer=true', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId
        }
      }
    );

    console.log(`Found ${customersData.Contacts?.length || 0} customers`);
    res.json({
      success: true,
      customers: customersData.Contacts || []
    });
  } catch (error) {
    console.error('Error fetching Xero customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// Add direct route for Xero invoices
app.get('/api/xero/invoices', requireXeroAuth, async (req, res) => {
  try {
    console.log('Direct Xero invoices endpoint accessed');
    
    // Get the tokens from middleware
    const tokens = req.xeroTokens;
    
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Fetch invoices
    const invoicesData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Invoices?where=Status!="PAID" AND Status!="VOIDED"', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId
        }
      }
    );

    console.log(`Found ${invoicesData.Invoices?.length || 0} invoices`);
    res.json({
      success: true,
      invoices: invoicesData.Invoices || []
    });
  } catch (error) {
    console.error('Error fetching Xero invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
});

// Add direct route for invoices that need matching
app.get('/api/xero/invoices-to-match', requireXeroAuth, async (req, res) => {
  try {
    console.log('Direct Xero invoices-to-match endpoint accessed');
    
    // Get the tokens from middleware
    const tokens = req.xeroTokens;
    
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Fetch invoices that need matching - specifically AUTHORISED invoices
    // which aren't fully paid yet (using the Status filter)
    const invoicesData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Invoices?where=Status="AUTHORISED"', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId
        }
      }
    );

    // Filter out invoices that don't need matching
    const invoicesToMatch = (invoicesData.Invoices || []).filter(invoice => {
      // Only include invoices that are due and haven't been matched yet
      return invoice.Status === 'AUTHORISED' && 
             invoice.AmountDue > 0 && 
             !invoice.FullyPaidOnDate;
    });

    console.log(`Found ${invoicesToMatch.length} invoices to match out of ${invoicesData.Invoices?.length || 0} total`);    
    res.json({
      success: true,
      invoices: invoicesToMatch || []
    });
  } catch (error) {
    console.error('Error fetching invoices to match:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices to match',
      details: error.message
    });
  }
});

// Add direct route for customer invoices
app.get('/api/xero/customers/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { includeHistory } = req.query;
    
    console.log(`Direct Xero customer invoices endpoint accessed for customer ${customerId}`);
    
    // Get the tokens from middleware
    const tokens = req.xeroTokens;
    
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Use a simpler approach - get all invoices and filter in memory
    // This avoids complex query parameter issues with the Xero API
    const invoicesData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Invoices', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId
        }
      }
    );

    // Filter invoices for the specific customer
    const customerInvoices = (invoicesData.Invoices || []).filter(invoice => {
      // First check if the invoice belongs to the specified customer
      const isForCustomer = invoice.Contact && invoice.Contact.ContactID === customerId;
      
      // Then check if we should include all invoices or only unpaid ones
      if (!isForCustomer) return false;
      
      if (includeHistory === 'true') {
        return true; // Include all customer invoices
      } else {
        // Only include unpaid/unvoided invoices
        return invoice.Status !== 'PAID' && invoice.Status !== 'VOIDED';
      }
    });

    console.log(`Found ${customerInvoices.length} invoices for customer ${customerId}`);
    res.json({
      success: true,
      invoices: customerInvoices
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch customer invoices',
      details: error.message
    });
  }
});

// Implement a count endpoint for company links
app.get('/api/links/count', async (req, res) => {
  try {
    // For now, just return a mock count
    res.json({ count: 5 });
  } catch (error) {
    console.error('Error getting link count:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get link count' 
    });
  }
});

// Use legacy router modules
app.use('/auth/xero', xeroAuthRouter);
app.use('/accountLink', accountLinkRouter);
app.use('/process', processRouter);
app.use('/test', testRouter);

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    details: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB before starting the server
    console.log('Connecting to MongoDB...');
    const conn = await connectDB();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Xero Integration:', {
        clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
        clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
        redirectUri: process.env.XERO_REDIRECT_URI || 'Default'
      });
      console.log(`Server ready at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Full error details:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();