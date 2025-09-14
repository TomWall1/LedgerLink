import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import XeroConnectionCard from '../components/xero/XeroConnectionCard';
import XeroConnectButton from '../components/xero/XeroConnectButton';
import XeroInvoiceTable from '../components/xero/XeroInvoiceTable';
import { useXeroConnections } from '../hooks/useXeroConnections';
import { useToast } from '../hooks/useToast';
import { cn } from '../utils/cn';

export interface ConnectionsPageProps {
  companyId?: string;
}

const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ companyId = 'default-company' }) => {
  const {
    connections,
    loading,
    error,
    loadConnections,
    disconnectConnection,
    syncConnection,
    checkConnectionHealth
  } = useXeroConnections(companyId);
  
  const { addToast } = useToast();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  
  // Handle OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success') === 'true';
    const error = urlParams.get('error');
    const connected = urlParams.get('connected');
    
    if (success && connected) {
      addToast({
        title: 'Xero Connected',
        description: `Successfully connected to ${decodeURIComponent(connected)}`,
        variant: 'success'
      });
      // Reload connections to show new connection
      loadConnections();
    } else if (error) {
      const message = urlParams.get('message');
      addToast({
        title: 'Connection Failed',
        description: message ? decodeURIComponent(message) : 'Failed to connect to Xero',
        variant: 'error'
      });
    }
    
    // Clean up URL parameters
    if (success || error) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [addToast, loadConnections]);
  
  const handleConnectionStart = () => {
    addToast({
      title: 'Connecting to Xero',
      description: 'Redirecting you to Xero for authorization...',
      variant: 'default'
    });
  };
  
  const handleConnectionError = (error: string) => {
    addToast({
      title: 'Connection Error',
      description: error,
      variant: 'error'
    });
  };
  
  const handleDisconnect = async (connectionId: string) => {
    try {
      await disconnectConnection(connectionId);
      addToast({
        title: 'Xero Disconnected',
        description: 'Successfully disconnected from Xero',
        variant: 'success'
      });
    } catch (error: any) {
      addToast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect from Xero',
        variant: 'error'
      });
    }
  };
  
  const handleSync = async (connectionId: string) => {
    try {
      await syncConnection(connectionId);
      addToast({
        title: 'Sync Completed',
        description: 'Successfully synced data from Xero',
        variant: 'success'
      });
    } catch (error: any) {
      addToast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync with Xero',
        variant: 'error'
      });
    }
  };
  
  const handleHealthCheck = async (connectionId: string) => {
    try {
      const health = await checkConnectionHealth(connectionId);
      
      if (health.apiConnectivity === 'ok') {
        addToast({
          title: 'Connection Healthy',
          description: 'Xero connection is working properly',
          variant: 'success'
        });
      } else {
        addToast({
          title: 'Connection Issues',
          description: health.apiError || 'Connection health check failed',
          variant: 'warning'
        });
      }
    } catch (error: any) {
      addToast({
        title: 'Health Check Failed',
        description: error.message || 'Failed to check connection health',
        variant: 'error'
      });
    }
  };
  
  const handleViewInvoices = (connectionId: string) => {
    setSelectedConnection(connectionId);
    setShowInvoiceModal(true);
  };
  
  const activeConnections = connections.filter(conn => conn.status === 'active');
  const inactiveConnections = connections.filter(conn => conn.status !== 'active');
  
  if (loading && connections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-bold text-neutral-900">Connections</h1>
            <p className="text-body text-neutral-600 mt-1">
              Connect your ERP and business systems to sync data automatically
            </p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-neutral-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded w-24"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-full"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Connections</h1>
          <p className="text-body text-neutral-600 mt-1">
            Connect your ERP and business systems to sync data automatically
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary"
            onClick={loadConnections}
            disabled={loading}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Error state */}
      {error && (
        <Card className="border-error-200 bg-error-50">
          <CardContent>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-error-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-body font-medium text-error-900">Failed to load connections</p>
                <p className="text-small text-error-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add New Connection */}
      <Card>
        <CardHeader>
          <h2 className="text-h2 font-semibold text-neutral-900">Add New Connection</h2>
          <p className="text-body text-neutral-600 mt-1">
            Connect to your accounting software to start syncing invoice and customer data
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Xero */}
            <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900">Xero</h3>
                  <p className="text-small text-neutral-600">Cloud accounting software</p>
                </div>
              </div>
              <p className="text-small text-neutral-600 mb-4">
                Connect to Xero to automatically sync invoices, contacts, and accounting data.
              </p>
              <XeroConnectButton
                companyId={companyId}
                onConnectionStart={handleConnectionStart}
                onConnectionError={handleConnectionError}
                className="w-full"
              />
            </div>
            
            {/* Placeholder for other integrations */}
            <div className="border border-neutral-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-600">QuickBooks</h3>
                  <p className="text-small text-neutral-500">Coming soon</p>
                </div>
              </div>
              <p className="text-small text-neutral-500 mb-4">
                QuickBooks integration will be available in a future update.
              </p>
              <Button variant="secondary" disabled className="w-full">
                Coming Soon
              </Button>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-600">NetSuite</h3>
                  <p className="text-small text-neutral-500">Coming soon</p>
                </div>
              </div>
              <p className="text-small text-neutral-500 mb-4">
                NetSuite integration will be available in a future update.
              </p>
              <Button variant="secondary" disabled className="w-full">
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Connections */}
      {activeConnections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 font-semibold text-neutral-900">Active Connections</h2>
            <span className="text-small text-neutral-600">
              {activeConnections.length} connection{activeConnections.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeConnections.map((connection) => (
              <div key={connection._id} className="space-y-3">
                <XeroConnectionCard
                  connection={connection}
                  onDisconnect={handleDisconnect}
                  onSync={handleSync}
                  onHealthCheck={handleHealthCheck}
                  isLoading={loading}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewInvoices(connection._id)}
                  className="w-full"
                >
                  View Invoices
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Inactive Connections */}
      {inactiveConnections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 font-semibold text-neutral-900">Inactive Connections</h2>
            <span className="text-small text-neutral-600">
              {inactiveConnections.length} connection{inactiveConnections.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inactiveConnections.map((connection) => (
              <XeroConnectionCard
                key={connection._id}
                connection={connection}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
                onHealthCheck={handleHealthCheck}
                isLoading={loading}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && connections.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">No connections yet</h3>
            <p className="text-body text-neutral-600 mb-6">
              Connect your first accounting system to start syncing data automatically.
            </p>
            <XeroConnectButton
              companyId={companyId}
              onConnectionStart={handleConnectionStart}
              onConnectionError={handleConnectionError}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Xero Invoices"
        description="View and search invoices from your connected Xero organization"
        size="xl"
      >
        {selectedConnection && (
          <XeroInvoiceTable
            connectionId={selectedConnection}
            onError={(error) => {
              addToast({
                title: 'Invoice Error',
                description: error,
                variant: 'error'
              });
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ConnectionsPage;