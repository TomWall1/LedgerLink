import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * ServerHealthCheck - A reusable component for displaying server connection status
 * 
 * This component provides a visual indicator of server health and connection status,
 * with automatic retry capability and troubleshooting guidance.
 */
const ServerHealthCheck = ({ onStatusChange, showTroubleshooting = true }) => {
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState(null);
  const [error, setError] = useState(null);
  
  // Auto-check server status on mount
  useEffect(() => {
    checkServerStatus();
    
    // Clean up any pending retry timeouts when component unmounts
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);
  
  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(serverStatus);
    }
  }, [serverStatus, onStatusChange]);
  
  const checkServerStatus = async () => {
    try {
      // Use the api.checkHealth function from our API utility
      const isHealthy = await api.checkHealth();
      
      if (isHealthy) {
        setServerStatus('online');
        setRetryCount(0); // Reset retry count on success
        setError(null);
      } else {
        throw new Error('Server health check failed');
      }
    } catch (err) {
      console.error('Server status check failed:', err);
      setServerStatus('offline');
      
      // Provide more specific error based on the actual error
      if (err.response) {
        // Server responded with an error code
        if (err.response.status === 404) {
          setError('Server endpoint not found (404). The API may have changed or the server might be misconfigured.');
        } else if (err.response.status === 401 || err.response.status === 403) {
          setError('Authentication error. Please try logging out and logging back in.');
        } else {
          setError(`Server error (${err.response.status}). The backend service may be experiencing issues.`);
        }
      } else if (err.request) {
        // No response received from the server
        setError('Unable to connect to the server. The backend service may be down or your internet connection may be unstable.');
      } else {
        // Something else went wrong
        setError('An unexpected error occurred while checking server status. Please try again later.');
      }
      
      // Set up automatic retry with exponential backoff, but only up to 3 attempts
      if (retryCount < 3) {
        const nextRetryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000); // Exponential backoff with 10s max
        const timeout = setTimeout(() => {
          setRetryCount(prevCount => prevCount + 1);
          checkServerStatus();
        }, nextRetryDelay);
        
        setRetryTimeout(timeout);
      }
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setServerStatus('checking');
    setRetryCount(0);
    checkServerStatus();
  };
  
  // Just the status indicator without troubleshooting
  const renderStatusIndicator = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span>Frontend: Connected</span>
        </div>
        <div className="flex items-center">
          {serverStatus === 'checking' && (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
              <span>Backend: Checking...</span>
            </>
          )}
          {serverStatus === 'online' && (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span>Backend: Connected</span>
            </>
          )}
          {serverStatus === 'offline' && (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span>Backend: Disconnected</span>
            </>
          )}
        </div>
      </div>
      {serverStatus === 'offline' && (
        <button 
          onClick={handleRetry}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Retry Connection
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Server Status Indicator */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">System Status</h2>
        {renderStatusIndicator()}
        
        {/* Error message if present */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* Optional Troubleshooting Guide */}
      {showTroubleshooting && serverStatus === 'offline' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal ml-5 text-sm text-yellow-800">
            <li className="mb-1">Check if the backend service is running at <a href="https://ledgerlink.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">ledgerlink.onrender.com</a></li>
            <li className="mb-1">Check if the root endpoint works at <a href="https://ledgerlink.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Root URL</a></li>
            <li className="mb-1">Refresh this page and try again</li>
            <li className="mb-1">Clear your browser cache and cookies</li>
            <li className="mb-1">Try using a different browser or network connection</li>
            <li className="mb-1">Contact support if the issue persists</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default ServerHealthCheck;
