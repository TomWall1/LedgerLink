/**
 * Simple token store for Xero authentication tokens
 * In a production environment, you would use a database or secure storage solution
 */

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
    if (!this.tokens || !this.expiry) {
      console.log('No tokens available in store');
      return null;
    }

    // Check if tokens are expired
    if (new Date() > this.expiry) {
      console.log('Tokens have expired');
      
      // In a real implementation, you would refresh the tokens here
      // For simplicity, we'll just return null
      return null;
    }

    return this.tokens;
  }

  // Clear stored tokens
  clearTokens() {
    this.tokens = null;
    this.expiry = null;
    console.log('Tokens cleared from store');
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
