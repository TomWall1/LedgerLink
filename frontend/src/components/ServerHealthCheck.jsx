import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/**
 * A component that monitors server health and displays status
 */
const ServerHealthCheck = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastChecked, setLastChecked] = useState(null);
  const [checkingNow, setCheckingNow] = useState(false);
  
  // Check server health on mount and every 5 minutes
  useEffect(() => {
    checkServerHealth();
    
    // Set up periodic health checks
    const intervalId = setInterval(() => {
      checkServerHealth();
    }, 300000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);
  
  const checkServerHealth = async () => {
    if (checkingNow) return;
    
    try {
      setCheckingNow(true);
      
      // Use the api.checkHealth utility
      const isHealthy = await api.checkHealth();
      
      // Update status based on result
      setStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('offline');
    } finally {
      setLastChecked(new Date());
      setCheckingNow(false);
    }
  };
  
  // Function to manually trigger a health check
  const handleManualCheck = () => {
    checkServerHealth();
  };
  
  return (
    <div className="bg-white border rounded-md p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Server Status</h3>
        <button
          onClick={handleManualCheck}
          disabled={checkingNow}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
        >
          {checkingNow ? 'Checking...' : 'Check Now'}
        </button>
      </div>
      
      <div className="flex items-center mb-1">
        {status === 'checking' && (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
            <span>Checking...</span>
          </>
        )}
        {status === 'online' && (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-green-700 font-medium">Online</span>
          </>
        )}
        {status === 'offline' && (
          <>
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            <span className="text-red-700 font-medium">Offline</span>
          </>
        )}
      </div>
      
      {lastChecked && (
        <div className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
      
      {status === 'offline' && (
        <div className="mt-2 text-sm">
          <p className="text-red-600">Server connectivity issues detected</p>
          <p className="text-xs mt-1">Some functions may be unavailable</p>
        </div>
      )}
    </div>
  );
};

export default ServerHealthCheck;