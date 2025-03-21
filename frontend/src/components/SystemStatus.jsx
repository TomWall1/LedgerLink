import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    loading: true,
    apiStatus: null,
    dbStatus: null,
    error: null
  });

  useEffect(() => {
    const checkSystemStatus = async () => {
      setSystemStatus(prev => ({ ...prev, loading: true }));
      
      try {
        // Check API status
        const apiResponse = await axios.get(`${API_URL}/`);
        const apiStatus = apiResponse.data && apiResponse.status === 200;
        
        // Check DB status
        const dbResponse = await axios.get(`${API_URL}/test/db`);
        const dbStatus = dbResponse.data;
        
        setSystemStatus({
          loading: false,
          apiStatus,
          dbStatus,
          error: null
        });
      } catch (error) {
        console.error('Error checking system status:', error);
        setSystemStatus({
          loading: false,
          apiStatus: false,
          dbStatus: null,
          error: error.message || 'Failed to connect to API'
        });
      }
    };
    
    checkSystemStatus();
  }, []);
  
  const handleRefresh = () => {
    setSystemStatus(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 my-4">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">System Status</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Current status of LedgerLink components</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {systemStatus.loading ? (
            <span>Checking...</span>
          ) : (
            <span>Refresh Status</span>
          )}
        </button>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">API Server</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {systemStatus.loading ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Checking...
                </span>
              ) : systemStatus.apiStatus ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Offline
                </span>
              )}
              <span className="ml-2 text-gray-500">{API_URL}</span>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">MongoDB Database</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {systemStatus.loading ? (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Checking...
                </span>
              ) : systemStatus.dbStatus ? (
                <div>
                  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                    systemStatus.dbStatus.connection.stateText === 'Connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {systemStatus.dbStatus.connection.stateText}
                  </span>
                  
                  {systemStatus.dbStatus.connection.stateText === 'Connected' && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Host:</strong> {systemStatus.dbStatus.connection.host}:{systemStatus.dbStatus.connection.port}</p>
                      <p><strong>Database:</strong> {systemStatus.dbStatus.connection.name}</p>
                      <p><strong>Collections:</strong> {systemStatus.dbStatus.connection.collections?.join(', ') || 'None'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Not Connected
                </span>
              )}
            </dd>
          </div>
          {systemStatus.error && (
            <div className="bg-red-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-red-500">Error</dt>
              <dd className="mt-1 text-sm text-red-900 sm:mt-0 sm:col-span-2">{systemStatus.error}</dd>
            </div>
          )}
        </dl>
      </div>
      
      {/* Troubleshooting Tips */}
      {(!systemStatus.apiStatus || (systemStatus.dbStatus && systemStatus.dbStatus.connection.stateText !== 'Connected')) && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          <h4 className="text-md leading-6 font-medium text-gray-900">Troubleshooting Tips</h4>
          <div className="mt-2 text-sm text-gray-500">
            <ul className="list-disc pl-5 space-y-2">
              {!systemStatus.apiStatus && (
                <>
                  <li>Ensure the backend server is running (npm run dev in the backend folder)</li>
                  <li>Check for any port conflicts - the server should be running on port 3002</li>
                  <li>If using custom API URL, verify it's correct in your .env file</li>
                </>
              )}
              {systemStatus.dbStatus && systemStatus.dbStatus.connection.stateText !== 'Connected' && (
                <>
                  <li>Verify MongoDB service is running on your computer</li>
                  <li>Check the MongoDB connection string in your backend .env file</li>
                  <li>Run the start-dev.bat script to automatically fix common issues</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
