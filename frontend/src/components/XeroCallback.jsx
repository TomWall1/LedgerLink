import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const XeroCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the authorization code from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in the callback URL');
        }
        
        console.log('Received Xero auth code:', code);
        
        // In a real implementation, you would send this code to your backend
        // const response = await fetch('/api/auth/xero/callback', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({ code }),
        // });
        // 
        // if (!response.ok) {
        //   throw new Error('Failed to exchange authorization code');
        // }
        // 
        // const data = await response.json();
        
        // For demo purposes, we'll simulate a successful callback response
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirect to results page or dashboard
        navigate('/upload', { state: { xeroConnected: true } });
      } catch (err) {
        console.error('Error processing Xero callback:', err);
        setError(err.message || 'Failed to connect to Xero');
      } finally {
        setLoading(false);
      }
    };
    
    processCallback();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Connecting to Xero</h2>
        <p className="text-gray-600">Please wait while we establish a secure connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="text-center">
          <button 
            onClick={() => navigate('/upload')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return null; // This component will redirect after successful processing
};

export default XeroCallback;