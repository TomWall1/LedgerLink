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

// Options handler for preflight requests - EXPANDED HEADERS LIST for CORS
router.options('*', (req, res) => {
  // Get the request origin
  const origin = req.headers.origin || '*';
  
  // Check if the origin is in our allowedOrigins list
  const isAllowedOrigin = allowedOrigins.includes(origin) || origin === '*';
  
  // Always allow the request during development or for allowed origins
  res.header('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Include all potentially needed headers, especially Cache-Control which was missing
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, X-CSRF-Token, X-Auth-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Log the preflight request
  console.log('Handling CORS preflight for:', {
    path: req.path,
    origin,
    method: req.method,
    allowedOrigin: isAllowedOrigin ? origin : '*'
  });
  
  // Return immediately for OPTIONS requests
  res.status(204).end();
});

