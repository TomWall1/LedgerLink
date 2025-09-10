/**
 * Coupa Authentication Service
 * 
 * This service handles authentication with the Coupa API.
 * Think of this as the "key" that unlocks access to Coupa's data.
 */

const axios = require('axios');

class CoupaAuthService {
  constructor() {
    // These are the "addresses" and "keys" for connecting to Coupa
    this.baseURL = process.env.COUPA_API_BASE_URL;
    this.clientId = process.env.COUPA_CLIENT_ID;
    this.clientSecret = process.env.COUPA_CLIENT_SECRET;
    this.apiKey = process.env.COUPA_API_KEY;
    
    // Storage for the access token (like a temporary pass)
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get Access Token using OAuth 2.0
   * 
   * OAuth is like getting a temporary pass to access Coupa's data.
   * This method exchanges your credentials for that temporary pass.
   */
  async getAccessToken() {
    try {
      // Check if we already have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('Getting new access token from Coupa...');

      const response = await axios.post(`${this.baseURL}/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'core.invoice.read core.supplier.read'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      // Store the token and when it expires
      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      console.log('Successfully obtained Coupa access token');
      return this.accessToken;

    } catch (error) {
      console.error('Failed to get Coupa access token:', error.message);
      throw new Error(`Coupa authentication failed: ${error.message}`);
    }
  }

  /**
   * Validate API Key Authentication
   * 
   * Some Coupa instances use API keys instead of OAuth.
   * This method tests if your API key works.
   */
  async validateApiKey() {
    try {
      console.log('Validating Coupa API key...');

      const response = await axios.get(`${this.baseURL}/api/invoices?limit=1`, {
        headers: {
          'X-COUPA-API-KEY': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('Coupa API key validation successful');
      return true;

    } catch (error) {
      console.error('Coupa API key validation failed:', error.message);
      throw new Error(`Coupa API key validation failed: ${error.message}`);
    }
  }

  /**
   * Get Authentication Headers
   * 
   * This creates the headers needed for API requests.
   * Think of headers as the "letterhead" on official documents.
   */
  async getAuthHeaders() {
    try {
      if (this.apiKey) {
        // Use API key authentication
        return {
          'X-COUPA-API-KEY': this.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };
      } else {
        // Use OAuth token authentication
        const token = await this.getAccessToken();
        return {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };
      }
    } catch (error) {
      console.error('Failed to get auth headers:', error.message);
      throw error;
    }
  }

  /**
   * Test Connection to Coupa
   * 
   * This is like a "ping" to make sure we can reach Coupa
   * and our credentials work.
   */
  async testConnection() {
    try {
      console.log('Testing connection to Coupa...');
      
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(`${this.baseURL}/api/invoices?limit=1`, {
        headers,
        timeout: 30000
      });

      console.log('Coupa connection test successful');
      return {
        success: true,
        message: 'Successfully connected to Coupa API',
        statusCode: response.status
      };

    } catch (error) {
      console.error('Coupa connection test failed:', error.message);
      
      let errorMessage = 'Connection to Coupa failed';
      
      if (error.response) {
        // Coupa responded with an error
        errorMessage = `Coupa API error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.code === 'ENOTFOUND') {
        // Can't reach the server
        errorMessage = 'Cannot reach Coupa server. Check the base URL.';
      } else if (error.code === 'ECONNREFUSED') {
        // Server refused connection
        errorMessage = 'Coupa server refused connection.';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }
}

module.exports = CoupaAuthService;
