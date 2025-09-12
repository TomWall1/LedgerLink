// Middleware to ensure user is authenticated with Xero
const requireXeroAuth = (req, res, next) => {
  // Check if user has valid Xero session
  if (!req.session.xeroTokenSet) {
    return res.status(401).json({
      error: 'Not authenticated with Xero',
      message: 'Please connect to Xero first'
    });
  }
  
  // Check if token has expired
  const tokenSet = req.session.xeroTokenSet;
  if (tokenSet.expires_at && new Date(tokenSet.expires_at) < new Date()) {
    return res.status(401).json({
      error: 'Xero token expired',
      message: 'Please reconnect to Xero'
    });
  }
  
  next();
};

module.exports = {
  requireXeroAuth
};