/**
 * Xero API Configuration
 * Handles Xero OAuth 2.0 settings and API endpoints
 */

module.exports = {
  // OAuth 2.0 Configuration
  oauth: {
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUri: process.env.XERO_REDIRECT_URI || `${process.env.BACKEND_URL}/api/xero/callback`,
    
    // OAuth URLs
    authorizeUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    
    // Required scopes for ledger reconciliation
    scopes: [
      'openid',
      'profile',
      'email',
      'accounting.transactions.read',
      'accounting.contacts.read',
      'accounting.settings.read',
      'offline_access' // For refresh tokens
    ].join(' '),
    
    // OAuth flow parameters
    responseType: 'code',
    state: true // Enable CSRF protection
  },
  
  // Xero API Configuration
  api: {
    baseUrl: 'https://api.xero.com/api.xro/2.0',
    connectionsUrl: 'https://api.xero.com/connections',
    timeout: 30000, // 30 seconds
    
    // Rate limiting (Xero allows 60 API calls per minute)
    rateLimit: {
      maxRequests: 55, // Leave some buffer
      windowMs: 60000 // 1 minute
    }
  },
  
  // Data mapping configuration
  mapping: {
    // Map Xero invoice fields to LedgerLink format
    invoice: {
      'InvoiceNumber': 'transaction_number',
      'Type': 'transaction_type',
      'AmountDue': 'amount',
      'Date': 'issue_date',
      'DueDate': 'due_date',
      'Status': 'status',
      'Reference': 'reference',
      'Contact.Name': 'contact_name',
      'InvoiceID': 'xero_id'
    },
    
    // Map LedgerLink status to Xero status
    status: {
      'open': ['DRAFT', 'SUBMITTED', 'AUTHORISED'],
      'paid': ['PAID'],
      'void': ['VOIDED', 'DELETED']
    }
  },
  
  // Sync configuration
  sync: {
    batchSize: 100, // Process invoices in batches
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    
    // Data refresh intervals
    intervals: {
      invoices: 300000, // 5 minutes
      contacts: 3600000, // 1 hour
      settings: 86400000 // 24 hours
    }
  }
};