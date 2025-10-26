/**
 * Coupa Authentication Middleware
 * 
 * This middleware checks that Coupa credentials are properly configured
 * before allowing API calls to proceed.
 */

const authenticateCoupa = (req, res, next) => {
  try {
    // Check if required environment variables are set
    const requiredVars = ['COUPA_API_BASE_URL'];
    const missingVars = [];
    
    // Check for base URL (always required)
    if (!process.env.COUPA_API_BASE_URL) {
      missingVars.push('COUPA_API_BASE_URL');
    }
    
    // Check for authentication method
    const hasApiKey = process.env.COUPA_API_KEY;
    const hasOAuthCreds = process.env.COUPA_CLIENT_ID && process.env.COUPA_CLIENT_SECRET;
    
    if (!hasApiKey && !hasOAuthCreds) {
      return res.status(400).json({
        success: false,
        message: 'Coupa credentials not configured',
        details: 'Either COUPA_API_KEY or both COUPA_CLIENT_ID and COUPA_CLIENT_SECRET must be set',
        missingCredentials: {
          apiKey: !hasApiKey,
          oauthClientId: !process.env.COUPA_CLIENT_ID,
          oauthClientSecret: !process.env.COUPA_CLIENT_SECRET
        }
      });
    }
    
    if (missingVars.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Coupa configuration',
        missingVariables: missingVars
      });
    }
    
    // Validate base URL format
    try {
      new URL(process.env.COUPA_API_BASE_URL);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid COUPA_API_BASE_URL format',
        details: 'Base URL must be a valid URL (e.g., https://your-instance.coupahost.com)'
      });
    }
    
    // Add Coupa configuration to request for use in routes
    req.coupaConfig = {
      baseURL: process.env.COUPA_API_BASE_URL,
      hasApiKey: !!hasApiKey,
      hasOAuth: !!hasOAuthCreds,
      authMethod: hasApiKey ? 'api-key' : 'oauth'
    };
    
    console.log(`Coupa auth check passed - using ${req.coupaConfig.authMethod} authentication`);
    
    next();
    
  } catch (error) {
    console.error('Coupa authentication middleware error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error validating Coupa configuration',
      error: error.message
    });
  }
};

/**
 * Middleware to validate request data for Coupa operations
 */
const validateCoupaRequest = (req, res, next) => {
  try {
    // Add request validation here if needed
    // For example, validate date formats, required fields, etc.
    
    // Validate date formats if provided
    if (req.body.startDate) {
      const startDate = new Date(req.body.startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format',
          details: 'Date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
        });
      }
    }
    
    if (req.body.endDate) {
      const endDate = new Date(req.body.endDate);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format',
          details: 'Date must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
        });
      }
    }
    
    // Validate date range
    if (req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range',
          details: 'startDate must be before endDate'
        });
      }
    }
    
    // Validate limit parameter
    if (req.body.limit !== undefined) {
      const limit = parseInt(req.body.limit);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter',
          details: 'Limit must be a number between 1 and 1000'
        });
      }
    }
    
    // Validate offset parameter
    if (req.body.offset !== undefined) {
      const offset = parseInt(req.body.offset);
      if (isNaN(offset) || offset < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid offset parameter',
          details: 'Offset must be a number greater than or equal to 0'
        });
      }
    }
    
    next();
    
  } catch (error) {
    console.error('Coupa request validation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error validating request data',
      error: error.message
    });
  }
};

/**
 * Rate limiting middleware for Coupa API calls
 */
const rateLimitCoupa = (req, res, next) => {
  // In a production environment, you would implement proper rate limiting here
  // For now, we'll just log and continue
  
  console.log(`Coupa API request: ${req.method} ${req.path}`);
  
  // Add rate limiting headers for client information
  res.set({
    'X-RateLimit-Limit': process.env.COUPA_RATE_LIMIT_PER_MINUTE || '60',
    'X-RateLimit-Window': '60' // seconds
  });
  
  next();
};

export {
  authenticateCoupa,
  validateCoupaRequest,
  rateLimitCoupa
};
