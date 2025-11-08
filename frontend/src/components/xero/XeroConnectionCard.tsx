import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { XeroConnection, xeroService } from '../../services/xeroService';
import { cn } from '../../utils/cn';

export interface XeroConnectionCardProps {
  connection: XeroConnection;
  onDisconnect: (connectionId: string) => void;
  onSync: (connectionId: string) => void;
  onHealthCheck: (connectionId: string) => void;
  isLoading?: boolean;
}

interface ConnectionStats {
  customers: number;
  vendors: number;
  totalContacts: number;
  loading: boolean;
  error?: string;
}

const XeroConnectionCard: React.FC<XeroConnectionCardProps> = ({
  connection,
  onDisconnect,
  onSync,
  onHealthCheck,
  isLoading = false
}) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<ConnectionStats>({
    customers: 0,
    vendors: 0,
    totalContacts: 0,
    loading: true
  });
  
  // Fetch connection stats when component mounts
  useEffect(() => {
    fetchConnectionStats();
  }, [connection._id]);
  
  const fetchConnectionStats = async () => {
    try {
      console.log('📊 Fetching connection stats for:', connection._id);
      const response = await fetch(
        `https://ledgerlink.onrender.com/api/xero/connection-stats/${connection._id}`
      );
      const data = await response.json();
      
      console.log('📊 Stats response:', data);
      
      if (data.success) {
        setStats({
          customers: data.data.customers,
          vendors: data.data.vendors,
          totalContacts: data.data.totalContacts,
          loading: false
        });
      } else {
        // Authentication error or other issue
        setStats({
          customers: 0,
          vendors: 0,
          totalContacts: 0,
          loading: false,
          error: data.error
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch connection stats:', error);
      setStats({
        customers: 0,
        vendors: 0,
        totalContacts: 0,
        loading: false,
        error: 'Failed to load statistics'
      });
    }
  };
  
  const handleReconnect = async () => {
    console.log('🔄 Reconnecting to Xero...');
    try {
      // Get auth URL from backend
      const response = await fetch('https://ledgerlink.onrender.com/api/xero/auth');
      const data = await response.json();
      
      if (data.success && data.data.authUrl) {
        // Redirect to Xero authorization
        window.location.href = data.data.authUrl;
      } else {
        console.error('Failed to get auth URL:', data);
      }
    } catch (error) {
      console.error('Error initiating reconnection:', error);
    }
  };
  
  const handleDisconnectClick = () => {
    console.log('🔴 [XeroConnectionCard] Disconnect button clicked');
    console.log('🔴 [XeroConnectionCard] Connection ID:', connection._id);
    console.log('🔴 [XeroConnectionCard] Connection Name:', connection.tenantName);
    console.log('🔴 [XeroConnectionCard] Opening disconnect modal...');
    setShowDisconnectModal(true);
    console.log('🔴 [XeroConnectionCard] Modal state set to true');
  };
  
  const handleDisconnect = async () => {
    console.log('🔴 [XeroConnectionCard] Confirming disconnect');
    console.log('🔴 [XeroConnectionCard] Connection ID:', connection._id);
    setIsDisconnecting(true);
    try {
      console.log('🔴 [XeroConnectionCard] Calling onDisconnect...');
      await onDisconnect(connection._id);
      console.log('✅ [XeroConnectionCard] Disconnect successful, closing modal');
      setShowDisconnectModal(false);
    } catch (error) {
      console.error('❌ [XeroConnectionCard] Disconnect error:', error);
      // Error handling is done in parent component
    } finally {
      setIsDisconnecting(false);
      console.log('🔴 [XeroConnectionCard] Disconnect process completed');
    }
  };
  
  const handleSync = async () => {
    console.log('🔄 [XeroConnectionCard] Starting sync');
    setIsSyncing(true);
    try {
      await onSync(connection._id);
      // Refresh stats after sync
      await fetchConnectionStats();
      console.log('✅ [XeroConnectionCard] Sync successful');
    } catch (error) {
      console.error('❌ [XeroConnectionCard] Sync error:', error);
      // Error handling is done in parent component
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleCloseModal = () => {
    console.log('🔴 [XeroConnectionCard] Closing disconnect modal');
    setShowDisconnectModal(false);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="w-4 h-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg',
        connection.status === 'error' && 'border-error-200 bg-error-50',
        connection.status === 'expired' && 'border-warning-200 bg-warning-50',
        stats.error && 'border-warning-200 bg-warning-50'
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {/* Xero logo */}
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-h3 font-semibold text-neutral-900 truncate">
                  {connection.tenantName}
                </h3>
                <p className="text-small text-neutral-600">
                  {connection.tenantType} • Xero
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getStatusIcon(stats.error ? 'error' : connection.status)}
              <Badge variant={stats.error ? 'warning' : xeroService.getStatusColor(connection.status)}>
                {stats.error ? 'Auth Required' : xeroService.getConnectionStatusText(connection.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Connection details */}
            {connection.settings && (
              <div className="grid grid-cols-2 gap-4 text-small">
                <div>
                  <span className="text-neutral-600">Currency:</span>
                  <span className="ml-1 font-medium">{connection.settings.baseCurrency}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Country:</span>
                  <span className="ml-1 font-medium">{connection.settings.countryCode}</span>
                </div>
              </div>
            )}
            
            {/* Error message with reconnect button */}
            {stats.error && (
              <div className="bg-warning-50 border border-warning-200 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-small font-medium text-warning-800">
                      {stats.error}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleReconnect}
                      className="mt-2"
                    >
                      Reconnect to Xero
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data counts - Customers and Vendors */}
            {!stats.error && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-h3 font-semibold text-neutral-900">
                    {stats.loading ? '...' : stats.customers.toLocaleString()}
                  </div>
                  <div className="text-small text-neutral-600">Customers</div>
                </div>
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-h3 font-semibold text-neutral-900">
                    {stats.loading ? '...' : stats.vendors.toLocaleString()}
                  </div>
                  <div className="text-small text-neutral-600">Vendors</div>
                </div>
              </div>
            )}
            
            {/* Last sync info */}
            <div className="flex items-center justify-between text-small text-neutral-600">
              <span>Last synced:</span>
              <span>{xeroService.formatDate(connection.lastSyncAt)}</span>
            </div>
            
            {/* Sync status */}
            {connection.lastSyncStatus !== 'success' && !stats.error && (
              <div className="flex items-center space-x-2 text-small">
                <svg className="w-4 h-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-warning-700">Sync issues detected</span>
              </div>
            )}
            
            {/* Recent errors */}
            {connection.syncErrors && connection.syncErrors.length > 0 && !stats.error && (
              <div className="text-small">
                <div className="text-neutral-600 mb-1">Recent errors:</div>
                <div className="text-error-600 truncate">
                  {connection.syncErrors[connection.syncErrors.length - 1].type}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  console.log('🏥 [XeroConnectionCard] Health check clicked');
                  onHealthCheck(connection._id);
                }}
                disabled={isLoading || !!stats.error}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Health
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSync}
                disabled={isLoading || connection.status !== 'active' || !!stats.error}
                isLoading={isSyncing}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </Button>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnectClick}
              disabled={isLoading || isDisconnecting}
              isLoading={isDisconnecting}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Disconnect confirmation modal */}
      {console.log('🔴 [XeroConnectionCard] Rendering modal, isOpen:', showDisconnectModal)}
      <Modal
        isOpen={showDisconnectModal}
        onClose={handleCloseModal}
        title="Disconnect Xero"
        description={`Are you sure you want to disconnect ${connection.tenantName}? This will stop syncing data from Xero.`}
        size="md"
      >
        <div className="flex items-center justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={handleCloseModal}
            disabled={isDisconnecting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            isLoading={isDisconnecting}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default XeroConnectionCard;