// Create a proxy endpoint to avoid CORS issues
export default async function handler(req, res) {
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
    const apiUrl = process.env.API_URL || 'https://ledgerlink.onrender.com';
    console.log(`Proxying request to ${apiUrl}/auth/xero/status`);
    
    try {
      const response = await fetch(`${apiUrl}/auth/xero/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
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
      console.error('Fetch error:', fetchError);
      return res.status(500).json({
        error: 'Failed to reach backend API',
        details: fetchError.message
      });
    }
  } catch (error) {
    console.error('Error in proxy handler:', error);
    return res.status(500).json({ 
      error: 'Proxy API error',
      details: error.message 
    });
  }
}
