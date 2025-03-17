import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, checkBackendTokens } = useXero();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setProcessing(true);
        console.log('Callback URL params:', location.search);
        const params = new URLSearchParams(location.search);
        
        // Debug log all parameters
        const allParams = {};
        params.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('All URL parameters:', allParams);
        
        // Check for error parameter
        if (params.has('error')) {
          const errorMessage = params.get('error');
          throw new Error(`Xero authentication failed: ${errorMessage}`);
        }
        
        // Auto-authenticate - check with backend first
        console.log('No error found, verifying authentication with backend...');
        
        // Check backend token status to confirm authentication was successful
        const tokenStatus = await checkBackendTokens();
        console.log('Backend token status:', tokenStatus);
        
        if (!tokenStatus?.tokenInfo?.hasTokens) {
          throw new Error('Backend reports no valid tokens - authentication failed');
        }
        
        // Store debug info
        setDebugInfo(tokenStatus);
        
        // Update auth state in context
        await setIsAuthenticated(true);
        console.log('Authentication state updated successfully');
        
        // Navigate back to upload page with success message
        navigate('/upload', { 
          state: { 
            xeroEnabled: true, 
            message: 'Successfully connected to Xero!' 
          }
        });
        return;
      } catch (err) {
        console.error('Error handling Xero callback:', err);
        setError(err.message);
        setProcessing(false);
      }
    };

    handleCallback();
  }, [location, navigate, setIsAuthenticated, checkBackendTokens]);

  const handleRetry = () => {
    // Clear error and redirect to upload page to try again
    setError(null);
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Xero Authentication</h1>
        
        {processing && !error && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing Xero authentication...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Authentication Error</p>
            <p>{error}</p>
            <div className="mt-4 flex space-x-4">
              <button 
                onClick={handleRetry} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Try Again
              </button>
              <button 
                onClick={() => navigate('/upload')} 
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors">
                Return to Upload Page
              </button>
            </div>
          </div>
        )}
        
        {/* Debug information (only visible if available) */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Debug Info:</span>
            </div>
            <pre className="overflow-auto max-h-32 p-2 bg-gray-100 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroCallback;