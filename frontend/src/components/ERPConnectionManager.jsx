import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useXero } from '../context/XeroContext';
import XeroConnection from './XeroConnection';
import { navigateTo } from '../utils/customRouter';

const ERPConnectionManager = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState({
    connectionName: '',
    provider: 'xero',
    type: 'AR' // Default to Accounts Receivable
  });
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  
  const { currentUser } = useAuth();
  const { isAuthenticated: isXeroAuthenticated } = useXero();
  
  // Check server status
  useEffect(() => {
    checkServerStatus();
  }, []);
  
  // Fetch existing ERP connections
  useEffect(() => {
    if (serverStatus === 'online') {
      fetchConnections();
    } else if (serverStatus === 'offline') {
      setLoading(false);
    }
  }, [serverStatus]);
  
  const checkServerStatus = async () => {
    try {
      // Try to make a simple request to the backend
      await api.get('/api/health-check');
      setServerStatus('online');
    } catch (err) {
      console.error('Server status check failed:', err);
      setServerStatus('offline');
      setError('Unable to connect to the server. The backend service may be unavailable. Please try again later.');
    }
  };
  
  const fetchConnections = async () => {
    try {
      setLoading(true);
      // Endpoint to get ERP connections for the current user
      const response = await api.get('/erp-connections');
      setConnections(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching ERP connections:', err);
      // Check if it's a network/server error
      if (err.message && err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else {
        setError('Failed to load your ERP connections. Please try again.');
      }
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddConnection = () => {
    setShowAddForm(true);
  };
  
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewConnection({
      connectionName: '',
      provider: 'xero',
      type: 'AR'
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewConnection(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmitConnection = async (e) => {
    e.preventDefault();
    
    if (!newConnection.connectionName) {
      setError('Please provide a name for this connection.');
      return;
    }
    
    try {
      // First save the basic connection info
      const response = await api.post('/erp-connections', {
        ...newConnection,
        userId: currentUser?._id
      });
      
      // Process Xero authentication if that's the selected provider
      if (newConnection.provider === 'xero') {
        // If Xero is already authenticated, we can link it to this connection
        if (isXeroAuthenticated) {
          await api.post(`/erp-connections/${response.data.data._id}/link-xero`);
        } else {
          // Otherwise navigate to the connection detail to complete setup
          navigateTo(`erp-data/${response.data.data._id}`);
          return;
        }
      }
      
      // Refresh connections list and reset form
      fetchConnections();
      setShowAddForm(false);
      setNewConnection({
        connectionName: '',
        provider: 'xero',
        type: 'AR'
      });
      setError(null);
    } catch (err) {
      console.error('Error creating ERP connection:', err);
      // Check if it's a network/server error
      if (err.message && err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else {
        setError('Failed to create connection. Please try again.');
      }
    }
  };
  
  const handleViewConnection = (connectionId) => {
    navigateTo(`erp-data/${connectionId}`);
  };
  
  const handleDeleteConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to delete this connection? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/erp-connections/${connectionId}`);
      // Refresh the list
      fetchConnections();
    } catch (err) {
      console.error('Error deleting connection:', err);
      setError('Failed to delete connection. Please try again.');
    }
  };

  // Function to handle click on Use Xero Data button  
  const handleUseXeroData = async () => {
    try {
      // Check server status first
      if (serverStatus !== 'online') {
        await checkServerStatus();
        if (serverStatus !== 'online') {
          setError('Cannot connect to the server. Please check your internet connection and try again.');
          return;
        }
      }
      
      // If there are existing connections, get the first one
      if (connections && connections.length > 0) {
        // Find a Xero connection if available
        const xeroConnection = connections.find(conn => conn.provider === 'xero');
        if (xeroConnection && xeroConnection._id) {
          navigateTo(`erp-data/${xeroConnection._id}`);
          return;
        }
      }
      
      // If we can't connect to Xero, show a user-friendly message
      if (!isXeroAuthenticated) {
        setError('You need to connect to Xero first. Please click the "Connect to Xero" button, then try again.');
        return;
      }
      
      // If no existing Xero connections were found, create a new one
      setError('Creating a new Xero connection...');
      
      // Create a new connection for Xero
      try {
        const response = await api.post('/erp-connections', {
          connectionName: 'My Xero Connection',
          provider: 'xero',
          type: 'AR',
          userId: currentUser?._id
        });
        
        // Navigate to the new connection
        if (response && response.data && response.data.data && response.data.data._id) {
          navigateTo(`erp-data/${response.data.data._id}`);
          // Refresh connections list
          fetchConnections();
        } else {
          throw new Error('Failed to create a new Xero connection.');
        }
      } catch (createErr) {
        if (createErr.response && createErr.response.status === 401) {
          setError('You need to be signed in to create a Xero connection. Please sign in and try again.');
        } else {
          setError('Failed to create a Xero connection. Please try adding a connection manually.');
        }
      }
    } catch (err) {
      console.error('Error handling Xero data:', err);
      setError('An unexpected error occurred. Please try adding a connection manually or contact support.');
    }
  };
  
  const handleServerRetry = () => {
    setServerStatus('checking');
    checkServerStatus();
  };
  
  if (loading && serverStatus !== 'offline') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">ERP Connections</h1>
        <p className="text-gray-600">Connect your ERP systems to import transaction data</p>
      </div>
      
      {/* Server Status Indicator */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-2">System Status</h2>
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
              onClick={handleServerRetry}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Xero Direct Connection Widget - Only show if server is online */}
      {serverStatus === 'online' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Connect</h2>
          <XeroConnection onUseXeroData={handleUseXeroData} />
        </div>
      )}
      
      {/* Server Offline Message */}
      {serverStatus === 'offline' && (
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-yellow-700">Server Connection Issue</h2>
          <p className="mb-4">We're having trouble connecting to the LedgerLink server. This might be due to:</p>
          <ul className="list-disc text-left max-w-md mx-auto mb-4">
            <li className="ml-4">The server is temporarily offline or down for maintenance</li>
            <li className="ml-4">Your internet connection is experiencing issues</li>
            <li className="ml-4">A firewall or network setting is blocking the connection</li>
          </ul>
          <button 
            onClick={handleServerRetry}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Existing Connections - Only show if server is online */}
      {serverStatus === 'online' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Connections</h2>
            <button
              onClick={handleAddConnection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Connection
            </button>
          </div>
          
          {connections.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">You don't have any ERP connections yet.</p>
              <p className="text-gray-500 mt-2">Add a connection to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((connection) => (
                <div key={connection._id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{connection.connectionName}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      connection.status === 'active' ? 'bg-green-100 text-green-800' :
                      connection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {connection.status || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    {connection.provider === 'xero' ? 'Xero' : connection.provider.toUpperCase()}
                  </p>
                  <p className="text-gray-600 mb-3">
                    {connection.type === 'AR' ? 'Accounts Receivable' : 
                     connection.type === 'AP' ? 'Accounts Payable' : 
                     'Unknown Type'}
                  </p>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleViewConnection(connection._id)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteConnection(connection._id)}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Add Connection Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Add ERP Connection</h2>
            
            <form onSubmit={handleSubmitConnection}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="connectionName">
                  Connection Name
                </label>
                <input
                  type="text"
                  id="connectionName"
                  name="connectionName"
                  value={newConnection.connectionName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Xero Connection"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="provider">
                  ERP Provider
                </label>
                <select
                  id="provider"
                  name="provider"
                  value={newConnection.provider}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="xero">Xero</option>
                  <option value="csv" disabled>CSV Import (Coming Soon)</option>
                  <option value="quickbooks" disabled>QuickBooks (Coming Soon)</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type">
                  Connection Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={newConnection.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AR">Accounts Receivable</option>
                  <option value="AP">Accounts Payable</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPConnectionManager;