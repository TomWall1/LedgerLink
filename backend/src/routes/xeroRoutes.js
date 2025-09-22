import express from 'express';
import { tokenStore } from '../utils/tokenStore.js';

console.log('🔍 XERO ROUTES: Starting to load xeroRoutes.js module');

const router = express.Router();

console.log('🔍 XERO ROUTES: Express router created');

// Auth status endpoint that the frontend expects
router.get('/auth-status', async (req, res) => {
  console.log('🔍 XERO ROUTES: /auth-status endpoint called');
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
  console.log('🔍 XERO ROUTES: /health endpoint called');
  res.json({
    status: 'ok',
    service: 'xero-routes',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint  
router.get('/test', (req, res) => {
  console.log('🔍 XERO ROUTES: /test endpoint called');
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

console.log('🔍 XERO ROUTES: All route handlers defined');

// Try to import existing xero auth routes - using regular import
try {
  console.log('🔍 XERO ROUTES: Attempting to import xeroAuth.js');
  import('./xeroAuth.js').then(xeroAuthModule => {
    console.log('🔍 XERO ROUTES: Successfully imported xeroAuth.js');
    router.use('/', xeroAuthModule.default);
    console.log('🔍 XERO ROUTES: Mounted xeroAuth routes');
  }).catch(error => {
    console.error('🚨 XERO ROUTES: Failed to import xeroAuth.js:', error);
  });
} catch (error) {
  console.error('🚨 XERO ROUTES: Error setting up xeroAuth import:', error);
}

console.log('🔍 XERO ROUTES: xeroRoutes.js module fully loaded');

export default router;