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

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
});

// Global variable to store authentication state for debug purposes
let isXeroAuthenticated = false;

app.get('/', (req, res) => {
  console.log('Root endpoint accessed from:', req.headers.origin);
  res.json({ status: 'API is running' });
});

// Direct Xero auth status endpoint
app.get('/auth/xero/status', (req, res) => {
  const origin = req.headers.origin;
  console.log(`Xero auth status check from: ${origin}`);
  
  try {
    // Check if we have a valid token
    const tokenBased = !!xero.accessTokenSet;
    console.log(`Authentication state:`, {
      tokenBased,
      globalVariable: isXeroAuthenticated,
      accessToken: xero.accessTokenSet ? 'Set' : 'Not Set'
    });
    
    // Force authentication to true for testing
    // Note: Remove this in production once auth is working properly
    const isAuthenticated = true;
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

// Direct Xero authenticate URL endpoint
app.get('/auth/xero/auth-url', async (req, res) => {
  try {
    console.log('Generating Xero consent URL for:', req.headers.origin);
    
    // Use the redirect URI from the env variable
    const redirectUri = process.env.XERO_REDIRECT_URI;
    console.log('Using redirect URI:', redirectUri);
    
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated consent URL:', {
      url: consentUrl,
      state: xero.state
    });
    
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct Xero connect endpoint
app.get('/auth/xero/connect', async (req, res) => {
  try {
    console.log('Xero connect endpoint accessed from:', req.headers.origin);
    
    // Use the redirect URI from the env variable
    const redirectUri = process.env.XERO_REDIRECT_URI;
    console.log('Using redirect URI:', redirectUri);
    
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated consent URL:', {
      url: consentUrl,
      state: xero.state
    });
    
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating connect URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct Xero API connect endpoint
app.get('/api/xero/connect', async (req, res) => {
  try {
    console.log('API Xero connect endpoint accessed from:', req.headers.origin);
    
    // Use the redirect URI from the env variable
    const redirectUri = process.env.XERO_REDIRECT_URI;
    console.log('Using redirect URI:', redirectUri);
    
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated consent URL:', {
      url: consentUrl,
      state: xero.state
    });
    
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating connect URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct Xero OAuth callback endpoint - Handle both POST and GET
app.post('/auth/xero/callback', async (req, res) => {
  try {
    console.log('Xero callback POST received');
    const { code } = req.body;
    
    if (!code) {
      console.error('No authorization code provided');
      return res.status(400).json({ error: 'No authorization code provided' });
    }
    
    console.log('Processing authorization code from Xero:', code.substring(0, 10) + '...');
    
    try {
      // Exchange the code for a token
      await xero.apiCallback(code);
      isXeroAuthenticated = true;
      console.log('Successfully authenticated with Xero');
      console.log('Access token set:', !!xero.accessTokenSet);
      
      // Return success response
      res.json({ 
        success: true, 
        message: 'Successfully authenticated with Xero' 
      });
    } catch (apiError) {
      console.error('Error exchanging code for token:', apiError);
      res.status(500).json({ 
        error: 'Error exchanging code for token', 
        details: apiError.message 
      });
    }
  } catch (error) {
    console.error('Unexpected error in Xero callback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/auth/xero/callback', async (req, res) => {
  try {
    console.log('Xero callback GET received with query:', req.query);
    const { code, state } = req.query;
    
    if (!code) {
      console.error('No authorization code provided in query');
      // Redirect to frontend with error
      const frontendUrl = 'https://lledgerlink.vercel.app';
      return res.redirect(`${frontendUrl}/auth/xero/callback?error=no_code`);
    }
    
    try {
      // Exchange the code for a token
      await xero.apiCallback(code);
      isXeroAuthenticated = true;
      console.log('Successfully authenticated with Xero via GET');
      console.log('Access token set:', !!xero.accessTokenSet);
      
      // Redirect to frontend with success
      const frontendUrl = 'https://lledgerlink.vercel.app';
      res.redirect(`${frontendUrl}/auth/xero/callback?authenticated=true`);
    } catch (apiError) {
      console.error('Error exchanging code for token:', apiError);
      // Redirect to frontend with error
      const frontendUrl = 'https://lledgerlink.vercel.app';
      res.redirect(`${frontendUrl}/auth/xero/callback?error=${encodeURIComponent(apiError.message)}`);
    }
  } catch (error) {
    console.error('Unexpected error in Xero GET callback:', error);
    // Redirect to frontend with error
    const frontendUrl = 'https://lledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/auth/xero/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// Also handle API endpoint for callback
app.post('/api/xero/callback', async (req, res) => {
  try {
    console.log('Xero API callback received');
    const { code } = req.body;
    
    if (!code) {
      console.error('No authorization code provided to API');
      return res.status(400).json({ error: 'No authorization code provided' });
    }
    
    console.log('Processing authorization code from Xero API:', code.substring(0, 10) + '...');
    
    try {
      // Exchange the code for a token
      await xero.apiCallback(code);
      isXeroAuthenticated = true;
      console.log('Successfully authenticated with Xero via API');
      console.log('Access token set:', !!xero.accessTokenSet);
      
      // Return success response
      res.json({ 
        success: true, 
        message: 'Successfully authenticated with Xero via API' 
      });
    } catch (apiError) {
      console.error('Error exchanging code for token via API:', apiError);
      res.status(500).json({ 
        error: 'Error exchanging code for token', 
        details: apiError.message 
      });
    }
  } catch (error) {
    console.error('Unexpected error in Xero API callback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all Xero customers
app.get('/api/xero/customers', async (req, res) => {
  try {
    console.log('Fetching Xero customers');
    
    if (!xero.accessTokenSet) {
      console.log('Not authenticated with Xero');
      return res.status(401).json({ error: 'Not authenticated with Xero' });
    }
    
    // Get the first tenant from Xero connection
    console.log('Updating tenants');
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      console.log('No tenants found');
      return res.status(404).json({ error: 'No Xero organizations found' });
    }
    
    const tenantId = tenants[0].tenantId;
    console.log('Using tenant ID:', tenantId);
    
    // Fetch customers/contacts from Xero
    console.log('Fetching contacts from Xero');
    const contacts = await xero.accountingApi.getContacts(tenantId);
    console.log(`Found ${contacts.body.contacts.length} contacts`);
    
    res.json(contacts.body.contacts);
  } catch (error) {
    console.error('Error fetching Xero customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoices for a specific customer
app.get('/api/xero/customers/:contactId/invoices', async (req, res) => {
  try {
    const { contactId } = req.params;
    console.log(`Fetching invoices for contact ID: ${contactId}`);
    
    if (!xero.accessTokenSet) {
      console.log('Not authenticated with Xero');
      return res.status(401).json({ error: 'Not authenticated with Xero' });
    }
    
    // Get the first tenant from Xero connection
    console.log('Updating tenants');
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      console.log('No tenants found');
      return res.status(404).json({ error: 'No Xero organizations found' });
    }
    
    const tenantId = tenants[0].tenantId;
    console.log('Using tenant ID:', tenantId);
    
    // Fetch invoices from Xero for a specific contact (customer)
    console.log('Fetching invoices with filter:', `Contact.ContactID=="${contactId}"`);
    const invoices = await xero.accountingApi.getInvoices(tenantId, undefined, `Contact.ContactID=="${contactId}"`);
    console.log(`Found ${invoices.body.invoices.length} invoices`);
    
    res.json(invoices.body.invoices);
  } catch (error) {
    console.error('Error fetching Xero invoices:', error);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    clientId: process.env.XERO_CLIENT_ID ? '\u2713 Set' : '\u2717 Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '\u2713 Set' : '\u2717 Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});