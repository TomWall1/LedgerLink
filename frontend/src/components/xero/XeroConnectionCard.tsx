import React, { useState } from 'react';
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
  
  const handleDisconnectClick = () => {
    console.log('🔴 Disconnect button clicked for connection:', connection._id);
    console.log('🔴 Opening disconnect confirmation modal');
    setShowDisconnectModal(true);
  };
  
  const handleDisconnect = async () => {
    console.log('🔴 Confirming disconnect for connection:', connection._id);
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection._id);
      setShowDisconnectModal(false);
      console.log('✅ Successfully disconnected');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      // Error handling is done in parent component
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(connection._id);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSyncing(false);
    }
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
        connection.status === 'expired' && 'border-warning-200 bg-warning-50'
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
              {getStatusIcon(connection.status)}
              <Badge variant={xeroService.getStatusColor(connection.status)}>
                {xeroService.getConnectionStatusText(connection.status)}
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
            
            {/* Data counts */}
            {connection.dataCounts && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-h3 font-semibold text-neutral-900">
                    {connection.dataCounts.invoices.toLocaleString()}
                  </div>
                  <div className="text-small text-neutral-600">Invoices</div>
                </div>
                <div className="bg-neutral-50 rounded-md p-3">
                  <div className="text-h3 font-semibold text-neutral-900">
                    {connection.dataCounts.contacts.toLocaleString()}
                  </div>
                  <div className="text-small text-neutral-600">Contacts</div>
                </div>
              </div>
            )}
            
            {/* Last sync info */}
            <div className="flex items-center justify-between text-small text-neutral-600">
              <span>Last synced:</span>
              <span>{xeroService.formatDate(connection.lastSyncAt)}</span>
            </div>
            
            {/* Sync status */}
            {connection.lastSyncStatus !== 'success' && (
              <div className="flex items-center space-x-2 text-small">
                <svg className="w-4 h-4 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-warning-700">Sync issues detected</span>
              </div>
            )}
            
            {/* Recent errors */}
            {connection.syncErrors && connection.syncErrors.length > 0 && (
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
                onClick={() => onHealthCheck(connection._id)}
                disabled={isLoading}
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
                disabled={isLoading || connection.status !== 'active'}
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
              disabled={isLoading}
            >
              Disconnect
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Disconnect confirmation modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => {
          console.log('🔴 Closing disconnect modal');
          setShowDisconnectModal(false);
        }}
        title="Disconnect Xero"
        description={`Are you sure you want to disconnect ${connection.tenantName}? This will stop syncing data from Xero.`}
      >
        <div className="flex items-center justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              console.log('🔴 Cancel disconnect clicked');
              setShowDisconnectModal(false);
            }}
            disabled={isDisconnecting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            isLoading={isDisconnecting}
          >
            Disconnect
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default XeroConnectionCard;