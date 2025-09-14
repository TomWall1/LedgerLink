/**
 * Xero Service
 * Handles all Xero API interactions, OAuth flow, and data synchronization
 */

const axios = require('axios');
const crypto = require('crypto');
const XeroConnection = require('../models/XeroConnection');
const xeroConfig = require('../config/xero');
const { v4: uuidv4 } = require('uuid');

class XeroService {
  constructor() {
    this.config = xeroConfig;
    this.rateLimitTracker = new Map();
  }
  
  /**
   * Generate OAuth authorization URL
   * @param {string} userId - User ID initiating the connection
   * @param {string} companyId - Company ID for the connection
   * @returns {Object} - Authorization URL and state
   */
  generateAuthUrl(userId, companyId) {
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      response_type: this.config.oauth.responseType,
      client_id: this.config.oauth.clientId,
      redirect_uri: this.config.oauth.redirectUri,
      scope: this.config.oauth.scopes,
      state: `${state}:${userId}:${companyId}`
    });
    
    return {
      url: `${this.config.oauth.authorizeUrl}?${params.toString()}`,
      state
    };
  }
  
  /**
   * Handle OAuth callback and exchange code for tokens
   * @param {string} code - Authorization code from Xero
   * @param {string} state - State parameter for CSRF protection
   * @returns {Object} - Connection details
   */
  async handleCallback(code, state) {
    try {
      // Parse state to get user and company IDs
      const [stateToken, userId, companyId] = state.split(':');
      
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Get tenant connections
      const connections = await this.getTenantConnections(tokens.access_token);
      
      // Store connections in database
      const savedConnections = [];
      for (const connection of connections) {
        const xeroConnection = await this.saveConnection({
          userId,
          companyId,
          tokens,
          connection
        });
        savedConnections.push(xeroConnection);
      }
      
      return savedConnections;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to complete Xero connection');
    }
  }
  
  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code
   * @returns {Object} - Token response
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(this.config.oauth.tokenUrl, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.oauth.redirectUri,
        client_id: this.config.oauth.clientId,
        client_secret: this.config.oauth.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }
  
  /**
   * Get available tenant connections
   * @param {string} accessToken - Access token
   * @returns {Array} - Array of tenant connections
   */
  async getTenantConnections(accessToken) {
    try {
      const response = await axios.get(this.config.api.connectionsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Get connections error:', error.response?.data || error.message);
      throw new Error('Failed to get tenant connections');
    }
  }
  
  /**
   * Save Xero connection to database
   * @param {Object} data - Connection data
   * @returns {Object} - Saved connection
   */
  async saveConnection({ userId, companyId, tokens, connection }) {
    try {
      // Check if connection already exists
      let xeroConnection = await XeroConnection.findOne({
        tenantId: connection.tenantId
      });
      
      if (xeroConnection) {
        // Update existing connection
        await xeroConnection.updateTokens(tokens);
      } else {
        // Create new connection
        xeroConnection = new XeroConnection({
          userId,
          companyId,
          tenantId: connection.tenantId,
          tenantName: connection.tenantName,
          tenantType: connection.tenantType,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          idToken: tokens.id_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000))
        });
        
        await xeroConnection.save();
      }
      
      // Fetch organization settings
      await this.syncOrganizationSettings(xeroConnection);
      
      return xeroConnection;
    } catch (error) {
      console.error('Save connection error:', error);
      throw new Error('Failed to save Xero connection');
    }
  }
  
  /**
   * Refresh access token using refresh token
   * @param {Object} connection - Xero connection object
   * @returns {Object} - Updated connection
   */
  async refreshToken(connection) {
    try {
      const tokens = connection.getDecryptedTokens();
      
      const response = await axios.post(this.config.oauth.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: this.config.oauth.clientId,
        client_secret: this.config.oauth.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      await connection.updateTokens(response.data);
      return connection;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      await connection.markAsError('Token refresh failed');
      throw new Error('Failed to refresh Xero tokens');
    }
  }
  
  /**
   * Make authenticated API request to Xero
   * @param {Object} connection - Xero connection
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Object} - API response data
   */
  async makeApiRequest(connection, endpoint, options = {}) {
    try {
      // Check if token needs refresh
      if (connection.isTokenExpired()) {
        await this.refreshToken(connection);
      }
      
      // Rate limiting check
      await this.checkRateLimit(connection.tenantId);
      
      const tokens = connection.getDecryptedTokens();
      const url = `${this.config.api.baseUrl}${endpoint}`;
      
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Xero-tenant-id': connection.tenantId,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        data: options.data,
        params: options.params,
        timeout: this.config.api.timeout
      });
      
      return response.data;
    } catch (error) {
      console.error('API request error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        // Token might be invalid, try refreshing
        try {
          await this.refreshToken(connection);
          // Retry the request once
          const tokens = connection.getDecryptedTokens();
          const retryResponse = await axios({
            url: `${this.config.api.baseUrl}${endpoint}`,
            method: options.method || 'GET',
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
              'Xero-tenant-id': connection.tenantId,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...options.headers
            },
            data: options.data,
            params: options.params,
            timeout: this.config.api.timeout
          });
          return retryResponse.data;
        } catch (retryError) {
          await connection.markAsError('Authentication failed');
          throw new Error('Xero authentication failed');
        }
      }
      
      throw new Error(`Xero API error: ${error.response?.data?.Message || error.message}`);
    }
  }
  
  /**
   * Sync organization settings
   * @param {Object} connection - Xero connection
   */
  async syncOrganizationSettings(connection) {
    try {
      const data = await this.makeApiRequest(connection, '/Organisation');
      const org = data.Organisations?.[0];
      
      if (org) {
        connection.settings = {
          baseCurrency: org.BaseCurrency,
          countryCode: org.CountryCode,
          timezone: org.Timezone,
          shortCode: org.ShortCode,
          organisationType: org.OrganisationType
        };
        await connection.save();
      }
    } catch (error) {
      console.error('Failed to sync organization settings:', error);
    }
  }
  
  /**
   * Get invoices from Xero
   * @param {Object} connection - Xero connection
   * @param {Object} filters - Query filters
   * @returns {Array} - Array of invoices
   */
  async getInvoices(connection, filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        ...filters
      };
      
      // Build where clause for filtering
      const whereConditions = [];
      if (filters.dateFrom) {
        whereConditions.push(`Date >= DateTime(${filters.dateFrom})`);
      }
      if (filters.dateTo) {
        whereConditions.push(`Date <= DateTime(${filters.dateTo})`);
      }
      if (filters.status) {
        whereConditions.push(`Status == "${filters.status}"`);
      }
      
      if (whereConditions.length > 0) {
        params.where = whereConditions.join(' AND ');
      }
      
      const data = await this.makeApiRequest(connection, '/Invoices', {
        params
      });
      
      return this.transformInvoices(data.Invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      throw error;
    }
  }
  
  /**
   * Get contacts from Xero
   * @param {Object} connection - Xero connection
   * @param {Object} filters - Query filters
   * @returns {Array} - Array of contacts
   */
  async getContacts(connection, filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        ...filters
      };
      
      const data = await this.makeApiRequest(connection, '/Contacts', {
        params
      });
      
      return data.Contacts || [];
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw error;
    }
  }
  
  /**
   * Transform Xero invoices to LedgerLink format
   * @param {Array} xeroInvoices - Array of Xero invoices
   * @returns {Array} - Transformed invoices
   */
  transformInvoices(xeroInvoices) {
    return xeroInvoices.map(invoice => {
      const transformed = {
        transaction_number: invoice.InvoiceNumber,
        transaction_type: invoice.Type,
        amount: parseFloat(invoice.AmountDue || invoice.Total || 0),
        issue_date: invoice.Date ? new Date(invoice.Date) : null,
        due_date: invoice.DueDate ? new Date(invoice.DueDate) : null,
        status: this.mapXeroStatus(invoice.Status),
        reference: invoice.Reference || '',
        contact_name: invoice.Contact?.Name || '',
        xero_id: invoice.InvoiceID,
        source: 'xero',
        raw_data: invoice // Store original for debugging
      };
      
      return transformed;
    });
  }
  
  /**
   * Map Xero status to LedgerLink status
   * @param {string} xeroStatus - Xero invoice status
   * @returns {string} - LedgerLink status
   */
  mapXeroStatus(xeroStatus) {
    const statusMap = {
      'DRAFT': 'open',
      'SUBMITTED': 'open',
      'AUTHORISED': 'open',
      'PAID': 'paid',
      'VOIDED': 'void',
      'DELETED': 'void'
    };
    
    return statusMap[xeroStatus] || 'open';
  }
  
  /**
   * Check and enforce rate limiting
   * @param {string} tenantId - Xero tenant ID
   */
  async checkRateLimit(tenantId) {
    const now = Date.now();
    const windowStart = now - this.config.api.rateLimit.windowMs;
    
    if (!this.rateLimitTracker.has(tenantId)) {
      this.rateLimitTracker.set(tenantId, []);
    }
    
    const requests = this.rateLimitTracker.get(tenantId);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.config.api.rateLimit.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = (oldestRequest + this.config.api.rateLimit.windowMs) - now;
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Add current request
    recentRequests.push(now);
    this.rateLimitTracker.set(tenantId, recentRequests);
  }
  
  /**
   * Get all connections for a user
   * @param {string} userId - User ID
   * @param {string} companyId - Company ID (optional)
   * @returns {Array} - Array of connections
   */
  async getUserConnections(userId, companyId = null) {
    return await XeroConnection.findByUser(userId, companyId);
  }
  
  /**
   * Disconnect/revoke Xero connection
   * @param {string} connectionId - Connection ID to revoke
   * @param {string} userId - User ID for authorization
   */
  async disconnectXero(connectionId, userId) {
    try {
      const connection = await XeroConnection.findOne({
        _id: connectionId,
        userId
      }).select('+accessToken +refreshToken');
      
      if (!connection) {
        throw new Error('Connection not found');
      }
      
      // Revoke tokens with Xero (optional, as tokens will expire)
      try {
        const tokens = connection.getDecryptedTokens();
        await axios.post('https://identity.xero.com/connect/revocation', {
          token: tokens.refreshToken,
          token_type_hint: 'refresh_token',
          client_id: this.config.oauth.clientId,
          client_secret: this.config.oauth.clientSecret
        });
      } catch (revokeError) {
        console.warn('Failed to revoke tokens with Xero:', revokeError.message);
      }
      
      // Update connection status
      connection.status = 'revoked';
      await connection.save();
      
      return connection;
    } catch (error) {
      console.error('Disconnect error:', error);
      throw new Error('Failed to disconnect Xero');
    }
  }
}

module.exports = new XeroService();