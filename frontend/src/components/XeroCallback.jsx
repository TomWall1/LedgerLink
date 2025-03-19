import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, checkBackendTokens } = useXero();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        
        // Parse URL parameters
        console.log('Callback URL params:', location.search);
        const params = new URLSearchParams(location.search);
        const error = params.get('error');
        const code = params.get('code');
        
        // Log all parameters for debugging
        const allParams = {};
        params.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('All URL parameters:', allParams);
        
        // Check if there's an error parameter
        if (error) {
          throw new Error(`Xero authentication error: ${error}`);
        }
        
        // Proceed with authentication verification
        console.log('No error found, verifying authentication with backend...');
        
        // Check token status
        const tokenStatus = await checkBackendTokens();
        console.log('Backend token status:', tokenStatus);
        
        // Validate that the auth was successful
        if (tokenStatus.error) {
          throw new Error('Backend returned invalid token status response');
        }
        
        const isAuthenticated = tokenStatus.tokenInfo?.hasTokens === true;
        if (!isAuthenticated) {
          throw new Error('Failed to connect to Xero. Please try again.');
        }
        
        // Update authentication state
        await setIsAuthenticated(true);
        console.log('Successfully connected to Xero!');
        
        // Redirect to home page
        navigate('/');
      } catch (error) {
        console.error('Error handling Xero callback:', error);
        setError(error.message || 'Failed to connect to Xero');
        setLoading(false);
      }
    };
    
    // Only run once when component mounts
    handleCallback();
  }, [location.search, navigate, setIsAuthenticated, checkBackendTokens]);

  // Handle manual retry
  const handleRetry = () => {
    navigate('/');
  };

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completing Xero Connection</h2>
        <p className="text-gray-600">Please wait while we finish connecting your Xero account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Connection Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default XeroCallback;
