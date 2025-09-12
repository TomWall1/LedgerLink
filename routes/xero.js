const express = require('express');
const router = express.Router();
const { XeroClient } = require('xero-node');
const { requireXeroAuth } = require('../middleware/xeroAuth');

// Initialize Xero client
const getXeroClient = (tokenSet) => {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [`${process.env.API_URL || 'https://ledgerlink.onrender.com'}/api/xero/callback`],
    scopes: ['accounting.contacts.read', 'accounting.transactions.read'],
    state: 'returnPage=main',
    httpTimeout: 3000
  }, tokenSet);
};

// Check authentication status
router.get('/auth-status', (req, res) => {
  const authenticated = !!req.session.xeroTokenSet;
  res.json({
    authenticated,
    tenantId: req.session.tenantId || null
  });
});

// Initiate Xero connection
router.get('/connect', async (req, res) => {
  try {
    const xeroClient = getXeroClient();
    const consentUrl = await xeroClient.buildConsentUrl();
    res.json({ authUrl: consentUrl });
  } catch (error) {
    console.error('Error building consent URL:', error);
    res.status(500).json({ error: 'Failed to initiate Xero connection' });
  }
});

// Handle Xero callback
router.get('/callback', async (req, res) => {
  try {
    const xeroClient = getXeroClient();
    const tokenSet = await xeroClient.apiCallback(req.url);
    
    if (tokenSet.expired()) {
      return res.status(400).json({ error: 'Token expired' });
    }
    
    // Store token in session
    req.session.xeroTokenSet = tokenSet;
    
    // Get tenant info
    await xeroClient.updateTenants();
    const tenants = xeroClient.tenants;
    
    if (tenants.length > 0) {
      req.session.tenantId = tenants[0].tenantId;
    }
    
    // Redirect back to frontend - FIXED URL
    res.redirect('https://ledgerlink.vercel.app/invoice-matching?connected=true');
    
  } catch (error) {
    console.error('Error in Xero callback:', error);
    // Redirect to frontend with error - FIXED URL
    res.redirect('https://ledgerlink.vercel.app/xero-auth?error=connection_failed');
  }
});

// Disconnect from Xero
router.post('/disconnect', (req, res) => {
  req.session.xeroTokenSet = null;
  req.session.tenantId = null;
  res.json({ success: true, message: 'Disconnected from Xero' });
});

// Get customers from Xero
router.get('/customers', requireXeroAuth, async (req, res) => {
  try {
    const xeroClient = getXeroClient(req.session.xeroTokenSet);
    
    const response = await xeroClient.accountingApi.getContacts(
      req.session.tenantId,
      undefined, // ifModifiedSince
      "ContactStatus==\"ACTIVE\" AND IsCustomer==true", // where clause
      'Name' // order
    );
    
    const customers = response.body.contacts || [];
    res.json(customers);
    
  } catch (error) {
    console.error('Error fetching customers:', error);
    if (error.response && error.response.status === 401) {
      req.session.xeroTokenSet = null;
      req.session.tenantId = null;
      return res.status(401).json({ error: 'Xero authentication expired' });
    }
    res.status(500).json({ error: 'Failed to fetch customers from Xero' });
  }
});

// Get customer invoices from Xero
router.get('/customers/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const xeroClient = getXeroClient(req.session.xeroTokenSet);
    
    const response = await xeroClient.accountingApi.getInvoices(
      req.session.tenantId,
      undefined, // ifModifiedSince
      undefined, // where
      'Date DESC', // order
      undefined, // ids
      undefined, // invoiceNumbers
      [customerId], // contactIDs
      ['AUTHORISED', 'SUBMITTED'] // statuses - only unpaid invoices
    );
    
    const invoices = response.body.invoices || [];
    res.json(invoices);
    
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    if (error.response && error.response.status === 401) {
      req.session.xeroTokenSet = null;
      req.session.tenantId = null;
      return res.status(401).json({ error: 'Xero authentication expired' });
    }
    res.status(500).json({ error: 'Failed to fetch customer invoices from Xero' });
  }
});

// Export the getXeroClient function for use in other modules
module.exports = {
  router,
  getXeroClient: (req) => getXeroClient(req.session.xeroTokenSet)
};

// Export the router as default
module.exports = router;