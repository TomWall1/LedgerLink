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

// Import existing xero auth routes using regular import
import xeroAuthRouter from './xeroAuth.js';
router.use('/', xeroAuthRouter);

export default router;