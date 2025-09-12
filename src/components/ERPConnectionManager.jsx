import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXero } from '../contexts/XeroContext';

const ERPConnectionManager = () => {
  const navigate = useNavigate();
  const { isAuthenticated: xeroConnected, isLoading: xeroLoading } = useXero();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading connections
    setTimeout(() => {
      setConnections([
        {
          id: 'xero',
          name: 'Xero',
          type: 'Accounting',
          status: xeroConnected ? 'connected' : 'disconnected',
          description: 'Accounting and invoice management platform',
          features: ['Customer Data', 'Invoice Import', 'Financial Reports'],
          lastSync: xeroConnected ? new Date().toISOString() : null
        },
        {
          id: 'coupa',
          name: 'Coupa',
          type: 'Procurement',
          status: 'available',
          description: 'Procurement and spend management platform',
          features: ['Purchase Orders', 'Supplier Management', 'Expense Tracking'],
          lastSync: null
        },
        {
          id: 'sap',
          name: 'SAP',
          type: 'ERP',
          status: 'coming-soon',
          description: 'Enterprise resource planning system',
          features: ['Financial Management', 'Supply Chain', 'HR Management'],
          lastSync: null
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [xeroConnected]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'available':
        return 'bg-yellow-100 text-yellow-800';
      case 'coming-soon':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'available':
        return 'Available';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return 'Unknown';
    }
  };
  
  const handleConnectionAction = (connection) => {
    if (connection.id === 'xero') {
      navigate('/xero-auth');
    } else if (connection.status === 'available') {
      // Handle other connection types
      alert(`${connection.name} integration coming soon!`);
    }
  };
  
  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Never';
    return new Date(lastSync).toLocaleString('en-AU');
  };
  
  if (loading || xeroLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading connections...</p>
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
            <h1 className="text-3xl font-bold text-[#1B365D]">ERP Connections</h1>
            <p className="text-gray-600 mt-2">Manage your enterprise system integrations</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Connection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <div key={connection.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">
                      {connection.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#1B365D]">{connection.name}</h3>
                    <p className="text-sm text-gray-600">{connection.type}</p>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                  {getStatusText(connection.status)}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 mb-4">{connection.description}</p>
              
              {/* Features */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {connection.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Last Sync */}
              <div className="mb-4 text-sm text-gray-600">
                <strong>Last Sync:</strong> {formatLastSync(connection.lastSync)}
              </div>
              
              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                {connection.status === 'connected' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleConnectionAction(connection)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Manage
                    </button>
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                      Sync Now
                    </button>
                  </div>
                ) : connection.status === 'disconnected' ? (
                  <button
                    onClick={() => handleConnectionAction(connection)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Connect
                  </button>
                ) : connection.status === 'available' ? (
                  <button
                    onClick={() => handleConnectionAction(connection)}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Setup Integration
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Integration Information */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#1B365D] mb-6">Integration Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#1B365D] mb-2">Automated Data Sync</h3>
              <p className="text-gray-600 text-sm">
                Keep your systems in sync with real-time data synchronization across all connected platforms.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#1B365D] mb-2">Improved Accuracy</h3>
              <p className="text-gray-600 text-sm">
                Reduce manual data entry errors and ensure consistency across your business systems.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#1B365D] mb-2">Time Savings</h3>
              <p className="text-gray-600 text-sm">
                Save hours of manual work with automated invoice matching and transaction processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPConnectionManager;