const express = require('express');
const cors = require('cors');
const { XeroClient } = require('xero-node');
require('dotenv').config();

const app = express();

// Define allowed origins with the exact frontend URL
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// IMPORTANT: Add preflight handling before other middleware
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Pragma, Cache-Control');
  }
  
  res.status(204).send();
});

// General CORS middleware for non-OPTIONS requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Pragma, Cache-Control');
  }
  
  next();
});

// Body parsing middleware
app.use(express.json());

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['accounting.transactions.read', 'accounting.contacts.read']
});

app.get('/', (req, res) => {
  console.log('Root endpoint accessed from:', req.headers.origin);
  res.json({ status: 'API is running' });
});

app.get('/api/xero/config', (req, res) => {
  console.log('Xero config endpoint accessed from:', req.headers.origin);
  res.json({
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});

app.get('/api/xero/auth-url', async (req, res) => {
  try {
    console.log('Generating Xero consent URL for:', req.headers.origin);
    const consentUrl = await xero.buildConsentUrl();
    console.log('Consent URL generated:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/xero/callback', async (req, res) => {
  try {
    console.log('Xero callback received from:', req.headers.origin);
    const { code } = req.body;
    await xero.apiCallback(code);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xero/invoices/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await xero.accountingApi.getInvoices(tenantId);
    res.json(invoices.body);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Special endpoint for checking Xero authentication status
app.get('/auth/xero/status', (req, res) => {
  const origin = req.headers.origin;
  console.log(`Xero auth status check from: ${origin}`);
  
  // Explicitly set CORS headers since this endpoint is causing issues
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Pragma, Cache-Control');
  }
  
  try {
    // Determine if Xero is authenticated
    // For testing, we're just returning a simple response
    const isAuthenticated = !!xero.accessTokenSet;
    console.log(`Responding with auth status: ${isAuthenticated}`);
    
    res.json({ 
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Xero auth status:', error);
    res.status(500).json({ 
      error: 'Error checking authentication status',
      details: error.message 
    });
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