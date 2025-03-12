// Create a proxy endpoint to avoid CORS issues
export default async function handler(req, res) {
  try {
    // Set appropriate CORS headers to allow the frontend to access this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Make the request to the backend API
    const apiUrl = process.env.API_URL || 'https://ledgerlink.onrender.com';
    const response = await fetch(`${apiUrl}/auth/xero/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response to the client
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying Xero status request:', error);
    return res.status(500).json({ 
      error: 'Failed to check Xero authentication status',
      details: error.message 
    });
  }
}
