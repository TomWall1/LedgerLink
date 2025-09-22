import express from 'express';
import { tokenStore } from '../utils/tokenStore.js';

const router = express.Router();

// Auth status endpoint that the frontend expects
router.get('/auth-status', async (req, res) => {
  try {
    console.log('Auth status endpoint accessed via /auth-status');
    
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

// Health endpoint for testing
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xero-routes',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint  
router.get('/test', (req, res) => {
  res.json({
    message: 'Xero routes working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      'auth-status': '/api/xero/auth-status',
      'health': '/api/xero/health',
      'test': '/api/xero/test'
    }
  });
});

// Import and mount the existing xero auth routes
try {
  const { default: xeroAuthRouter } = await import('./xeroAuth.js');
  router.use('/', xeroAuthRouter);
  console.log('Successfully imported xeroAuth routes');
} catch (error) {
  console.error('Failed to import xeroAuth routes:', error);
  // Continue without the additional auth routes if they fail to load
}

export default router;