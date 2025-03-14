/**
 * Token store for Xero authentication tokens with refresh capability
 * In a production environment, you would use a database or secure storage solution
 */
import fetch from 'node-fetch';

class TokenStore {
  constructor() {
    this.tokens = null;
    this.expiry = null;
  }

  // Save tokens (in-memory implementation - would be replaced with database in production)
  saveTokens(tokens) {
    if (!tokens || !tokens.access_token) {
      console.error('Invalid tokens provided to tokenStore.saveTokens');
      return false;
    }

    this.tokens = tokens;
    
    // Calculate expiry time (subtract 5 minutes for safety margin)
    const expiresIn = tokens.expires_in || 1800; // Default to 30 minutes if not specified
    this.expiry = new Date(Date.now() + (expiresIn * 1000) - (5 * 60 * 1000));
    
    console.log(`Tokens saved, expires at ${this.expiry.toISOString()}`);
    return true;
  }

  // Get valid tokens or null if expired/not available
  async getValidTokens() {
    if (!this.tokens) {
      console.log('No tokens available in store');
      return null;
    }

    // Check if tokens are expired
    if (new Date() > this.expiry) {
      console.log('Tokens have expired, attempting to refresh');
      
      // Try to refresh the token
      if (this.tokens.refresh_token) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return this.tokens;
        }
      }
      
      console.log('Token refresh failed or no refresh token available');
      return null;
    }

    return this.tokens;
  }
  
  // Attempt to refresh the tokens
  async refreshTokens() {
    if (!this.tokens || !this.tokens.refresh_token) {
      return false;
    }
    
    try {
      console.log('Refreshing Xero token...');
      
      const response = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        return false;
      }

      const newTokens = await response.json();
      console.log('Token refresh successful:', {
        hasAccessToken: !!newTokens.access_token,
        hasRefreshToken: !!newTokens.refresh_token,
        expiresIn: newTokens.expires_in
      });

      // Save the new tokens
      this.saveTokens(newTokens);
      return true;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return false;
    }
  }
  
  // Synchronous check for tokens existence (useful for status check)
  hasTokens() {
    if (!this.tokens || !this.expiry) {
      return false;
    }
    
    // Check if tokens are expired
    if (new Date() > this.expiry) {
      return false;
    }
    
    return true;
  }

  // Clear stored tokens
  clearTokens() {
    this.tokens = null;
    this.expiry = null;
    console.log('Tokens cleared from store');
    return true;
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
