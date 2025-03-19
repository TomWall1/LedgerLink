import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroConnection = ({ onUseXeroData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    setIsAuthenticated, 
    getApiUrl, 
    isCheckingAuth,
    checkBackendTokens,
    debugInfo: contextDebugInfo
  } = useXero();

  // Check token status when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      checkTokenStatus();
    }
    
    // If context already has debug info, use it
    if (contextDebugInfo) {
      setDebugInfo(contextDebugInfo);
    }
  }, [isAuthenticated, contextDebugInfo]);

  // Function to check token status for debugging
  const checkTokenStatus = async () => {
    const info = await checkBackendTokens();
    setDebugInfo(info);
  };

  // Function to handle the Xero connection
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the API URL from context
      const apiUrl = getApiUrl();
      console.log('Connecting to Xero using API URL:', apiUrl);
      
      // Try the direct endpoint first
      try {
        const response = await fetch(`${apiUrl}/direct-xero-auth`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            console.log('Got authorization URL:', data.url);
            window.location.href = data.url;
            return;
          }
        }
      } catch (directError) {
        console.warn('Direct auth-url endpoint failed:', directError);
        // Continue to other methods
      }
      
      // Fall back to direct redirect
      console.log('Falling back to direct redirect...');
      window.location.href = `${apiUrl}/auth/xero/connect`;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError(`Failed to connect to Xero: ${error.message || 'Unknown error'}. Please try again.`);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // First try to disconnect from the backend
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/xero/disconnect`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('Backend disconnect responded with status:', response.status);
        } else {
          console.log('Successfully disconnected from Xero backend');
        }
      } catch (backendError) {
        console.warn('Error disconnecting from Xero backend:', backendError);
      }
      
      // Always disconnect locally even if backend call fails
      await setIsAuthenticated(false);
      setDebugInfo(null);
      console.log('Disconnected from Xero');
      
      setIsLoading(false);
    } catch (error) {
      console.warn('Error during Xero disconnect process:', error);
      // Still disconnect locally even if there was an error
      await setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Check if onUseXeroData prop is provided
    if (typeof onUseXeroData === 'function') {
      onUseXeroData(); // Call the function from parent component
    } else {
      // Fallback to navigation
      navigate('/upload', { state: { xeroEnabled: true } });
    }
  };

  const handleTryAgain = async () => {
    setError(null);
    // Check backend token status
    await checkTokenStatus();
  };

  // Handle manual token check (debug)
  const handleCheckTokens = async () => {
    await checkTokenStatus();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4">
      <h2 className="text-xl font-semibold mb-4">Xero Integration</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Connection Error</span>
          </div>
          <p>{error}</p>
          <button 
            onClick={handleTryAgain}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Debug information (only visible if available) */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">Debug Info:</span>
            <button 
              onClick={() => setDebugInfo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <pre className="overflow-auto max-h-32 p-2 bg-gray-100 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="space-y-6">
        {isCheckingAuth ? (
          <div className="text-center p-4">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-600">Checking authentication status...</p>
          </div>
        ) : !isAuthenticated ? (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your Xero account to import Accounts Receivable data directly from your organization.
            </p>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting to Xero...
                </>
              ) : (
                <>Connect to Xero</>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Connected to Xero
            </div>
            <div className="flex flex-wrap space-x-3">
              <button
                onClick={handleContinue}
                className="flex items-center px-4 py-2 mb-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Use Xero Data
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 mb-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-medium`}
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
              <button
                onClick={handleCheckTokens}
                className="flex items-center px-4 py-2 mb-2 rounded-lg transition-colors bg-gray-600 hover:bg-gray-700 text-white font-medium text-sm"
              >
                Check Token Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroConnection;