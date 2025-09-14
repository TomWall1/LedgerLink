/**
 * Xero Authentication Middleware
 * Handles Xero-specific authentication and connection validation
 */

const XeroConnection = require('../models/XeroConnection');
const xeroService = require('../services/xeroService');

/**
 * Middleware to validate Xero connection ownership and status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateXeroConnection = async (req, res, next) => {
  try {
    const connectionId = req.params.connectionId || req.body.connectionId || req.query.connectionId;
    const userId = req.user?.id;
    
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        message: 'Xero connection ID is required'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Find and validate connection
    const connection = await XeroConnection.findOne({
      _id: connectionId,
      userId
    }).select('+accessToken +refreshToken');
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Xero connection not found or access denied'
      });
    }
    
    // Check connection status
    if (connection.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Xero connection is ${connection.status}. Please reconnect to Xero.`,
        data: {
          status: connection.status,
          reconnectRequired: true
        }
      });
    }
    
    // Check if token is expired and try to refresh
    if (connection.isTokenExpired()) {
      try {
        await xeroService.refreshToken(connection);
      } catch (refreshError) {
        return res.status(401).json({
          success: false,
          message: 'Xero connection has expired. Please reconnect to Xero.',
          data: {
            status: 'expired',
            reconnectRequired: true
          }
        });
      }
    }
    
    // Add connection to request object for use in route handlers
    req.xeroConnection = connection;
    next();
    
  } catch (error) {
    console.error('Xero connection validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate Xero connection'
    });
  }
};

/**
 * Middleware to check if user has any active Xero connections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requireXeroConnection = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const companyId = req.query.companyId || req.body.companyId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Check for active connections
    const connections = await xeroService.getUserConnections(userId, companyId);
    const activeConnections = connections.filter(conn => conn.status === 'active');
    
    if (activeConnections.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No active Xero connections found. Please connect to Xero first.',
        data: {
          hasConnections: connections.length > 0,
          connectionsNeedReauth: connections.some(c => c.status === 'expired'),
          setupRequired: true
        }
      });
    }
    
    // Add connections to request for convenience
    req.xeroConnections = activeConnections;
    next();
    
  } catch (error) {
    console.error('Xero connection requirement check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Xero connection requirements'
    });
  }
};

/**
 * Middleware to handle Xero API rate limiting at the application level
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const xeroRateLimit = async (req, res, next) => {
  try {
    const tenantId = req.xeroConnection?.tenantId;
    
    if (!tenantId) {
      return next(); // Skip if no Xero connection
    }
    
    // The rate limiting logic is handled in the XeroService
    // This middleware could be extended for additional rate limiting logic
    // like per-user limits or endpoint-specific limits
    
    next();
  } catch (error) {
    console.error('Xero rate limit middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Rate limit processing error'
    });
  }
};

/**
 * Middleware to log Xero API usage for monitoring
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const logXeroUsage = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log API usage
    if (req.xeroConnection) {
      const logData = {
        timestamp: new Date(),
        userId: req.user?.id,
        tenantId: req.xeroConnection.tenantId,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      };
      
      // In production, you might want to send this to a logging service
      console.log('Xero API Usage:', JSON.stringify(logData));
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Error handler specifically for Xero-related errors
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handleXeroErrors = (error, req, res, next) => {
  // Check if this is a Xero-related error
  if (req.path.startsWith('/api/xero') || error.isXeroError) {
    console.error('Xero API Error:', {
      error: error.message,
      stack: error.stack,
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id,
      tenantId: req.xeroConnection?.tenantId
    });
    
    // Handle specific Xero error types
    if (error.message.includes('authentication') || error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        message: 'Xero authentication failed. Please reconnect to Xero.',
        data: { reconnectRequired: true }
      });
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return res.status(429).json({
        success: false,
        message: 'Xero API rate limit exceeded. Please try again later.',
        data: { retryAfter: 60 }
      });
    }
    
    if (error.message.includes('tenant') || error.message.includes('organization')) {
      return res.status(400).json({
        success: false,
        message: 'Xero organization access error. Please check your connection.',
        data: { reconnectRequired: true }
      });
    }
    
    // Generic Xero error
    return res.status(500).json({
      success: false,
      message: 'Xero API error occurred. Please try again.',
      data: { 
        error: error.message,
        isXeroError: true
      }
    });
  }
  
  // Not a Xero error, pass to next error handler
  next(error);
};

module.exports = {
  validateXeroConnection,
  requireXeroConnection,
  xeroRateLimit,
  logXeroUsage,
  handleXeroErrors
};