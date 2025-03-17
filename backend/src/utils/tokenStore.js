/**
 * Token store for Xero authentication tokens with refresh capability
 * In a production environment, you would use a database or secure storage solution
 */
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'xero-tokens.json');

class TokenStore {
  constructor() {
    this.tokens = null;
    this.expiry = null;
    this.initializeTokenStore();
  }

  // Initialize the token store and ensure the data directory exists
  initializeTokenStore() {
    try {
      // Make sure the data directory exists
      const dataDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory for token storage');
      }
      
      // Try to load tokens from file
      this.loadTokensFromFile();
    } catch (error) {
      console.error('Error initializing token store:', error);
    }
  }

  // Load tokens from file
  loadTokensFromFile() {
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
        const storedData = JSON.parse(data);
        
        if (storedData && storedData.tokens) {
          this.tokens = storedData.tokens;
          this.expiry = new Date(storedData.expiry);
          console.log(`Loaded tokens from file, expires at ${this.expiry.toISOString()}`);
        }
      } else {
        console.log('No token file exists yet');
      }
    } catch (error) {
      console.error('Error loading tokens from file:', error);
    }
  }

  // Save tokens to file
  saveTokensToFile() {
    try {
      const data = JSON.stringify({
        tokens: this.tokens,
        expiry: this.expiry
      }, null, 2);
      
      fs.writeFileSync(TOKEN_FILE_PATH, data, 'utf8');
      console.log(`Saved tokens to file, expires at ${this.expiry.toISOString()}`);
    } catch (error) {
      console.error('Error saving tokens to file:', error);
    }
  }

  // Save tokens (in-memory and to file)
  saveTokens(tokens) {
    if (!tokens || !tokens.access_token) {
      console.error('Invalid tokens provided to tokenStore.saveTokens');
      return false;
    }

    this.tokens = tokens;
    
    // Calculate expiry time (subtract 5 minutes for safety margin)
    const expiresIn = tokens.expires_in || 1800; // Default to 30 minutes if not specified
    this.expiry = new Date(Date.now() + (expiresIn * 1000) - (5 * 60 * 1000));
    
    // Save to file for persistence
    this.saveTokensToFile();
    
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
    
    // Clear the token file if it exists
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        fs.unlinkSync(TOKEN_FILE_PATH);
        console.log('Token file deleted');
      }
    } catch (error) {
      console.error('Error deleting token file:', error);
    }
    
    console.log('Tokens cleared from store');
    return true;
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
