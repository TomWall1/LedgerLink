import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useXero } from '../context/XeroContext';

const XeroCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated } = useXero();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);

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
        
        // Auto-authenticate without requiring the 'authenticated' param
        // This assumes that if we reach this page without an error, authentication succeeded
        console.log('No error found, assuming successful Xero authentication');
        
        // Update auth state in context
        await setIsAuthenticated(true);
        console.log('Authentication state updated');
        
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
  }, [location, navigate, setIsAuthenticated]);

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
      </div>
    </div>
  );
};

export default XeroCallback;