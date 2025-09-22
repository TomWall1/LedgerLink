import express from 'express';
import xeroAuthRouter from './xeroAuth.js';

const router = express.Router();

// Mount all the existing Xero authentication routes
router.use('/', xeroAuthRouter);

// Add the specific /auth-status endpoint that the frontend expects
// This is an alias for the existing /status endpoint
router.get('/auth-status', async (req, res) => {
  try {
    console.log('Auth status endpoint accessed via /auth-status');
    
    // Get the existing auth checking logic from xeroAuth.js
    const { tokenStore } = await import('../utils/tokenStore.js');
    
    // Check if we have valid tokens
    const tokens = await tokenStore.getValidTokens();
    console.log('Auth status response:', tokens ? 'Authenticated' : 'Not authenticated');
    
    res.json({
      isAuthenticated: !!tokens,
      status: tokens ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      details: error.message,
      isAuthenticated: false
    });
  }
});

export default router;