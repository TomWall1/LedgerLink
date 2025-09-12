import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXero } from '../contexts/XeroContext';

const ERPConnectionManager = () => {
  const navigate = useNavigate();
  const { isAuthenticated: xeroConnected, connectToXero, disconnectFromXero } = useXero();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleXeroConnect = async () => {
    try {
      setLoading(true);
      setError('');
      await connectToXero();
    } catch (error) {
      setError('Failed to connect to Xero');
    } finally {
      setLoading(false);
    }
  };
  
  const handleXeroDisconnect = async () => {
    try {
      setLoading(true);
      setError('');
      await disconnectFromXero();
      setSuccess('Successfully disconnected from Xero');
    } catch (error) {
      setError('Failed to disconnect from Xero');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  const connections = [
    {
      id: 'xero',
      name: 'Xero',
      description: 'Connect to Xero for customer and invoice data',
      status: xeroConnected ? 'connected' : 'disconnected',
      color: 'green',
      onConnect: handleXeroConnect,
      onDisconnect: handleXeroDisconnect
    },
    {
      id: 'coupa',
      name: 'Coupa',
      description: 'Connect to Coupa for procurement data',
      status: 'coming-soon',
      color: 'blue',
      onConnect: () => alert('Coupa integration coming soon!'),
      onDisconnect: () => {}
    },
    {
      id: 'sap',
      name: 'SAP',
      description: 'Connect to SAP for enterprise resource planning',
      status: 'coming-soon',
      color: 'purple',
      onConnect: () => alert('SAP integration coming soon!'),
      onDisconnect: () => {}
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Connect to QuickBooks for accounting data',
      status: 'coming-soon',
      color: 'yellow',
      onConnect: () => alert('QuickBooks integration coming soon!'),
      onDisconnect: () => {}
    }
  ];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'coming-soon': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Not Connected';
      case 'coming-soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B365D]">ERP Connections</h1>
            <p className="text-gray-600 mt-2">Manage your ERP system integrations</p>
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
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">Success:</span>
              <span className="text-green-600 ml-1">{success}</span>
            </div>
          </div>
        )}
        
        {/* Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((connection) => (
            <div key={connection.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-${connection.color}-100 rounded-lg flex items-center justify-center`}>
                    <span className={`text-${connection.color}-600 font-bold text-lg`}>
                      {connection.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1B365D]">{connection.name}</h3>
                    <p className="text-sm text-gray-600">{connection.description}</p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connection.status)}`}>
                  {getStatusText(connection.status)}
                </div>
              </div>
              
              <div className="flex space-x-3">
                {connection.status === 'connected' ? (
                  <>
                    <button
                      onClick={connection.onDisconnect}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                    <button
                      onClick={() => navigate('/invoice-matching')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Use Connection
                    </button>
                  </>
                ) : connection.status === 'disconnected' ? (
                  <button
                    onClick={connection.onConnect}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect'}
                  </button>
                ) : (
                  <button
                    onClick={connection.onConnect}
                    className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-default"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Information Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#1B365D] mb-6">About ERP Integrations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#1B365D] mb-3">Current Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Xero customer and invoice import
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  OAuth 2.0 secure authentication
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time data synchronization
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  CSV transaction matching
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#1B365D] mb-3">Coming Soon</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Coupa procurement integration
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  SAP ERP connectivity
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  QuickBooks integration
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Custom API integrations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPConnectionManager;