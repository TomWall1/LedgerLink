import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { CustomerVendorList } from '../components/counterparty/CustomerVendorList';

interface Connection {
  id: string;
  name: string;
  type: 'erp' | 'bsm';
  platform: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  accountsConnected?: number;
  logo?: string;
  description: string;
}

export const Connections: React.FC = () => {
  const [connectionModal, setConnectionModal] = useState<{ open: boolean; connection?: Connection }>({ open: false });
  const [authCode, setAuthCode] = useState('');
  const [activeTab, setActiveTab] = useState<'connections' | 'contacts'>('connections');
  
  // Mock connections data
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: 'xero-1',
      name: 'Main Xero Account',
      type: 'erp',
      platform: 'Xero',
      status: 'connected',
      lastSync: '2 minutes ago',
      accountsConnected: 3,
      description: 'Primary accounting system with AR/AP ledgers'
    },
    {
      id: 'quickbooks-1',
      name: 'QuickBooks Online',
      type: 'erp',
      platform: 'QuickBooks',
      status: 'disconnected',
      description: 'Cloud-based accounting and bookkeeping software'
    },
    {
      id: 'sage-1',
      name: 'Sage 50cloud',
      type: 'erp',
      platform: 'Sage',
      status: 'error',
      lastSync: '2 days ago',
      description: 'Desktop accounting software with cloud features'
    }
  ]);
  
  const availableIntegrations = [
    {
      platform: 'Xero',
      type: 'erp' as const,
      description: 'Connect your Xero accounting data for automatic reconciliation',
      logo: '🔷',
      popular: true
    },
    {
      platform: 'QuickBooks',
      type: 'erp' as const,
      description: 'Sync with QuickBooks Online for seamless ledger matching',
      logo: '🔵',
      popular: true
    },
    {
      platform: 'Sage',
      type: 'erp' as const,
      description: 'Integrate Sage accounting systems for comprehensive reconciliation',
      logo: '🟢',
      popular: false
    },
    {
      platform: 'NetSuite',
      type: 'erp' as const,
      description: 'Enterprise resource planning with advanced financial management',
      logo: '🔶',
      popular: false
    },
    {
      platform: 'SAP',
      type: 'erp' as const,
      description: 'Connect SAP systems for enterprise-level reconciliation',
      logo: '🔸',
      popular: false
    },
    {
      platform: 'Microsoft Dynamics',
      type: 'erp' as const,
      description: 'Integrate with Dynamics 365 for comprehensive business management',
      logo: '🔷',
      popular: false
    }
  ];
  
  const getStatusBadge = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="default">Disconnected</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  
  const handleConnect = (platform: string) => {
    const newConnection: Connection = {
      id: `${platform.toLowerCase()}-${Date.now()}`,
      name: `${platform} Connection`,
      type: 'erp',
      platform,
      status: 'pending',
      description: `${platform} integration`
    };
    
    setConnectionModal({ open: true, connection: newConnection });
  };
  
  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'disconnected' as const, lastSync: undefined, accountsConnected: undefined }
          : conn
      )
    );
  };
  
  const handleReconnect = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'connected' as const, lastSync: 'Just now', accountsConnected: 3 }
          : conn
      )
    );
  };
  
  const completeConnection = () => {
    if (connectionModal.connection) {
      const updatedConnection = {
        ...connectionModal.connection,
        status: 'connected' as const,
        lastSync: 'Just now',
        accountsConnected: 3
      };
      
      setConnections(prev => [...prev, updatedConnection]);
      setConnectionModal({ open: false });
      setAuthCode('');
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">System Connections</h1>
        <p className="text-body-lg text-neutral-600">
          Connect your ERP and business systems to enable automatic reconciliation and real-time matching.
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-120 border-b-2 ${
            activeTab === 'connections'
              ? 'text-primary-700 border-primary-500'
              : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          System Connections
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-120 border-b-2 ${
            activeTab === 'contacts'
              ? 'text-primary-700 border-primary-500'
              : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300'
          }`}
        >
          Customers & Vendors
        </button>
      </div>
      
      {activeTab === 'connections' ? (
        <>
          {/* Current Connections */}
          <div className="mb-12">
            <h2 className="text-h2 text-neutral-900 mb-6">Active Connections</h2>
            
            {connections.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-h3 text-neutral-900 mb-2">No connections yet</h3>
                  <p className="text-body text-neutral-600 max-w-md mx-auto">
                    Connect your first ERP or business system to start automatically reconciling your ledgers.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((connection) => (
                  <Card key={connection.id} className="hover:shadow-lg transition-shadow duration-240">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🔷</span>
                          </div>
                          <div>
                            <h3 className="text-h3 text-neutral-900">{connection.name}</h3>
                            <p className="text-small text-neutral-600">{connection.platform}</p>
                          </div>
                        </div>
                        {getStatusBadge(connection.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-body text-neutral-600 mb-4">{connection.description}</p>
                      
                      {connection.status === 'connected' && (
                        <div className="space-y-2 text-small text-neutral-600">
                          <div className="flex justify-between">
                            <span>Last sync:</span>
                            <span className="font-medium">{connection.lastSync}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accounts:</span>
                            <span className="font-medium">{connection.accountsConnected}</span>
                          </div>
                        </div>
                      )}
                      
                      {connection.status === 'error' && (
                        <div className="bg-error-50 border border-error-200 rounded-md p-3">
                          <p className="text-small text-error-700">
                            Connection error: Authentication expired. Please reconnect to resume sync.
                          </p>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter>
                      <div className="flex space-x-2 w-full">
                        {connection.status === 'connected' && (
                          <>
                            <Button variant="ghost" size="sm" className="flex-1">
                              Sync Now
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleDisconnect(connection.id)}
                            >
                              Disconnect
                            </Button>
                          </>
                        )}
                        
                        {(connection.status === 'disconnected' || connection.status === 'error') && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleReconnect(connection.id)}
                          >
                            {connection.status === 'error' ? 'Reconnect' : 'Connect'}
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Available Integrations */}
          <div>
            <h2 className="text-h2 text-neutral-900 mb-6">Available Integrations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableIntegrations.map((integration) => {
                const isConnected = connections.some(conn => 
                  conn.platform === integration.platform && conn.status === 'connected'
                );
                
                return (
                  <Card key={integration.platform} className="hover:shadow-lg transition-shadow duration-240">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{integration.logo}</span>
                          </div>
                          <div>
                            <h3 className="text-h3 text-neutral-900">{integration.platform}</h3>
                            <p className="text-small text-neutral-600 capitalize">{integration.type} System</p>
                          </div>
                        </div>
                        {integration.popular && (
                          <Badge variant="default">Popular</Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-body text-neutral-600">{integration.description}</p>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        variant={isConnected ? "ghost" : "primary"} 
                        size="sm" 
                        className="w-full"
                        disabled={isConnected}
                        onClick={() => handleConnect(integration.platform)}
                      >
                        {isConnected ? 'Already Connected' : 'Connect'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Customers & Vendors Tab */
        <CustomerVendorList 
          onInvite={(contact) => {
            console.log('Invitation sent to:', contact);
          }}
        />
      )}
      
      {/* Connection Setup Modal */}
      <Modal
        isOpen={connectionModal.open}
        onClose={() => setConnectionModal({ open: false })}
        title={`Connect ${connectionModal.connection?.platform}`}
        description="Follow these steps to securely connect your accounting system"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-primary-900">Secure Connection</h4>
                <p className="text-small text-primary-700 mt-1">
                  LedgerLink uses OAuth 2.0 for secure authentication. Your login credentials are never stored by us.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-neutral-900 mb-3">Setup Steps:</h4>
              <ol className="space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <div>
                    <p className="text-sm text-neutral-900 font-medium">Authorize Connection</p>
                    <p className="text-xs text-neutral-600">Click the button below to open {connectionModal.connection?.platform} authorization</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-300 text-neutral-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <div>
                    <p className="text-sm text-neutral-900 font-medium">Grant Permissions</p>
                    <p className="text-xs text-neutral-600">Allow LedgerLink to access your accounting data</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-neutral-300 text-neutral-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <div>
                    <p className="text-sm text-neutral-900 font-medium">Complete Setup</p>
                    <p className="text-xs text-neutral-600">Return here to finish the connection process</p>
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="border-t border-neutral-200 pt-4">
              <Input 
                label="Authorization Code (if required)"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Enter code from authorization page..."
                helperText="Some systems require you to copy an authorization code"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="primary" 
              onClick={completeConnection}
              className="flex-1"
            >
              Authorize & Connect
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setConnectionModal({ open: false })}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};