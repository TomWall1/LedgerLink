/**
 * Xero API Routes
 * Handles all Xero-related HTTP endpoints
 */

const express = require('express');
const router = express.Router();
const xeroService = require('../services/xeroService');
const auth = require('../middleware/auth'); // Assuming auth middleware exists
const XeroConnection = require('../models/XeroConnection');

/**
 * @route   GET /api/xero/auth
 * @desc    Initiate Xero OAuth flow
 * @access  Private
 */
router.get('/auth', auth, async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.user.id;
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }
    
    const authData = xeroService.generateAuthUrl(userId, companyId);
    
    res.json({
      success: true,
      data: {
        authUrl: authData.url,
        state: authData.state
      }
    });
  } catch (error) {
    console.error('Xero auth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Xero connection'
    });
  }
});

/**
 * @route   GET /api/xero/callback
 * @desc    Handle Xero OAuth callback
 * @access  Public (but state-protected)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/connections?error=oauth_error&message=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/connections?error=invalid_callback`);
    }
    
    const connections = await xeroService.handleCallback(code, state);
    
    // Redirect to frontend with success message
    const connectionNames = connections.map(c => c.tenantName).join(', ');
    res.redirect(`${process.env.FRONTEND_URL}/connections?success=true&connected=${encodeURIComponent(connectionNames)}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/connections?error=connection_failed&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @route   GET /api/xero/connections
 * @desc    Get user's Xero connections
 * @access  Private
 */
router.get('/connections', auth, async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.user.id;
    
    const connections = await xeroService.getUserConnections(userId, companyId);
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Xero connections'
    });
  }
});

/**
 * @route   DELETE /api/xero/connections/:id
 * @desc    Disconnect Xero connection
 * @access  Private
 */
router.delete('/connections/:id', auth, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;
    
    await xeroService.disconnectXero(connectionId, userId);
    
    res.json({
      success: true,
      message: 'Xero connection disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect Xero'
    });
  }
});

/**
 * @route   GET /api/xero/invoices
 * @desc    Get invoices from Xero
 * @access  Private
 */
router.get('/invoices', auth, async (req, res) => {
  try {
    const { connectionId, page = 1, limit = 100, dateFrom, dateTo, status } = req.query;
    const userId = req.user.id;
    
    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    // Get connection and verify ownership
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      return res.status(404).json({ message: 'Xero connection not found' });
    }
    
    if (connection.status !== 'active') {
      return res.status(400).json({ message: 'Xero connection is not active' });
    }
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      dateFrom,
      dateTo,
      status
    };
    
    const invoices = await xeroService.getInvoices(connection, filters);
    
    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: invoices.length
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invoices from Xero'
    });
  }
});

/**
 * @route   GET /api/xero/contacts
 * @desc    Get contacts from Xero
 * @access  Private
 */
router.get('/contacts', auth, async (req, res) => {
  try {
    const { connectionId, page = 1, limit = 100 } = req.query;
    const userId = req.user.id;
    
    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    // Get connection and verify ownership
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      return res.status(404).json({ message: 'Xero connection not found' });
    }
    
    if (connection.status !== 'active') {
      return res.status(400).json({ message: 'Xero connection is not active' });
    }
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const contacts = await xeroService.getContacts(connection, filters);
    
    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: contacts.length
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contacts from Xero'
    });
  }
});

/**
 * @route   POST /api/xero/sync
 * @desc    Trigger manual sync with Xero
 * @access  Private
 */
router.post('/sync', auth, async (req, res) => {
  try {
    const { connectionId } = req.body;
    const userId = req.user.id;
    
    if (!connectionId) {
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    // Get connection and verify ownership
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      return res.status(404).json({ message: 'Xero connection not found' });
    }
    
    if (connection.status !== 'active') {
      return res.status(400).json({ message: 'Xero connection is not active' });
    }
    
    // Trigger sync (this could be moved to a background job)
    try {
      await xeroService.syncOrganizationSettings(connection);
      
      // Update sync timestamp
      connection.lastSyncAt = new Date();
      connection.lastSyncStatus = 'success';
      await connection.save();
      
      res.json({
        success: true,
        message: 'Sync completed successfully',
        data: {
          lastSyncAt: connection.lastSyncAt,
          status: connection.lastSyncStatus
        }
      });
    } catch (syncError) {
      await connection.markAsError(syncError.message);
      throw syncError;
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync with Xero'
    });
  }
});

/**
 * @route   GET /api/xero/health
 * @desc    Check Xero connection health
 * @access  Private
 */
router.get('/health/:id', auth, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;
    
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      return res.status(404).json({ message: 'Xero connection not found' });
    }
    
    const health = {
      connectionId: connection._id,
      tenantName: connection.tenantName,
      status: connection.status,
      isExpired: connection.isTokenExpired(),
      lastSyncAt: connection.lastSyncAt,
      lastSyncStatus: connection.lastSyncStatus,
      recentErrors: connection.syncErrors.slice(-3) // Last 3 errors
    };
    
    // Try to make a simple API call to test connectivity
    try {
      await xeroService.makeApiRequest(connection, '/Organisation');
      health.apiConnectivity = 'ok';
    } catch (apiError) {
      health.apiConnectivity = 'error';
      health.apiError = apiError.message;
    }
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection health'
    });
  }
});

module.exports = router;