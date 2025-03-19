// DEBUG ENDPOINT: Check token status with enhanced details
router.get('/debug-auth', (req, res) => {
  try {
    // CORS headers for this specific route - EXPANDED HEADERS LIST
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, X-CSRF-Token, X-Auth-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Add cache control headers to prevent caching
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Gather more detailed token info
    const now = new Date();
    const tokenStatus = {
      hasTokens: tokenStore.hasTokens(),
      expiry: tokenStore.expiry,
      isExpired: tokenStore.expiry ? now > tokenStore.expiry : true,
      timeUntilExpiry: tokenStore.expiry ? Math.floor((tokenStore.expiry - now) / 1000) + ' seconds' : 'N/A',
      hasAccessToken: !!tokenStore.tokens?.access_token,
      hasRefreshToken: !!tokenStore.tokens?.refresh_token,
      tokenType: tokenStore.tokens?.token_type || 'none',
      currentTime: now,
      fileStatus: fs.existsSync(TOKEN_FILE_PATH) ? 'exists' : 'missing',
      tokenFileLocation: TOKEN_FILE_PATH,
    };
    
    // Check if tokens are present but reported as invalid
    const hasSomeTokenData = !!tokenStore.tokens?.access_token || !!tokenStore.tokens?.refresh_token;
    if (hasSomeTokenData && !tokenStatus.hasTokens) {
      tokenStatus.hasSomeTokenData = true;
      tokenStatus.possibleIssue = 'Tokens present but reported as invalid';
      
      // If we have tokens but they're reported as invalid, let's try to save them again
      if (tokenStore.tokens?.access_token && tokenStore.tokens?.refresh_token && tokenStore.tokens?.expires_in) {
        const reSaved = tokenStore.saveTokens(tokenStore.tokens);
        tokenStatus.attemptedReSave = reSaved;
      }
    }
    
    res.json({
      status: 'Debug information',
      tokenInfo: tokenStatus
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch debug information',
      details: error.message,
      stack: error.stack
    });
  }
});