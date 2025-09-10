/**
 * Coupa Configuration Settings
 * 
 * This file contains all the configuration settings for Coupa integration.
 * Think of this as the "settings file" for how your app talks to Coupa.
 */

module.exports = {
  // API Configuration
  api: {
    baseURL: process.env.COUPA_API_BASE_URL,
    timeout: parseInt(process.env.COUPA_TIMEOUT_MS) || 30000, // 30 seconds
    retryAttempts: parseInt(process.env.COUPA_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.COUPA_RETRY_DELAY_MS) || 1000, // 1 second
  },

  // Authentication Configuration
  auth: {
    clientId: process.env.COUPA_CLIENT_ID,
    clientSecret: process.env.COUPA_CLIENT_SECRET,
    apiKey: process.env.COUPA_API_KEY,
    webhookSecret: process.env.COUPA_WEBHOOK_SECRET,
    
    // OAuth Scopes needed for different operations
    scopes: {
      read: ['core.invoice.read', 'core.supplier.read', 'core.approval.read'],
      write: ['core.invoice.write', 'core.supplier.write'],
      all: ['core.invoice.read', 'core.invoice.write', 'core.supplier.read', 'core.supplier.write', 'core.approval.read']
    }
  },

  // Rate Limiting Configuration
  rateLimit: {
    requestsPerMinute: parseInt(process.env.COUPA_RATE_LIMIT_PER_MINUTE) || 60,
    burstLimit: parseInt(process.env.COUPA_BURST_LIMIT) || 10, // Allow short bursts
    windowSizeMs: 60 * 1000, // 1 minute window
  },

  // Data Sync Configuration
  sync: {
    intervalHours: parseInt(process.env.COUPA_SYNC_INTERVAL_HOURS) || 6,
    maxRecordsPerFetch: parseInt(process.env.COUPA_MAX_RECORDS_PER_FETCH) || 1000,
    dateRangeDays: parseInt(process.env.COUPA_DATE_RANGE_DAYS) || 30,
    
    // Default filters for data fetching
    defaultFilters: {
      invoices: {
        status: ['approved', 'paid', 'pending_approval'],
        limit: 100
      },
      approvals: {
        status: ['approved', 'pending'],
        limit: 100
      },
      suppliers: {
        active: true,
        limit: 100
      }
    }
  },

  // API Endpoints
  endpoints: {
    // Authentication
    oauth: '/oauth2/token',
    
    // Data endpoints
    invoices: '/api/invoices',
    invoiceApprovals: '/api/invoice_approvals',
    suppliers: '/api/suppliers',
    users: '/api/users',
    approvalWorkflows: '/api/approval_workflows',
    
    // Webhook endpoints
    webhooks: {
      invoiceApproved: '/webhooks/invoice-approved',
      invoiceCreated: '/webhooks/invoice-created',
      supplierUpdated: '/webhooks/supplier-updated'
    }
  },

  // Error Handling Configuration
  errorHandling: {
    // HTTP status codes and their meanings
    statusCodes: {
      400: 'Bad Request - Check your request parameters',
      401: 'Unauthorized - Check your credentials',
      403: 'Forbidden - Check your permissions',
      404: 'Not Found - The requested resource does not exist',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Coupa server error',
      502: 'Bad Gateway - Coupa service unavailable',
      503: 'Service Unavailable - Coupa maintenance mode',
      504: 'Gateway Timeout - Coupa server timeout'
    },
    
    // Retry configuration
    retryableStatusCodes: [429, 500, 502, 503, 504],
    maxRetries: 3,
    retryDelay: 1000, // Start with 1 second
    exponentialBackoff: true
  },

  // Data Mapping Configuration
  mapping: {
    // Map Coupa field names to LedgerLink field names
    fields: {
      invoice: {
        'number': 'invoiceNumber',
        'total': 'amount',
        'invoice_date': 'issueDate',
        'payment_due_date': 'dueDate',
        'supplier.name': 'vendor',
        'status': 'status'
      },
      approval: {
        'invoice.number': 'invoiceNumber',
        'invoice.total': 'amount',
        'approved_at': 'approvalDate',
        'approver.display_name': 'approver',
        'status': 'status'
      },
      supplier: {
        'name': 'name',
        'id': 'supplierId',
        'active': 'status',
        'primary_contact.email': 'email'
      }
    },
    
    // Status mapping
    statusMapping: {
      invoice: {
        'pending_receipt': 'pending',
        'pending_approval': 'pending_approval',
        'approved': 'approved',
        'paid': 'paid',
        'rejected': 'rejected',
        'cancelled': 'cancelled'
      },
      approval: {
        'approved': 'approved',
        'pending': 'pending',
        'denied': 'rejected',
        'cancelled': 'cancelled'
      }
    }
  },

  // Logging Configuration
  logging: {
    logLevel: process.env.COUPA_LOG_LEVEL || 'info', // debug, info, warn, error
    logApiCalls: process.env.COUPA_LOG_API_CALLS === 'true',
    logSensitiveData: process.env.NODE_ENV === 'development' && process.env.COUPA_LOG_SENSITIVE === 'true'
  },

  // Cache Configuration
  cache: {
    enabled: process.env.COUPA_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.COUPA_CACHE_TTL) || 300, // 5 minutes
    maxSize: parseInt(process.env.COUPA_CACHE_MAX_SIZE) || 100 // Max cached items
  },

  // Validation Rules
  validation: {
    required: {
      baseURL: true,
      auth: true // Either API key OR OAuth credentials
    },
    
    limits: {
      maxRecordsPerRequest: 1000,
      maxDateRangeDays: 365,
      maxRetries: 5,
      maxTimeoutMs: 120000 // 2 minutes
    }
  }
};