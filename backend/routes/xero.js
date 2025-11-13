/**
 * Xero API Routes
 * Handles all Xero-related HTTP endpoints
 */

import express from 'express';
import xeroService from '../services/xeroService.js';
import auth from '../middleware/auth.js';
import XeroConnection from '../models/XeroConnection.js';

const router = express.Router();

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
 * @route   GET /api/xero/connection-stats/:id
 * @desc    Get customer and vendor counts for a Xero connection
 * @access  Private
 */
router.get('/connection-stats/:id', auth, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;
    
    console.log('📊 GET /api/xero/connection-stats/:id - connectionId:', connectionId);
    
    // Get connection and verify ownership
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      console.log('❌ Connection not found');
      return res.json({
        success: false,
        error: 'Connection not found',
        data: {
          customers: 0,
          vendors: 0,
          totalContacts: 0
        }
      });
    }
    
    if (connection.status !== 'active') {
      console.log('⚠️ Connection not active:', connection.status);
      return res.json({
        success: false,
        error: 'Connection is not active. Please reconnect your Xero account.',
        data: {
          customers: 0,
          vendors: 0,
          totalContacts: 0
        }
      });
    }
    
    // Check if tokens are expired
    if (connection.isTokenExpired()) {
      console.log('⚠️ Tokens expired');
      return res.json({
        success: false,
        error: 'Authentication required. Please reconnect your Xero account.',
        data: {
          customers: 0,
          vendors: 0,
          totalContacts: 0
        }
      });
    }
    
    // Fetch contacts from Xero
    try {
      const contacts = await xeroService.getContacts(connection);
      console.log(`✅ Retrieved ${contacts.length} contacts`);
      
      // Count customers and vendors
      let customersCount = 0;
      let vendorsCount = 0;
      
      contacts.forEach(contact => {
        if (contact.IsCustomer) {
          customersCount++;
        }
        if (contact.IsSupplier) {
          vendorsCount++;
        }
      });
      
      console.log(`📊 Stats: ${customersCount} customers, ${vendorsCount} vendors`);
      
      res.json({
        success: true,
        data: {
          customers: customersCount,
          vendors: vendorsCount,
          totalContacts: contacts.length
        }
      });
    } catch (apiError) {
      console.error('❌ Error fetching contacts:', apiError);
      
      // Check if it's an authentication error
      if (apiError.message && apiError.message.includes('authentication')) {
        return res.json({
          success: false,
          error: 'Authentication required. Please reconnect your Xero account.',
          data: {
            customers: 0,
            vendors: 0,
            totalContacts: 0
          }
        });
      }
      
      // Other errors
      return res.json({
        success: false,
        error: 'Failed to fetch connection statistics. Please try again.',
        data: {
          customers: 0,
          vendors: 0,
          totalContacts: 0
        }
      });
    }
  } catch (error) {
    console.error('❌ Connection stats error:', error);
    res.json({
      success: false,
      error: 'Failed to fetch connection statistics',
      data: {
        customers: 0,
        vendors: 0,
        totalContacts: 0
      }
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
  console.log('🚀 ========== XERO INVOICES ENDPOINT HIT ==========');
  console.log('📥 Request Query:', req.query);
  console.log('👤 User ID:', req.user?.id);
  
  try {
    const { connectionId, page = 1, limit = 100, dateFrom, dateTo, status } = req.query;
    const userId = req.user.id;
    
    if (!connectionId) {
      console.log('❌ No connection ID provided');
      return res.status(400).json({ message: 'Connection ID is required' });
    }
    
    console.log('🔍 Looking for connection:', { connectionId, userId });
    
    // Get connection and verify ownership
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      console.log('❌ Connection not found');
      return res.status(404).json({ message: 'Xero connection not found' });
    }
    
    console.log('✅ Connection found:', {
      tenantId: connection.tenantId,
      tenantName: connection.tenantName,
      status: connection.status
    });
    
    if (connection.status !== 'active') {
      console.log('❌ Connection not active:', connection.status);
      return res.status(400).json({ message: 'Xero connection is not active' });
    }
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      dateFrom,
      dateTo,
      status
    };
    
    console.log('📋 Calling xeroService.getInvoices with filters:', filters);
    
    const invoices = await xeroService.getInvoices(connection, filters);
    
    console.log('✅ Got invoices from service:', {
      count: invoices.length,
      firstInvoice: invoices[0] ? {
        transaction_number: invoices[0].transaction_number,
        amount: invoices[0].amount,
        status: invoices[0].status,
        contact_name: invoices[0].contact_name
      } : 'No invoices'
    });
    
    const response = {
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: invoices.length
        }
      }
    };
    
    console.log('📤 Sending response with', invoices.length, 'invoices');
    
    res.json(response);
  } catch (error) {
    console.error('❌ Get invoices error:', error);
    console.error('Error stack:', error.stack);
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
 * @route   GET /api/xero/customers
 * @desc    Get customers from Xero (contacts where IsCustomer === true)
 * @access  Private
 */
router.get('/customers', auth, async (req, res) => {
  try {
    const { connectionId, page = 1, limit = 100 } = req.query;
    const userId = req.user.id;
    
    console.log('📞 GET /api/xero/customers - connectionId:', connectionId);
    
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
    
    // Get all contacts from Xero
    const allContacts = await xeroService.getContacts(connection, filters);
    console.log(`   Retrieved ${allContacts.length} total contacts from Xero`);
    
    // Filter to only customers (IsCustomer === true)
    const customers = allContacts.filter(contact => contact.IsCustomer === true);
    console.log(`   Filtered to ${customers.length} customers (IsCustomer === true)`);
    
    // Return as "customers" for frontend compatibility
    res.json({
      success: true,
      data: {
        customers: customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: customers.length
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers from Xero'
    });
  }
});

/**
 * @route   GET /api/xero/suppliers
 * @desc    Get suppliers from Xero (contacts where IsSupplier === true)
 * @access  Private
 */
router.get('/suppliers', auth, async (req, res) => {
  try {
    const { connectionId, page = 1, limit = 100 } = req.query;
    const userId = req.user.id;
    
    console.log('📞 GET /api/xero/suppliers - connectionId:', connectionId);
    
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
    
    // Get all contacts from Xero
    const allContacts = await xeroService.getContacts(connection, filters);
    console.log(`   Retrieved ${allContacts.length} total contacts from Xero`);
    
    // Filter to only suppliers (IsSupplier === true)
    const suppliers = allContacts.filter(contact => contact.IsSupplier === true);
    console.log(`   Filtered to ${suppliers.length} suppliers (IsSupplier === true)`);
    
    // Return as "suppliers" for frontend compatibility
    res.json({
      success: true,
      data: {
        suppliers: suppliers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: suppliers.length
        }
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch suppliers from Xero'
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

export default router;
