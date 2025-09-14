/**
 * Xero Helper Utilities
 * Common utility functions for Xero integration
 */

const crypto = require('crypto');
const XeroConnection = require('../models/XeroConnection');

/**
 * Format date for Xero API queries
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatXeroDate = (date) => {
  if (!date) return null;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // Xero expects dates in ISO format
  return dateObj.toISOString().split('T')[0];
};

/**
 * Parse Xero date string to JavaScript Date
 * @param {string} xeroDate - Xero date string
 * @returns {Date|null} - Parsed date or null
 */
const parseXeroDate = (xeroDate) => {
  if (!xeroDate) return null;
  
  // Xero sometimes returns dates in different formats
  // Handle: "2023-12-25T00:00:00" or "/Date(1703462400000+0000)/"
  
  if (xeroDate.startsWith('/Date(')) {
    // Extract timestamp from "/Date(1703462400000+0000)/" format
    const match = xeroDate.match(/\/Date\((\d+)[+-]\d+\)\//)
    if (match) {
      return new Date(parseInt(match[1]));
    }
  }
  
  // Try parsing as ISO date
  const date = new Date(xeroDate);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Format amount for display
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (optional)
 * @returns {string} - Formatted amount
 */
const formatAmount = (amount, currency = null) => {
  if (amount === null || amount === undefined) return '0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '0.00';
  
  const formatted = numAmount.toFixed(2);
  
  if (currency) {
    return `${currency} ${formatted}`;
  }
  
  return formatted;
};

/**
 * Generate a secure state parameter for OAuth
 * @param {string} userId - User ID
 * @param {string} companyId - Company ID
 * @returns {string} - Encoded state parameter
 */
const generateOAuthState = (userId, companyId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const data = JSON.stringify({ userId, companyId, timestamp, random });
  
  // Encode the state to make it URL-safe
  return Buffer.from(data).toString('base64url');
};

/**
 * Parse and validate OAuth state parameter
 * @param {string} state - Encoded state parameter
 * @returns {Object} - Decoded state data
 */
const parseOAuthState = (state) => {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const data = JSON.parse(decoded);
    
    // Validate required fields
    if (!data.userId || !data.companyId || !data.timestamp) {
      throw new Error('Invalid state format');
    }
    
    // Check if state is not too old (5 minutes max)
    const age = Date.now() - data.timestamp;
    if (age > 5 * 60 * 1000) {
      throw new Error('State parameter has expired');
    }
    
    return data;
  } catch (error) {
    throw new Error(`Invalid state parameter: ${error.message}`);
  }
};

/**
 * Build Xero API where clause from filters
 * @param {Object} filters - Filter object
 * @returns {string|null} - Where clause string
 */
const buildXeroWhereClause = (filters) => {
  const conditions = [];
  
  if (filters.dateFrom) {
    conditions.push(`Date >= DateTime(${formatXeroDate(filters.dateFrom)})`);
  }
  
  if (filters.dateTo) {
    conditions.push(`Date <= DateTime(${formatXeroDate(filters.dateTo)})`);
  }
  
  if (filters.status && Array.isArray(filters.status)) {
    const statusConditions = filters.status.map(s => `Status == "${s}"`);
    conditions.push(`(${statusConditions.join(' OR ')})`);
  } else if (filters.status) {
    conditions.push(`Status == "${filters.status}"`);
  }
  
  if (filters.contactName) {
    conditions.push(`Contact.Name.Contains("${filters.contactName}")`);
  }
  
  if (filters.invoiceNumber) {
    conditions.push(`InvoiceNumber.Contains("${filters.invoiceNumber}")`);
  }
  
  if (filters.reference) {
    conditions.push(`Reference.Contains("${filters.reference}")`);
  }
  
  if (filters.amountFrom !== undefined) {
    conditions.push(`Total >= ${filters.amountFrom}`);
  }
  
  if (filters.amountTo !== undefined) {
    conditions.push(`Total <= ${filters.amountTo}`);
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : null;
};

/**
 * Validate Xero webhook signature
 * @param {string} body - Request body
 * @param {string} signature - X-Xero-Signature header
 * @param {string} webhookKey - Webhook key from Xero
 * @returns {boolean} - Whether signature is valid
 */
const validateWebhookSignature = (body, signature, webhookKey) => {
  if (!body || !signature || !webhookKey) {
    return false;
  }
  
  try {
    const computedSignature = crypto
      .createHmac('sha256', webhookKey)
      .update(body, 'utf8')
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(computedSignature, 'base64')
    );
  } catch (error) {
    console.error('Webhook signature validation error:', error);
    return false;
  }
};

/**
 * Map Xero invoice status to LedgerLink status
 * @param {string} xeroStatus - Xero invoice status
 * @returns {string} - LedgerLink status
 */
const mapXeroStatus = (xeroStatus) => {
  const statusMap = {
    'DRAFT': 'draft',
    'SUBMITTED': 'pending',
    'AUTHORISED': 'open',
    'PAID': 'paid',
    'VOIDED': 'void',
    'DELETED': 'deleted'
  };
  
  return statusMap[xeroStatus] || 'unknown';
};

/**
 * Map LedgerLink status to Xero status
 * @param {string} ledgerStatus - LedgerLink status
 * @returns {Array} - Array of possible Xero statuses
 */
const mapToXeroStatus = (ledgerStatus) => {
  const statusMap = {
    'draft': ['DRAFT'],
    'pending': ['SUBMITTED'],
    'open': ['AUTHORISED'],
    'paid': ['PAID'],
    'void': ['VOIDED'],
    'deleted': ['DELETED']
  };
  
  return statusMap[ledgerStatus] || [];
};

/**
 * Check if a Xero connection needs token refresh
 * @param {Object} connection - Xero connection object
 * @returns {boolean} - Whether refresh is needed
 */
const needsTokenRefresh = (connection) => {
  if (!connection || !connection.expiresAt) {
    return true;
  }
  
  // Refresh if token expires in the next 5 minutes
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return new Date(connection.expiresAt).getTime() - Date.now() < bufferTime;
};

/**
 * Sanitize data for logging (remove sensitive information)
 * @param {Object} data - Data to sanitize
 * @returns {Object} - Sanitized data
 */
const sanitizeForLogging = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  const sensitiveFields = [
    'accessToken',
    'refreshToken',
    'idToken',
    'client_secret',
    'password',
    'api_key'
  ];
  
  const sanitizeRecursive = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitizeRecursive(value);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object') {
            sanitizeRecursive(item);
          }
        });
      }
    }
  };
  
  sanitizeRecursive(sanitized);
  return sanitized;
};

/**
 * Calculate match confidence score between two invoices
 * @param {Object} invoice1 - First invoice
 * @param {Object} invoice2 - Second invoice
 * @returns {Object} - Match result with confidence score and reasons
 */
const calculateMatchConfidence = (invoice1, invoice2) => {
  let score = 0;
  const reasons = [];
  const maxScore = 100;
  
  // Invoice number match (40 points)
  if (invoice1.transaction_number && invoice2.transaction_number) {
    if (invoice1.transaction_number === invoice2.transaction_number) {
      score += 40;
      reasons.push('Invoice numbers match exactly');
    } else if (invoice1.transaction_number.toLowerCase().includes(invoice2.transaction_number.toLowerCase()) ||
               invoice2.transaction_number.toLowerCase().includes(invoice1.transaction_number.toLowerCase())) {
      score += 20;
      reasons.push('Invoice numbers partially match');
    }
  }
  
  // Amount match (30 points)
  if (invoice1.amount !== undefined && invoice2.amount !== undefined) {
    const amount1 = Math.abs(parseFloat(invoice1.amount));
    const amount2 = Math.abs(parseFloat(invoice2.amount));
    const difference = Math.abs(amount1 - amount2);
    const tolerance = Math.max(amount1, amount2) * 0.01; // 1% tolerance
    
    if (difference === 0) {
      score += 30;
      reasons.push('Amounts match exactly');
    } else if (difference <= tolerance) {
      score += 25;
      reasons.push('Amounts match within tolerance');
    } else if (difference <= Math.max(amount1, amount2) * 0.05) { // 5% tolerance
      score += 15;
      reasons.push('Amounts are close');
    }
  }
  
  // Date match (20 points)
  if (invoice1.issue_date && invoice2.issue_date) {
    const date1 = new Date(invoice1.issue_date);
    const date2 = new Date(invoice2.issue_date);
    const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      score += 20;
      reasons.push('Dates match exactly');
    } else if (daysDiff <= 1) {
      score += 15;
      reasons.push('Dates are within 1 day');
    } else if (daysDiff <= 7) {
      score += 10;
      reasons.push('Dates are within 1 week');
    }
  }
  
  // Reference match (10 points)
  if (invoice1.reference && invoice2.reference) {
    if (invoice1.reference === invoice2.reference) {
      score += 10;
      reasons.push('References match exactly');
    } else if (invoice1.reference.toLowerCase().includes(invoice2.reference.toLowerCase()) ||
               invoice2.reference.toLowerCase().includes(invoice1.reference.toLowerCase())) {
      score += 5;
      reasons.push('References partially match');
    }
  }
  
  // Determine match status
  let status;
  if (score >= 90) {
    status = 'matched';
  } else if (score >= 70) {
    status = 'likely_match';
  } else if (score >= 40) {
    status = 'possible_match';
  } else {
    status = 'no_match';
  }
  
  return {
    confidence: Math.min(score, maxScore),
    status,
    reasons,
    details: {
      invoice1: {
        number: invoice1.transaction_number,
        amount: invoice1.amount,
        date: invoice1.issue_date
      },
      invoice2: {
        number: invoice2.transaction_number,
        amount: invoice2.amount,
        date: invoice2.issue_date
      }
    }
  };
};

module.exports = {
  formatXeroDate,
  parseXeroDate,
  formatAmount,
  generateOAuthState,
  parseOAuthState,
  buildXeroWhereClause,
  validateWebhookSignature,
  mapXeroStatus,
  mapToXeroStatus,
  needsTokenRefresh,
  sanitizeForLogging,
  calculateMatchConfidence
};