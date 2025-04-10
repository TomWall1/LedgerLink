import express from 'express';
import crypto from 'crypto';
import { XeroClient } from 'xero-node';
import dotenv from 'dotenv';
import { tokenStore } from '../utils/tokenStore.js';

// Initialize dotenv
dotenv.config();

const router = express.Router();

// Function to get a Xero client instance
const getXeroClient = () => {
  return new XeroClient({
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback'],
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
    state: crypto.randomBytes(20).toString('hex'),
    httpTimeout: 30000
  });
};

// Add auth status endpoint
router.get('/status', async (req, res) => {
  try {
    console.log('Auth status endpoint accessed');
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    console.log('Auth status response:', tokens ? 'Authenticated' : 'Not authenticated');
    
    res.json({
      isAuthenticated: !!tokens
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      details: error.message
    });
  }
});

// Endpoint to initiate the Xero connection
router.get('/connect', async (req, res) => {
  try {
    // Generate a new state value for security
    const state = crypto.randomBytes(20).toString('hex');
    
    // Create a new Xero client with the generated state
    const xero = getXeroClient();
    xero.config.state = state;
    
    // Build the consent URL
    const consentUrl = await xero.buildConsentUrl();
    
    // Redirect to the Xero consent page
    res.redirect(consentUrl);
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Callback endpoint for after authorization
router.get('/callback', async (req, res) => {
  try {
    console.log('Xero callback received:', req.url);
    
    // Extract the authorization code from the callback URL
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('No authorization code received');
    }
    
    // Create a new Xero client
    const xero = getXeroClient();
    
    // Exchange the authorization code for tokens
    const tokenSet = await xero.apiCallback(req.url);
    console.log('Token exchange successful, received token set');
    
    // Store the tokens for later use
    const saveResult = await tokenStore.saveTokens(tokenSet);
    console.log('Token save result:', saveResult);
    
    // Redirect to a success page
    res.redirect('/xero-connected');
  } catch (error) {
    console.error('Error in callback handling:', error);
    
    // Redirect to an error page or show error message
    res.redirect('/xero-error?message=' + encodeURIComponent(error.message));
  }
});

// Disconnect endpoint
router.post('/disconnect', async (req, res) => {
  try {
    console.log('Xero disconnect request received');
    
    // Clear the tokens
    await tokenStore.clearTokens();
    
    res.json({ success: true, message: 'Disconnected from Xero' });
  } catch (error) {
    console.error('Error disconnecting from Xero:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check token status
router.get('/debug-auth', async (req, res) => {
  try {
    console.log('Debug auth endpoint accessed');
    
    // Check if tokens file exists
    const hasTokens = tokenStore.hasTokens();
    
    // Try to get valid tokens (will refresh if needed)
    let tokens = null;
    let tokenError = null;
    
    try {
      tokens = await tokenStore.getValidTokens();
    } catch (error) {
      tokenError = error.message;
    }
    
    // Return debug information
    res.json({
      hasTokensFile: hasTokens,
      hasValidTokens: !!tokens,
      tokenError,
      tokenInfo: tokens ? {
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
        accessTokenPresent: !!tokens.access_token,
        refreshTokenPresent: !!tokens.refresh_token,
        scope: tokens.scope
      } : null
    });
  } catch (error) {
    console.error('Error in debug auth endpoint:', error);
    res.status(500).json({
      error: 'Debug auth check failed',
      details: error.message
    });
  }
});

// Get Xero customers
router.get('/customers', async (req, res) => {
  try {
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({
        error: 'Not authenticated with Xero'
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      return res.status(400).json({
        error: 'No Xero organizations found for this connection'
      });
    }
    
    // Use the first tenant ID (most common scenario)
    const firstTenant = tenants[0];
    
    // Get contacts
    const contactsResponse = await xero.accountingApi.getContacts(firstTenant.tenantId);
    
    // Filter for customers (contacts with IsCustomer=true)
    const customers = contactsResponse.body.Contacts.filter(contact => contact.IsCustomer);
    
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Error fetching Xero customers:', error);
    res.status(500).json({
      error: 'Failed to fetch Xero customers',
      details: error.message
    });
  }
});

// Get invoices for a customer
router.get('/customers/:contactId/invoices', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { includeHistory } = req.query;
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({
        error: 'Not authenticated with Xero'
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      return res.status(400).json({
        error: 'No Xero organizations found for this connection'
      });
    }
    
    // Use the first tenant ID
    const firstTenant = tenants[0];
    
    // Build the 'where' clause to filter invoices by contact ID
    const where = `Contact.ContactID=="${contactId}"`;
    
    // Get invoices for the contact
    const invoicesResponse = await xero.accountingApi.getInvoices(firstTenant.tenantId, undefined, where);
    
    // Filter invoices if we're not including history
    let invoices = invoicesResponse.body.Invoices;
    
    if (includeHistory !== 'true') {
      // Only include outstanding invoices
      invoices = invoices.filter(invoice => 
        invoice.Status !== 'PAID' && invoice.Status !== 'VOIDED'
      );
    }
    
    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch customer invoices',
      details: error.message
    });
  }
});

export default router;
