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
    redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/api/xero/callback'],
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
    httpTimeout: 30000
  });
};

// Helper function to make direct Xero API calls (more reliable than SDK)
async function callXeroApi(url, accessToken, tenantId) {
  try {
    console.log('   Making direct API call to Xero:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log(`   Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('   API call failed:', {
        status: response.status,
        text: text.substring(0, 500)
      });
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('   Failed to parse response:', text.substring(0, 500));
      throw new Error('Invalid JSON response from Xero');
    }
  } catch (error) {
    console.error('   Error in callXeroApi:', error);
    throw error;
  }
}

// Get Xero connections for a company (frontend expects this)
router.get('/connections', async (req, res) => {
  try {
    const { companyId } = req.query;
    console.log('GET /api/xero/connections - companyId:', companyId);
    
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    
    const connections = tenants.map(tenant => ({
      _id: tenant.tenantId,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantType: tenant.tenantType,
      status: 'active',
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: 'success'
    }));
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Error fetching Xero connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
}); // Sync connection endpoint
router.post('/sync', async (req, res) => {
  try {
    const { connectionId } = req.body;
    console.log('POST /api/xero/sync - connectionId:', connectionId);
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated with Xero'
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Verify the connection exists
    const tenants = await xero.updateTenants();
    const connection = tenants.find(t => t.tenantId === connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }
    
    // Return success with updated sync time
    res.json({
      success: true,
      data: {
        lastSyncAt: new Date().toISOString(),
        status: 'success'
      }
    });
  } catch (error) {
    console.error('Error syncing Xero connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync connection',
      error: error.message
    });
  }
});

// Check connection health endpoint
router.get('/health/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    console.log('GET /api/xero/health/:connectionId - connectionId:', connectionId);
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated with Xero'
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Get tenant information
    const tenants = await xero.updateTenants();
    const tenant = tenants.find(t => t.tenantId === connectionId);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }
    
    // Try to make a simple API call to check connectivity
    let apiConnectivity = 'ok';
    let apiError = null;
    
    try {
      await xero.accountingApi.getOrganisations(connectionId);
    } catch (error) {
      apiConnectivity = 'error';
      apiError = error.message;
    }
    
    // Return health status
    res.json({
      success: true,
      data: {
        connectionId,
        tenantName: tenant.tenantName,
        status: 'active',
        isExpired: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        apiConnectivity,
        apiError
      }
    });
  } catch (error) {
    console.error('Error checking connection health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection health',
      error: error.message
    });
  }
});

// Initiate Xero OAuth flow (frontend expects this at /auth)
router.get('/auth', async (req, res) => {
  try {
    const { companyId } = req.query;
    console.log('GET /api/xero/auth - Initiating OAuth for companyId:', companyId);
    
    // Create a Xero client
    const xero = getXeroClient();
    
    // Build the consent URL (this will generate and set the state internally)
    const consentUrl = await xero.buildConsentUrl();
    
    // Return the consent URL for frontend to redirect
    res.json({
      success: true,
      data: {
        authUrl: consentUrl,
        state: xero.config.state
      }
    });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to start Xero connection',
      error: error.message 
    });
  }
});

// Auth status endpoint
router.get('/auth-status', async (req, res) => {
  try {
    console.log('GET /api/xero/auth-status');
    
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    res.json({
      isAuthenticated: !!tokens,
      status: tokens ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      details: error.message,
      isAuthenticated: false
    });
  }
});

// Status endpoint (alias for auth-status)
router.get('/status', async (req, res) => {
  try {
    console.log('GET /api/xero/status');
    const tokens = await tokenStore.getValidTokens();
    
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

// Connect endpoint (redirects to OAuth)
router.get('/connect', async (req, res) => {
  try {
    // Create a Xero client
    const xero = getXeroClient();
    
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
    
    // Create a Xero client
    const xero = getXeroClient();
    
    // Exchange the authorization code for tokens
    const tokenSet = await xero.apiCallback(req.url);
    console.log('Token exchange successful, received token set');
    
    // Store the tokens for later use
    const saveResult = await tokenStore.saveTokens(tokenSet);
    console.log('Token save result:', saveResult);
    
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/connections?xero=connected`);
  } catch (error) {
    console.error('Error in callback handling:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/connections?xero=error&message=${encodeURIComponent(error.message)}`);
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

// Get Xero customers - NOW USING DIRECT API CALLS (more reliable)
router.get('/customers', async (req, res) => {
  try {
    console.log('GET /api/xero/customers - Fetching customers from Xero...');
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    console.log('   Tokens retrieved:', !!tokens);
    
    if (!tokens) {
      console.log('   ❌ No valid tokens found');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Xero',
        customers: []
      });
    }
    
    // Create Xero client to get tenants (still need SDK for this)
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    console.log('   Xero client created and tokens set');
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    console.log('   Tenants found:', tenants ? tenants.length : 0);
    
    if (!tenants || tenants.length === 0) {
      console.log('   ❌ No Xero organizations found');
      return res.json({
        success: false,
        error: 'No Xero organizations found for this connection',
        customers: []
      });
    }
    
    // Use the first tenant ID (most common scenario)
    const firstTenant = tenants[0];
    console.log('   Using tenant:', firstTenant.tenantName, firstTenant.tenantId);
    
    // NOW USE DIRECT API CALL with where clause - this is the proven approach from Ledger-Match
    console.log('   Calling Xero API directly with IsCustomer filter...');
    const customersData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer==true',
      tokens.access_token,
      firstTenant.tenantId
    );
    
    console.log('   Response received');
    const customers = customersData.Contacts || [];
    console.log('   ✅ Total customers found:', customers.length);
    
    // Log first customer for debugging
    if (customers.length > 0) {
      console.log('   First customer sample:', JSON.stringify({
        ContactID: customers[0].ContactID,
        Name: customers[0].Name,
        ContactStatus: customers[0].ContactStatus
      }, null, 2));
    }
    
    res.json({
      success: true,
      customers: customers
    });
  } catch (error) {
    console.error('❌ Error fetching Xero customers:', error);
    console.error('   Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return a friendly error instead of crashing
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Xero customers',
      details: error.message,
      customers: []
    });
  }
});

// Get invoices for a customer
router.get('/customers/:contactId/invoices', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { includeHistory } = req.query;
    console.log(`GET /api/xero/customers/${contactId}/invoices - includeHistory:`, includeHistory);
    
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    
    if (!tokens) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Xero'
      });
    }
    
    // Create Xero client and set tokens
    const xero = getXeroClient();
    xero.setTokenSet(tokens);
    
    // Get available tenant connections
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      return res.json({
        success: false,
        error: 'No Xero organizations found for this connection',
        invoices: []
      });
    }
    
    // Use the first tenant ID
    const firstTenant = tenants[0];
    console.log('   Using tenant:', firstTenant.tenantName);
    
    // FIXED: Build the 'where' clause with proper GUID format for Xero API
    // Xero requires GUIDs to be wrapped in Guid() function, not quoted as strings
    const where = `Contact.ContactID=Guid("${contactId}")`;
    console.log('   Where clause:', where);
    
    // Get invoices for the contact
    const invoicesResponse = await xero.accountingApi.getInvoices(firstTenant.tenantId, undefined, where);
    console.log('   Invoices found:', invoicesResponse?.body?.Invoices?.length || 0);
    
    // Safely access invoices
    let invoices = invoicesResponse?.body?.Invoices || [];
    
    if (includeHistory !== 'true') {
      // Only include outstanding invoices
      invoices = invoices.filter(invoice => 
        invoice.Status !== 'PAID' && invoice.Status !== 'VOIDED'
      );
      console.log('   Outstanding invoices:', invoices.length);
    }
    
    res.json({
      success: true,
      invoices: invoices
    });
  } catch (error) {
    console.error('❌ Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer invoices',
      details: error.message,
      invoices: []
    });
  }
});

// Health endpoint for testing
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xero-routes',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint  
router.get('/test', (req, res) => {
  res.json({
    message: 'Xero routes working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      'connections': '/api/xero/connections',
      'auth': '/api/xero/auth',
      'auth-status': '/api/xero/auth-status',
      'sync': '/api/xero/sync',
      'health': '/api/xero/health/:connectionId',
      'connect': '/api/xero/connect',
      'callback': '/api/xero/callback',
      'disconnect': '/api/xero/disconnect',
      'customers': '/api/xero/customers',
      'test': '/api/xero/test'
    }
  });
});

export default router;
