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

// Simpler and more direct CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin); // Use the specific origin in the response
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token', 'X-Auth-Token'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['accounting.transactions.read', 'accounting.contacts.read']
});

app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

app.get('/api/xero/config', (req, res) => {
  res.json({
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});

app.get('/api/xero/auth-url', async (req, res) => {
  try {
    console.log('Generating Xero consent URL');
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

// Special route for Xero authentication status check
app.get('/auth/xero/status', (req, res) => {
  console.log('Xero auth status check from:', req.headers.origin);
  // Since this is the endpoint causing CORS issues, let's explicitly handle the CORS headers
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.json({ isAuthenticated: false });
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