const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Main authentication middleware
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For development/testing with demo token
    if (token === 'demo_token_123' && process.env.NODE_ENV === 'development') {
      req.user = {
        _id: 'user_123',
        id: 'user_123',
        userId: 'user_123',
        email: 'demo@ledgerlink.com',
        name: 'Demo User',
        companyId: 'company_123'
      };
      req.userId = 'user_123';
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Access denied. User not found or inactive.' });
    }
    
    // Add user info to request
    req.userId = user._id;
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access denied. Token expired.' });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
};

/**
 * Alias for auth middleware to match the matching routes requirement
 */
const requireAuth = auth;

/**
 * Optional authentication middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.substring(7);
    
    // For development/testing with demo token
    if (token === 'demo_token_123' && process.env.NODE_ENV === 'development') {
      req.user = {
        _id: 'user_123',
        id: 'user_123',
        userId: 'user_123',
        email: 'demo@ledgerlink.com',
        name: 'Demo User',
        companyId: 'company_123'
      };
      req.userId = 'user_123';
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.userId = user._id;
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Invalid token, continue without authentication
    console.log('Optional auth: Invalid token, continuing without authentication');
    next();
  }
};

module.exports = auth;
module.exports.requireAuth = requireAuth;
module.exports.optionalAuth = optionalAuth;