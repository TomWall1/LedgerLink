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

// Define multiple possible storage locations to handle different environments
const possiblePaths = [
  // Standard path relative to this file
  path.join(__dirname, '..', '..', 'data', 'xero-tokens.json'),
  // Render.com specific path (ensure it's writable)
  '/tmp/xero-tokens.json',
  // Fallback path in case the data directory can't be created
  path.join(process.cwd(), 'xero-tokens.json')
];

class TokenStore {
  constructor() {
    this.tokens = null;
    this.expiry = null;
    this.tokenFilePath = null;
    this.initializeTokenStore();
  }

  // Initialize the token store and ensure a writable location exists
  initializeTokenStore() {
    try {
      // Try each possible path until we find one that works
      for (const potentialPath of possiblePaths) {
        try {
          // For paths with directories, make sure the directory exists
          const dirPath = path.dirname(potentialPath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory for token storage: ${dirPath}`);
          }
          
          // Test if we can write to this location
          const testFile = path.join(dirPath, '.write-test');
          fs.writeFileSync(testFile, 'test', 'utf8');
          fs.unlinkSync(testFile); // Clean up test file
          
          // This path works, let's use it
          this.tokenFilePath = potentialPath;
          console.log(`Using token file path: ${this.tokenFilePath}`);
          break;
        } catch (err) {
          console.warn(`Cannot use path ${potentialPath} for token storage: ${err.message}`);
          // Continue to the next path
        }
      }
      
      if (!this.tokenFilePath) {
        // If none of the paths worked, use memory-only storage
        console.error('Could not find a writable location for token storage. Using memory-only storage (tokens will not persist across restarts).');
      } else {
        // Load tokens from the selected file path
        this.loadTokensFromFile();
      }
    } catch (error) {
      console.error('Error initializing token store:', error);
    }
  }

  // Return the token file path (for debug info)
  getTokenFilePath() {
    return this.tokenFilePath;
  }

  // Load tokens from file
  loadTokensFromFile() {
    try {
      if (this.tokenFilePath && fs.existsSync(this.tokenFilePath)) {
        const data = fs.readFileSync(this.tokenFilePath, 'utf8');
        const storedData = JSON.parse(data);
        
        if (storedData && storedData.tokens) {
          this.tokens = storedData.tokens;
          this.expiry = new Date(storedData.expiry);
          console.log(`Loaded tokens from file, expires at ${this.expiry.toISOString()}`);
          
          // Check if the token is expired immediately
          if (this.isExpired()) {
            console.log('Loaded token is expired, attempting to refresh');
            // Schedule token refresh (not awaiting to avoid blocking constructor)
            this.refreshTokens().then(success => {
              if (success) {
                console.log('Successfully refreshed expired token during initialization');
              } else {
                console.error('Failed to refresh expired token during initialization');
              }
            });
          }
        }
      } else {
        console.log('No token file exists yet');
      }
    } catch (error) {
      console.error('Error loading tokens from file:', error);
    }
  }
  
  // Check if the current token is expired
  isExpired() {
    if (!this.expiry) return true;
    
    // Add some logging to help diagnose expiry issues
    const now = new Date();
    const isExpired = now > this.expiry;
    console.log('Token expiry check:', {
      currentTime: now.toISOString(),
      expiryTime: this.expiry.toISOString(),
      isExpired: isExpired
    });
    
    return isExpired;
  }

  // Save tokens to file
  saveTokensToFile() {
    try {
      // If we don't have a token file path, we can't save to file
      if (!this.tokenFilePath) {
        console.warn('Token file path not set, cannot save tokens to file');
        return false;
      }

      const data = JSON.stringify({
        tokens: this.tokens,
        expiry: this.expiry
      }, null, 2);
      
      fs.writeFileSync(this.tokenFilePath, data, 'utf8');
      console.log(`Saved tokens to file at ${this.tokenFilePath}, expires at ${this.expiry.toISOString()}`);
      return true;
    } catch (error) {
      console.error(`Error saving tokens to file (${this.tokenFilePath}):`, error);
      return false;
    }
  }

  // Save tokens (in-memory and to file)
  saveTokens(tokens) {
    try {
      if (!tokens) {
        console.error('Null tokens provided to tokenStore.saveTokens');
        return false;
      }
      
      if (!tokens.access_token) {
        console.error('Invalid tokens provided to tokenStore.saveTokens (missing access_token)');
        return false;
      }

      this.tokens = tokens;
      
      // Calculate expiry time (subtract 5 minutes for safety margin)
      const expiresIn = tokens.expires_in || 1800; // Default to 30 minutes if not specified
      this.expiry = new Date(Date.now() + (expiresIn * 1000) - (5 * 60 * 1000));
      
      // Only try to save to file if we have a token file path
      let saved = false;
      if (this.tokenFilePath) {
        saved = this.saveTokensToFile();
      }
      
      if (saved) {
        console.log(`Tokens saved successfully to ${this.tokenFilePath}, expires at ${this.expiry.toISOString()}`);
      } else {
        console.warn('Tokens saved in memory only');
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveTokens:', error);
      return false;
    }
  }

  // Get valid tokens or null if expired/not available
  async getValidTokens() {
    // First attempt: only return existing valid tokens
    if (this.tokens && !this.isExpired()) {
      console.log('Returning valid tokens directly');
      return this.tokens;
    }

    // No tokens, or tokens are expired
    if (!this.tokens) {
      console.log('No tokens available in store');
      return null;
    }

    console.log('Tokens have expired, attempting to refresh');
      
    // Try to refresh the token
    if (this.tokens.refresh_token) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        console.log('Token refresh successful, returning new tokens');
        return this.tokens;
      }
    }
      
    console.log('Token refresh failed or no refresh token available');
    return null;
  }
  
  // Attempt to refresh the tokens
  async refreshTokens() {
    if (!this.tokens || !this.tokens.refresh_token) {
      console.log('Cannot refresh tokens: No refresh token available');
      return false;
    }
    
    try {
      console.log('Refreshing Xero token...');
      
      // Check that environment variables are available
      if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
        console.error('Missing XERO_CLIENT_ID or XERO_CLIENT_SECRET environment variables');
        return false;
      }
      
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
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        console.error('Token refresh failed:', response.status, errorText);
        return false;
      }

      const newTokens = await response.json();
      console.log('Token refresh successful:', {
        hasAccessToken: !!newTokens.access_token,
        hasRefreshToken: !!newTokens.refresh_token,
        expiresIn: newTokens.expires_in
      });

      // Save the new tokens
      return this.saveTokens(newTokens);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return false;
    }
  }
  
  // Synchronous check for tokens existence (useful for status check)
  hasTokens() {
    try {
      // Check if the token file exists
      if (this.tokenFilePath && fs.existsSync(this.tokenFilePath)) {
        // If we don't have tokens in memory, try to load them
        if (!this.tokens) {
          this.loadTokensFromFile();
        }
      }

      // More detailed checks for token validity
      if (!this.tokens) {
        console.log('hasTokens: No tokens object exists');
        return false;
      }
      
      if (!this.tokens.access_token) {
        console.log('hasTokens: No access token found');
        return false;
      }
      
      if (!this.tokens.refresh_token) {
        console.log('hasTokens: No refresh token found');
        return false;
      }
      
      if (!this.expiry) {
        console.log('hasTokens: No expiry time set');
        return false;
      }

      // For status check, we'll be lenient about expiry
      // as we can always refresh expired tokens if we have a refresh token
      console.log('hasTokens: Found valid token structure (may need refresh)');
      return true;
    } catch (error) {
      console.error('Error in hasTokens check:', error);
      return false;
    }
  }

  // Clear stored tokens
  async clearTokens() {
    this.tokens = null;
    this.expiry = null;
    
    // Clear the token file if it exists
    try {
      if (this.tokenFilePath && fs.existsSync(this.tokenFilePath)) {
        fs.unlinkSync(this.tokenFilePath);
        console.log(`Token file deleted: ${this.tokenFilePath}`);
      }
    } catch (error) {
      console.error(`Error deleting token file (${this.tokenFilePath}):`, error);
    }
    
    console.log('Tokens cleared from store');
    return true;
  }
}

// Export singleton instance
export const tokenStore = new TokenStore();
