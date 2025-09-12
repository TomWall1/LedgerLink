import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useXero } from '../contexts/XeroContext';

const XeroAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, connectToXero, disconnectFromXero, checkAuth } = useXero();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    // Check for connection success or error from URL params
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');
    
    if (connected === 'true') {
      setSuccess('Successfully connected to Xero!');
      checkAuth(); // Refresh auth status
      // Clear URL params
      navigate('/xero-auth', { replace: true });
    } else if (errorParam) {
      setError('Failed to connect to Xero. Please try again.');
      // Clear URL params
      navigate('/xero-auth', { replace: true });
    }
  }, [searchParams, checkAuth, navigate]);
  
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      await connectToXero();
      // The connectToXero function will redirect to Xero's auth page
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError('Failed to connect to Xero. Please try again.');
    } finally {
      setConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnectFromXero();
      setSuccess('Successfully disconnected from Xero.');
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      setError('Failed to disconnect from Xero. Please try again.');
    }
  };
  
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Checking Xero connection...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B365D]">Xero Integration</h1>
            <p className="text-gray-600 mt-2">Connect your Xero account to import customer data</p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">Error:</span>
              <span className="text-red-600 ml-1">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">Success:</span>
              <span className="text-green-600 ml-1">{success}</span>
            </div>
          </div>
        )}
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1B365D]">Xero Connection</h2>
                <p className="text-gray-600">
                  Status: {' '}
                  <span className={`font-medium ${
                    isAuthenticated ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isAuthenticated ? 'Connected' : 'Not Connected'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="text-right">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/invoice-matching')}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Start Invoice Matching
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="block w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    'Connect to Xero'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What happens when you connect */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-[#1B365D] mb-4">What happens when you connect?</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Import your customer list from Xero
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Access outstanding invoices for matching
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Enable CSV transaction matching
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure OAuth 2.0 authentication
              </li>
            </ul>
          </div>
          
          {/* Security Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-[#1B365D] mb-4">Security & Privacy</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your credentials are never stored
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Read-only access to your data
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                You can disconnect anytime
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Enterprise-grade security
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;