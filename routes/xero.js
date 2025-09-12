const express = require('express');
const router = express.Router();
const { XeroClient } = require('xero-node');
const session = require('express-session');

// Xero client configuration
const client_id = process.env.XERO_CLIENT_ID;
const client_secret = process.env.XERO_CLIENT_SECRET;
const redirectUris = [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/api/xero/callback'];
const scopes = 'offline_access accounting.contacts.read accounting.transactions.read accounting.settings.read';

let xero = new XeroClient({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUris,
  scopes: scopes.split(' ')
});

// Helper function to get Xero client with token
const getXeroClient = async (req) => {
  if (!req.session.xeroTokenSet) {
    throw new Error('No Xero token found in session');
  }
  
  await xero.setTokenSet(req.session.xeroTokenSet);
  
  // Check if token needs refresh
  if (xero.tokenSet.expired()) {
    const tokenSet = await xero.refreshToken();
    req.session.xeroTokenSet = tokenSet;
  }
  
  return xero;
};

// Route to initiate Xero connection
router.get('/connect', async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.json({ authUrl: consentUrl });
  } catch (error) {
    console.error('Error building consent URL:', error);
    res.status(500).json({ error: 'Failed to generate Xero connection URL' });
  }
});

// Xero OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }
    
    // Exchange code for tokens
    const tokenSet = await xero.apiCallback(req.url);
    req.session.xeroTokenSet = tokenSet;
    
    // Get tenant info
    await xero.setTokenSet(tokenSet);
    const tenants = await xero.updateTenants(false);
    
    if (tenants && tenants.length > 0) {
      req.session.tenantId = tenants[0].tenantId;
    }
    
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://lledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/xero-auth?success=true`);
    
  } catch (error) {
    console.error('Error in Xero callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://lledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/xero-auth?error=auth_failed`);
  }
});

// Check authentication status
router.get('/auth-status', (req, res) => {
  try {
    const isAuthenticated = !!(req.session.xeroTokenSet && req.session.tenantId);
    
    res.json({
      authenticated: isAuthenticated,
      tenantId: req.session.tenantId || null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.json({ authenticated: false, tenantId: null });
  }
});

// Disconnect from Xero
router.post('/disconnect', (req, res) => {
  try {
    // Clear Xero session data
    delete req.session.xeroTokenSet;
    delete req.session.tenantId;
    
    res.json({ success: true, message: 'Disconnected from Xero successfully' });
  } catch (error) {
    console.error('Error disconnecting from Xero:', error);
    res.status(500).json({ error: 'Failed to disconnect from Xero' });
  }
});

// Get customers/contacts from Xero
router.get('/customers', async (req, res) => {
  try {
    const xeroClient = await getXeroClient(req);
    
    const response = await xeroClient.accountingApi.getContacts(
      req.session.tenantId,
      undefined, // ifModifiedSince
      'ContactStatus=="ACTIVE"', // where
      'Name', // order
      undefined, // ids
      undefined, // page
      false, // includeArchived
      false, // summaryOnly
      undefined // searchTerm
    );
    
    const customers = response.body.contacts || [];
    
    // Filter to only include customers (not suppliers)
    const customerContacts = customers.filter(contact => 
      contact.isCustomer === true || 
      (contact.isCustomer === undefined && contact.isSupplier !== true)
    );
    
    res.json(customerContacts);
    
  } catch (error) {
    console.error('Error fetching customers from Xero:', error);
    res.status(500).json({ error: 'Failed to fetch customers from Xero' });
  }
});

// Get invoices for a specific customer
router.get('/customers/:customerId/invoices', async (req, res) => {
  try {
    const { customerId } = req.params;
    const xeroClient = await getXeroClient(req);
    
    const response = await xeroClient.accountingApi.getInvoices(
      req.session.tenantId,
      undefined, // ifModifiedSince
      `Contact.ContactID=guid"${customerId}"`, // where
      'Date DESC', // order
      undefined, // ids
      undefined, // invoiceNumbers
      undefined, // contactIDs
      ['AUTHORISED', 'PAID', 'SUBMITTED'], // statuses
      undefined, // page
      false, // includeArchived
      false, // createdByMyApp
      undefined, // unitdp
      undefined // summaryOnly
    );
    
    const invoices = response.body.invoices || [];
    
    // Filter for outstanding invoices (not fully paid)
    const outstandingInvoices = invoices.filter(invoice => 
      invoice.status !== 'PAID' && 
      parseFloat(invoice.amountDue) > 0
    );
    
    res.json(outstandingInvoices);
    
  } catch (error) {
    console.error('Error fetching customer invoices from Xero:', error);
    res.status(500).json({ error: 'Failed to fetch customer invoices from Xero' });
  }
});

// Get organization details
router.get('/organization', async (req, res) => {
  try {
    const xeroClient = await getXeroClient(req);
    
    const response = await xeroClient.accountingApi.getOrganisations(
      req.session.tenantId
    );
    
    const organizations = response.body.organisations || [];
    const organization = organizations[0];
    
    res.json(organization);
    
  } catch (error) {
    console.error('Error fetching organization from Xero:', error);
    res.status(500).json({ error: 'Failed to fetch organization from Xero' });
  }
});

// Export helper function for use in other routes
module.exports = {
  router,
  getXeroClient
};

// Export just the router as default
module.exports = router;