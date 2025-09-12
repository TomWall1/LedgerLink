import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXero } from '../contexts/XeroContext';

const XeroAuth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, connectToXero, disconnectFromXero, checkAuth } = useXero();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    // Check for callback parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      // Clear URL parameters and check auth status
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        checkAuth();
        setSuccess('Successfully connected to Xero!');
      }, 1000);
    }
  }, [checkAuth]);
  
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError('');
      await connectToXero();
    } catch (err) {
      setError('Failed to connect to Xero. Please try again.');
    } finally {
      setConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setError('');
      setSuccess('');
      await disconnectFromXero();
      setSuccess('Successfully disconnected from Xero.');
    } catch (err) {
      setError('Failed to disconnect from Xero.');
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
            <p className="text-gray-600 mt-2">Connect your Xero account to import customer and invoice data</p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Messages */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">Connection Status</h2>
            
            <div className="flex items-center mb-6">
              {isAuthenticated ? (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-green-700 font-medium">Connected to Xero</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-red-700 font-medium">Not connected to Xero</span>
                </>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your Xero account is successfully connected. You can now:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Import customer data</li>
                  <li>Fetch outstanding invoices</li>
                  <li>Match transactions automatically</li>
                  <li>Update invoice statuses</li>
                </ul>
                
                <div className="pt-4">
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Disconnect from Xero
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Connect your Xero account to enable automatic data import and synchronization.
                </p>
                
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {connecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Connect to Xero
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">About Xero Integration</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Secure Authentication</h3>
                <p className="text-gray-600 text-sm">
                  We use OAuth 2.0 for secure authentication. Your Xero credentials are never stored on our servers.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Data Access</h3>
                <p className="text-gray-600 text-sm">
                  We only access customer and invoice data necessary for matching transactions. We never modify your Xero data without permission.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Permissions Required</h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Read customer contacts</li>
                  <li>• Read invoices and bills</li>
                  <li>• Read organization details</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Privacy</h3>
                <p className="text-gray-600 text-sm">
                  Your data is encrypted in transit and at rest. We comply with Australian privacy regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        {isAuthenticated && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/invoice-matching')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Start Invoice Matching
              </button>
              
              <button
                onClick={() => checkAuth()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Connection
              </button>
              
              <button
                onClick={() => navigate('/erp-connections')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Connections
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroAuth;