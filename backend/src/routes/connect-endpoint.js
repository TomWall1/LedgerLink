// Initial Xero connection route
router.get('/connect', async (req, res) => {
  try {
    // Log detailed information about the request
    console.log('Connect endpoint accessed from:', {
      origin: req.headers.origin,
      host: req.headers.host,
      method: req.method,
      path: req.path,
      query: req.query
    });
    
    // CORS headers for this specific route - EXPANDED HEADERS LIST
    // Make sure we're very explicit about the allowed origin
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, X-CSRF-Token, X-Auth-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Add cache control headers to prevent caching
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    console.log('Connect endpoint accessed - checking environment variables:', {
      clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Not Set',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Not Set',
      redirectUri: process.env.XERO_REDIRECT_URI
    });
    
    // Generate a random state for security
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.add(state);
    
    // Get the current redirect URI from the environment
    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledgerlink.onrender.com/auth/xero/callback';
    console.log('Using redirect URI:', redirectUri);
    
    // Update the XeroClient with the correct redirect URI
    xero.config.redirectUris = [redirectUri];
    
    // Generate consent URL
    const consentUrl = await xero.buildConsentUrl();
    const url = new URL(consentUrl);
    url.searchParams.set('state', state);
    
    console.log('Generated consent URL:', { url: url.toString(), state });
    res.json({ url: url.toString() });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({
      error: 'Failed to initialize Xero connection',
      details: error.message
    });
  }
});