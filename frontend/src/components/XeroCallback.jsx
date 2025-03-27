import React, { useEffect, useState } from 'react';
import { useXero } from '../context/XeroContext';
import { navigateTo } from '../utils/customRouter';

const XeroCallback = () => {
  const { setIsAuthenticated, checkBackendTokens, getApiUrl } = useXero();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing connection...');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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
          setStatusMessage('Exchanging authorization code for tokens...');
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
              setStatusMessage('Token exchange successful!');
            } else {
              const errorText = await response.text();
              console.warn('Backend token exchange response:', errorText);
              setStatusMessage('Token exchange received a non-success response. Verifying connection status...');
            }
          } catch (exchangeError) {
            console.warn('Error exchanging code for tokens:', exchangeError);
            setStatusMessage('Error during token exchange. Checking connection status anyway...');
            // Continue anyway - tokens might have been exchanged on server redirect
          }
        } else {
          setStatusMessage('No authorization code found. Checking connection status...');
        }
        
        // Step 2: Verify authentication status after a brief delay for token processing
        console.log('Waiting for backend to process tokens...');
        setStatusMessage('Waiting for backend to process tokens...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Step 3: Check authentication status
        console.log('Verifying authentication with backend...');
        setStatusMessage('Verifying authentication with backend...');
        const apiUrl = getApiUrl();
        const authResponse = await fetch(`${apiUrl}/direct-auth-status?nocache=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          throw new Error(`Failed to verify authentication: ${authResponse.status} - ${errorText}`);
        }
        
        const authData = await authResponse.json();
        console.log('Authentication status response:', authData);
        
        if (!authData.isAuthenticated) {
          // If this is not our first retry, try again
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setStatusMessage(`Authentication not confirmed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
            handleCallback(); // Recursive call to retry
            return;
          }
          throw new Error('Failed to connect to Xero after multiple attempts. Please try again.');
        }
        
        // Update authentication state
        await setIsAuthenticated(true);
        console.log('Successfully connected to Xero!');
        setStatusMessage('Successfully connected to Xero!');
        
        // Wait a moment to show success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
  }, [setIsAuthenticated, checkBackendTokens, getApiUrl, retryCount]);

  // Handle manual retry
  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(0);
      setError(null);
      setLoading(true);
      // Get code from URL again
      const urlSearchParams = new URLSearchParams(window.location.search);
      const code = urlSearchParams.get('code');
      if (code) {
        handleRetryWithCode(code);
      } else {
        navigateTo('erp-connections');
      }
    } else {
      navigateTo('erp-connections');
    }
  };

  // Handle retry with existing code
  const handleRetryWithCode = async (code) => {
    try {
      setStatusMessage('Retrying connection...');
      const apiUrl = getApiUrl();
      // Try the callback-notify endpoint again
      await fetch(`${apiUrl}/auth/xero/callback-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      // Wait and then check auth status
      await new Promise(resolve => setTimeout(resolve, 2000));
      const authResponse = await fetch(`${apiUrl}/direct-auth-status?nocache=${Date.now()}`, {
        method: 'GET'
      });
      
      const authData = await authResponse.json();
      if (authData.isAuthenticated) {
        setIsAuthenticated(true);
        navigateTo('dashboard');
      } else {
        throw new Error('Still unable to authenticate with Xero');
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setError('Retry failed. Please go back and try connecting again.');
      setLoading(false);
    }
  };

  // Handle return to connections
  const handleBackToConnections = () => {
    navigateTo('erp-connections');
  };

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold mb-2">Completing Xero Connection</h2>
          <p className="text-gray-600 mb-4">{statusMessage}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <p className="text-sm text-gray-500">Please don't close or refresh this page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full shadow-lg">
          <div className="bg-red-50 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-4 text-center text-red-700">Connection Error</h2>
          <p className="text-gray-700 mb-6 text-center">{error}</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToConnections}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full"
            >
              Return to Connections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default XeroCallback;
