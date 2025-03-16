import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { tokenStore } from '../utils/tokenStore.js';

const router = express.Router();
const pendingStates = new Set();

// Define allowed origins list for specific route handling
const allowedOrigins = [
  'https://lledgerlink.vercel.app',
  'https://ledgerlink.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

// Create the xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback'],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000
});

// Helper function to format Xero date correctly
const formatXeroDate = (xeroDateString) => {
  if (!xeroDateString) return null;
  
  try {
    // First, check if it's in Xero's /Date()/ format
    if (typeof xeroDateString === 'string' && xeroDateString.includes('/Date(')) {
      // Extract the timestamp (milliseconds since epoch)
      const timestamp = xeroDateString.replace(/\/Date\((\d+)[+-]\d{4}\)\//, '$1');
      
      if (timestamp && !isNaN(parseInt(timestamp))) {
        const date = new Date(parseInt(timestamp));
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      }
    }
    
    // If it's in UTC format like "2023-01-15T00:00:00"
    if (typeof xeroDateString === 'string' && 
        (xeroDateString.includes('T') || 
         xeroDateString.match(/^\d{4}-\d{2}-\d{2}/))) {
      const parsed = dayjs(xeroDateString);
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
      }
    }
    
    // If it's already a JavaScript Date object
    if (xeroDateString instanceof Date && !isNaN(xeroDateString)) {
      return xeroDateString.toISOString().split('T')[0];
    }
    
    // If all else fails, just try parsing it with dayjs
    const fallbackDate = dayjs(xeroDateString);
    if (fallbackDate.isValid()) {
      return fallbackDate.format('YYYY-MM-DD');
    }
    
    // If we can't parse it, return null
    console.warn(`Unable to parse Xero date: ${xeroDateString} (type: ${typeof xeroDateString})`);
    return null;
  } catch (error) {
    console.error('Error parsing Xero date:', error, 'Original value:', xeroDateString);
    return null;
  }
};

// Helper function to calculate the amount paid on a Xero invoice
const calculateAmountPaid = (invoice) => {
  if (!invoice || !invoice.Payments || !Array.isArray(invoice.Payments)) {
    return 0;
  }
  
  return invoice.Payments.reduce((total, payment) => {
    const amount = parseFloat(payment.Amount || 0);
    return total + (isNaN(amount) ? 0 : amount);
  }, 0);
};

// Helper function to calculate the remaining balance on a Xero invoice
const calculateRemainingBalance = (invoice) => {
  if (!invoice) return 0;
  
  const total = parseFloat(invoice.Total || 0);
  const amountPaid = calculateAmountPaid(invoice);
  
  return Math.max(0, total - amountPaid);
};

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

// Options handler for preflight requests
router.options('*', (req, res) => {
  // Allow any origin for now to debug CORS issues
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

// NEW: Add auth-url endpoint to match the root index.js
router.get('/auth-url', async (req, res) => {
  try {
    console.log('Backend Xero auth-url endpoint accessed from:', req.headers.origin);
    
    // CORS headers for this specific route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Use the redirect URI from the env variable
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    console.log('Using redirect URI:', redirectUri);
    
    // Generate consent URL
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

// Initial Xero connection route
router.get('/connect', async (req, res) => {
  try {
    // CORS - headers for this specific route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Generate a random state for security
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.add(state);
    
    // Get the current redirect URI from the environment
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    console.log('Using redirect URI:', redirectUri);
    
    // Update the XeroClient with the correct redirect URI
    xero.config.redirectUris = [redirectUri];
    
    // Generate consent URL
    const consentUrl = await xero.buildConsentUrl();
    const url = new URL(consentUrl);
    url.searchParams.set('state', state);
    
    console.log('Generated consent URL:', { url: url.toString(), state });
    res.json({ url: url.toString() });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({
      error: 'Failed to initialize Xero connection',
      details: error.message
    });
  }
});

// Disconnect from Xero
router.post('/disconnect', async (req, res) => {
  try {
    // CORS - headers for this specific route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    await tokenStore.clearTokens();
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting from Xero:', error);
    res.status(500).json({
      error: 'Failed to disconnect from Xero',
      details: error.message
    });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  try {
    // CORS - headers for this specific route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Add cache control headers to prevent caching
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
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

// Xero OAuth callback route
router.get('/callback', async (req, res) => {
  console.log('Received callback with query params:', req.query);
  try {
    const { code, state } = req.query;
    if (!code) throw new Error('No authorization code received');
    if (!state || !pendingStates.has(state)) throw new Error('Invalid state parameter');

    pendingStates.delete(state);

    // Update the redirect URI in case it has changed since the consent URL was generated
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    console.log('Using redirect URI for token exchange:', redirectUri);

    // Exchange code for tokens manually
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
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });

    // Store tokens
    await tokenStore.saveTokens(tokens);

    const frontendUrl = process.env.FRONTEND_URL || 'https://lledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/auth/xero/callback?authenticated=true`);
  } catch (error) {
    console.error('Error in Xero callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://lledgerlink.vercel.app';
    res.redirect(`${frontendUrl}/auth/xero/callback?error=${encodeURIComponent(error.message)}`);
  }
});

// Get Xero customers
router.get('/customers', requireXeroAuth, async (req, res) => {
  try {
    // CORS - headers for this specific route
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    console.log('Fetching tenants...');
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;
    console.log('Using tenant:', { id: tenantId, name: tenants[0].tenantName });

    console.log('Fetching customers...');
    // Get customers
    const customersData = await callXeroApi(
      'https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer=true', {
        headers: {
          'Authorization': `Bearer ${req.xeroTokens.access_token}`,
          'Xero-tenant-id': tenantId
        }
      }
    );

    res.json({
      success: true,
      customers: customersData.Contacts || []
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// Get customer invoices - includes both current and historical
router.get('/customer/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { includeHistory } = req.query;
    console.log('Fetching invoices for customer:', customerId, 'includeHistory:', includeHistory);

    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Instead of using multiple WHERE clauses which might be causing issues,
    // use a simpler query that's more likely to work
    const baseUrl = 'https://api.xero.com/api.xro/2.0/Invoices';

    // Build params separately
    const params = new URLSearchParams();
    params.set('where', `Contact.ContactID=guid("${customerId}")`);
    
    // Only filter out PAID and VOIDED if we're not including history
    if (includeHistory !== 'true') {
      params.set('where', `Status!="PAID" AND Status!="VOIDED"`);
    }
    
    // Always sort by date
    params.set('order', 'Date DESC');
    
    const url = `${baseUrl}?${params.toString()}`;
    console.log('Fetching invoices with URL:', url);

    const invoicesData = await callXeroApi(url, {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`,
        'Xero-tenant-id': tenantId
      }
    });
    
    // Print out first invoice to debug date format
    if (invoicesData.Invoices && invoicesData.Invoices.length > 0) {
      console.log('Sample invoice date fields:', {
        Date: invoicesData.Invoices[0].Date,
        DueDate: invoicesData.Invoices[0].DueDate,
        FullyPaidOnDate: invoicesData.Invoices[0].FullyPaidOnDate
      });
    }
    
    // Transform to match CSV format
    console.log(`Received ${invoicesData.Invoices?.length || 0} invoices`);
    const transformedInvoices = (invoicesData.Invoices || []).map(invoice => {
      // Calculate amount paid and remaining balance
      const totalAmount = parseFloat(invoice.Total || 0);
      const amountPaid = calculateAmountPaid(invoice);
      const remainingBalance = calculateRemainingBalance(invoice);
      const isPartiallyPaid = amountPaid > 0 && amountPaid < totalAmount;
      
      // Extract dates, logging for debugging
      const issueDate = formatXeroDate(invoice.Date);
      const dueDate = formatXeroDate(invoice.DueDate);
      const paymentDate = invoice.Payments && invoice.Payments.length > 0 ? 
        formatXeroDate(invoice.Payments[0].Date) : null;
      
      console.log('Transformed dates:', { 
        original: { 
          Date: invoice.Date, 
          DueDate: invoice.DueDate,
          PaymentDate: invoice.Payments && invoice.Payments.length > 0 ? invoice.Payments[0].Date : null 
        },
        transformed: { issueDate, dueDate, paymentDate }
      });
      
      return {
        transactionNumber: invoice.InvoiceNumber,
        type: invoice.Type,
        // Use remaining balance instead of full amount if there are part payments
        amount: isPartiallyPaid ? remainingBalance : totalAmount,
        original_amount: totalAmount,  // Keep original total for reference
        date: issueDate,
        dueDate: dueDate,
        status: invoice.Status,
        reference: invoice.Reference || '',
        // Payment information
        amount_paid: amountPaid,
        payment_date: paymentDate,
        is_partially_paid: isPartiallyPaid,
        is_paid: invoice.Status === 'PAID',
        is_voided: invoice.Status === 'VOIDED'
      };
    });

    res.json({
      success: true,
      invoices: transformedInvoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
});

// Add customer-specific endpoints for compatibility with the frontend Upload component
router.get('/customers/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log(`Redirecting to customer invoice endpoint for ID: ${customerId}`);
    
    // Forward to the existing /customer/:customerId/invoices endpoint
    req.url = `/customer/${customerId}/invoices${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    return router.handle(req, res);
  } catch (error) {
    console.error('Error in customers/:customerId/invoices redirect:', error);
    res.status(500).json({
      error: 'Failed to fetch customer invoices',
      details: error.message
    });
  }
});

// New endpoint to get historical invoice data for matching
router.get('/historical-invoices', requireXeroAuth, async (req, res) => {
  try {
    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Fetch all invoices including paid ones from the last 12 months
    // Use a simpler query format that's more compatible with Xero API
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const dateStr = twelveMonthsAgo.toISOString().split('T')[0];
    
    const params = new URLSearchParams();
    params.set('where', `Date >= DateTime(${dateStr})`);
    params.set('order', 'Date DESC');
    
    const url = `https://api.xero.com/api.xro/2.0/Invoices?${params.toString()}`;
    console.log('Fetching historical invoices with URL:', url);

    const invoicesData = await callXeroApi(url, {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`,
        'Xero-tenant-id': tenantId
      }
    });
    
    // Print out first invoice to debug date format
    if (invoicesData.Invoices && invoicesData.Invoices.length > 0) {
      console.log('Sample historical invoice date fields:', {
        Date: invoicesData.Invoices[0].Date,
        DueDate: invoicesData.Invoices[0].DueDate,
        FullyPaidOnDate: invoicesData.Invoices[0].FullyPaidOnDate
      });
    }
    
    // Transform to match CSV format with additional historical status info
    console.log(`Received ${invoicesData.Invoices?.length || 0} historical invoices`);
    const transformedInvoices = (invoicesData.Invoices || []).map(invoice => {
      // Calculate amount paid and remaining balance
      const totalAmount = parseFloat(invoice.Total || 0);
      const amountPaid = calculateAmountPaid(invoice);
      const remainingBalance = calculateRemainingBalance(invoice);
      const isPartiallyPaid = amountPaid > 0 && amountPaid < totalAmount;
      
      // Extract dates, logging for debugging
      const issueDate = formatXeroDate(invoice.Date);
      const dueDate = formatXeroDate(invoice.DueDate);
      const paymentDate = invoice.Payments && invoice.Payments.length > 0 ? 
        formatXeroDate(invoice.Payments[0].Date) : null;
      
      return {
        transactionNumber: invoice.InvoiceNumber,
        type: invoice.Type,
        // Use remaining balance instead of full amount if there are part payments
        amount: isPartiallyPaid ? remainingBalance : totalAmount,
        original_amount: totalAmount,  // Keep original total for reference
        date: issueDate,
        dueDate: dueDate,
        status: invoice.Status,
        reference: invoice.Reference || '',
        // Payment information
        amount_paid: amountPaid,
        payment_date: paymentDate,
        is_partially_paid: isPartiallyPaid,
        is_paid: invoice.Status === 'PAID',
        is_voided: invoice.Status === 'VOIDED'
      };
    });

    res.json({
      success: true,
      invoices: transformedInvoices
    });
  } catch (error) {
    console.error('Error fetching historical invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch historical invoices',
      details: error.message
    });
  }
});

export default router;