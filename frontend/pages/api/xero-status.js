// Create a proxy endpoint to avoid CORS issues
export default async function handler(req, res) {
  // Log the beginning of the request
  console.log('Proxy endpoint accessed with method:', req.method);
  
  try {
    // Set CORS headers to allow any origin for this proxy endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Pragma, Cache-Control');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return res.status(204).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      console.log('Method not allowed: ' + req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Make the request to the backend API
    // The API_URL environment variable might not be set correctly
    const apiUrl = 'https://ledgerlink.onrender.com'; // Hardcoded for reliability
    console.log(`Proxying request to ${apiUrl}/auth/xero/status`);
    
    // Using a more basic fetch approach with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${apiUrl}/auth/xero/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if request completes
      
      // Log response status
      console.log('Backend response status:', response.status);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend returned error ${response.status}: ${errorText}`);
        return res.status(response.status).json({ 
          error: `Backend returned error: ${response.status}`,
          details: errorText 
        });
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Successfully proxied Xero status request', data);
      
      // Return the response to the client
      return res.status(200).json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId); // Clear the timeout on error
      
      console.error('Fetch error:', fetchError.name, fetchError.message);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          error: 'Gateway Timeout',
          details: 'Request to backend timed out after 10 seconds'
        });
      }
      
      return res.status(500).json({
        error: 'Failed to reach backend API',
        details: fetchError.message,
        name: fetchError.name
      });
    }
  } catch (error) {
    console.error('Error in proxy handler:', error.name, error.message, error.stack);
    return res.status(500).json({ 
      error: 'Proxy API error',
      details: error.message,
      stack: error.stack
    });
  }
}
