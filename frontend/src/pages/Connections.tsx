import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { mockERPConnections, supportedERPSystems, supportedBSMSystems } from '../data/mockData';
import { useToast } from '../hooks/useToast';

export interface ConnectionsProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

const Connections: React.FC<ConnectionsProps> = ({ isLoggedIn, onLogin }) => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connections, setConnections] = useState(mockERPConnections);
  const { success, error } = useToast();
  
  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">
            Account Required
          </h2>
          <p className="text-body-lg text-neutral-600 mb-8">
            Please create an account to connect your ERP and BSM systems. 
            This ensures secure authentication and data protection.
          </p>
          <Button variant="primary" onClick={onLogin}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }
  
  const handleConnect = async (system: any) => {
    setSelectedSystem(system);
    setIsConnectModalOpen(true);
  };
  
  const handleConnectSubmit = async () => {
    setIsConnecting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newConnection = {
        id: `conn-${Date.now()}`,
        name: `${selectedSystem.name} Production`,
        type: selectedSystem.id,
        status: 'connected' as const,
        lastSync: new Date().toISOString(),
        recordCount: Math.floor(Math.random() * 2000) + 500,
      };
      
      setConnections(prev => [...prev, newConnection]);
      setIsConnectModalOpen(false);
      setSelectedSystem(null);
      setIsConnecting(false);
      
      success(`Successfully connected to ${selectedSystem.name}!`);
    }, 2000);
  };
  
  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'disconnected' as const }
          : conn
      )
    );
    success('Connection disconnected');
  };
  
  const handleSync = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, lastSync: new Date().toISOString(), recordCount: Math.floor(Math.random() * 2000) + 500 }
          : conn
      )
    );
    success('Synchronization completed');
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="error">Disconnected</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Connections</h1>
          <p className="mt-1 text-body text-neutral-600">
            Connect your ERP and BSM systems to enable automatic data synchronization
          </p>
        </div>
      </div>
      
      {/* Current Connections */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-h3 font-semibold text-neutral-900">
              Your Connections
            </h2>
            <p className="text-body text-neutral-600">
              Manage your connected systems and synchronization settings
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-h3 font-bold text-primary-600">
                        {supportedERPSystems.find(s => s.id === connection.type)?.logo || '🔗'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-neutral-900">
                        {connection.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        {getStatusBadge(connection.status)}
                        {connection.lastSync && (
                          <span className="text-small text-neutral-500">
                            Last sync: {formatDate(connection.lastSync)}
                          </span>
                        )}
                        {connection.recordCount && (
                          <span className="text-small text-neutral-500">
                            {connection.recordCount.toLocaleString()} records
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {connection.status === 'connected' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSync(connection.id)}
                      >
                        Sync now
                      </Button>
                    )}
                    <Button 
                      variant={connection.status === 'connected' ? 'destructive' : 'primary'} 
                      size="sm"
                      onClick={() => connection.status === 'connected' 
                        ? handleDisconnect(connection.id)
                        : handleConnect(supportedERPSystems.find(s => s.id === connection.type))
                      }
                    >
                      {connection.status === 'connected' ? 'Disconnect' : 'Reconnect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* ERP Systems */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-neutral-900">
            ERP Systems
          </h2>
          <p className="text-body text-neutral-600">
            Connect your accounting and enterprise resource planning systems
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedERPSystems.map((system) => {
              const isConnected = connections.some(conn => conn.type === system.id && conn.status === 'connected');
              
              return (
                <div key={system.id} className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors duration-120">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{system.logo}</span>
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-neutral-900">{system.name}</h3>
                      {isConnected && <Badge variant="success" className="mt-1">Connected</Badge>}
                    </div>
                  </div>
                  <p className="text-small text-neutral-600 mb-4">{system.description}</p>
                  <Button 
                    variant={isConnected ? "secondary" : "primary"} 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleConnect(system)}
                    disabled={isConnected}
                  >
                    {isConnected ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* BSM Systems */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-neutral-900">
            Business Systems (BSM)
          </h2>
          <p className="text-body text-neutral-600">
            Connect your CRM and business management platforms
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedBSMSystems.map((system) => (
              <div key={system.id} className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors duration-120">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{system.logo}</span>
                  </div>
                  <div>
                    <h3 className="text-body font-semibold text-neutral-900">{system.name}</h3>
                  </div>
                </div>
                <p className="text-small text-neutral-600 mb-4">{system.description}</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleConnect(system)}
                >
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Connect Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title={`Connect to ${selectedSystem?.name}`}
        description="Enter your system credentials to establish a secure connection"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Server URL"
            placeholder={`https://your-${selectedSystem?.id}.com`}
            helperText="Your system's base URL or domain"
          />
          <Input
            label="API Key / Client ID"
            placeholder="Enter your API key or client ID"
            helperText="Found in your system's API settings"
          />
          <Input
            label="Client Secret"
            type="password"
            placeholder="Enter your client secret"
            helperText="Keep this secure and don't share"
          />
          
          <div className="flex items-center p-3 bg-primary-50 rounded-md">
            <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-small font-medium text-primary-800">Secure Connection</p>
              <p className="text-xs text-primary-700">All credentials are encrypted and stored securely</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsConnectModalOpen(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConnectSubmit}
              isLoading={isConnecting}
            >
              Connect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Connections };