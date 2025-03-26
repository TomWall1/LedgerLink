import React, { useEffect, useState } from 'react';
import { useXero } from '../context/XeroContext';
import { navigateTo } from '../utils/customRouter';

const XeroCallback = () => {
  const { setIsAuthenticated, checkBackendTokens, getApiUrl } = useXero();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        
        // Parse URL parameters
        const urlSearchParams = new URLSearchParams(window.location.search);
        console.log('Callback URL params:', window.location.search);
        const errorParam = urlSearchParams.get('error');
        const code = urlSearchParams.get('code');
        
        // Log all parameters for debugging
        const allParams = {};
        urlSearchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('All URL parameters:', allParams);
        
        // Check if there's an error parameter
        if (errorParam) {
          throw new Error(`Xero authentication error: ${errorParam}`);
        }
        
        // Step 1: Notify the backend about the authentication code for proper token exchange
        if (code) {
          console.log('Exchanging authorization code for tokens...');
          try {
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/auth/xero/callback-notify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ code, state: allParams.state })
            });
            
            if (response.ok) {
              console.log('Backend token exchange successful');
            } else {
              console.warn('Backend token exchange response:', await response.text());
            }
          } catch (exchangeError) {
            console.warn('Error exchanging code for tokens:', exchangeError);
            // Continue anyway - tokens might have been exchanged on server redirect
          }
        }
        
        // Step 2: Verify authentication status after a brief delay for token processing
        console.log('Waiting for backend to process tokens...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Step 3: Check authentication status
        console.log('Verifying authentication with backend...');
        const apiUrl = getApiUrl();
        const authResponse = await fetch(`${apiUrl}/direct-auth-status?nocache=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!authResponse.ok) {
          throw new Error(`Failed to verify authentication: ${authResponse.status}`);
        }
        
        const authData = await authResponse.json();
        console.log('Authentication status response:', authData);
        
        if (!authData.isAuthenticated) {
          throw new Error('Failed to connect to Xero. Please try again.');
        }
        
        // Update authentication state
        await setIsAuthenticated(true);
        console.log('Successfully connected to Xero!');
        
        // Redirect to home page using custom router
        navigateTo('dashboard');
      } catch (error) {
        console.error('Error handling Xero callback:', error);
        setError(error.message || 'Failed to connect to Xero');
        setLoading(false);
      }
    };
    
    // Only run once when component mounts
    handleCallback();
  }, [setIsAuthenticated, checkBackendTokens, getApiUrl]);

  // Handle manual retry
  const handleRetry = () => {
    navigateTo('dashboard');
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
