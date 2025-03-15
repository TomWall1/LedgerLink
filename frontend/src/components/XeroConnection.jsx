import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroConnection = ({ onUseXeroData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, getApiUrl } = useXero();

  // For development: mock Xero connection to avoid API calls
  const mockXeroConnect = () => {
    setIsAuthenticated(true);
  };

  const mockXeroDisconnect = () => {
    setIsAuthenticated(false);
  };

  // Function to handle the Xero connection
  const handleConnect = async () => {
    // For development, use the mock connection
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_XERO === 'true') {
      mockXeroConnect();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get the API URL from context
      const apiUrl = getApiUrl();
      console.log('Connecting to Xero using API URL:', apiUrl);
      
      // Make the API call using fetch to avoid header issues
      const response = await fetch(`${apiUrl}/auth/xero/connect`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received response from server:', data);
      
      // Check for either 'url' or 'authUrl' property
      const authUrl = data.url || data.authUrl;
      
      if (authUrl) {
        // Redirect to Xero for authentication
        console.log('Redirecting to Xero auth URL:', authUrl);
        window.location.href = authUrl;
      } else {
        console.error('Response data does not contain a valid URL:', data);
        throw new Error('No authorization URL received from server');
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError(`Failed to connect to Xero: ${error.message || 'Unknown error'}. Please try again.`);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    // For development, use the mock disconnection
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_XERO === 'true') {
      mockXeroDisconnect();
      return;
    }

    try {
      setIsLoading(true);
      // Disconnect on the server first
      const apiUrl = getApiUrl();
      
      // Make the API call using fetch to avoid header issues
      const response = await fetch(`${apiUrl}/auth/xero/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Then disconnect locally
      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      console.warn('Error disconnecting from Xero:', error);
      // Still disconnect locally even if server fails
      setIsAuthenticated(false);
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

  const handleTryAgain = () => {
    setError(null);
    window.location.reload();
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

      <div className="space-y-6">
        {!isAuthenticated ? (
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
            
            {/* Only show this message in development mode */}
            {process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_XERO === 'true' && (
              <p className="text-xs text-gray-400 mt-2">
                Running in development mode with mock enabled. Xero connection will be simulated locally.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Connected to Xero
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleContinue}
                className="flex items-center px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Use Xero Data
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-medium`}
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
            
            {/* Only show this message in development mode */}
            {process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_XERO === 'true' && (
              <p className="text-xs text-gray-400 mt-2">
                Running in development mode with mock enabled. Xero connection is simulated locally.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroConnection;