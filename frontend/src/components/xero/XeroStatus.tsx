import React from 'react';
import { Badge } from '../ui/Badge';
import { xeroService } from '../../services/xeroService';
import { cn } from '../../utils/cn';

export interface XeroStatusProps {
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'partial';
  isExpired?: boolean;
  className?: string;
}

const XeroStatus: React.FC<XeroStatusProps> = ({
  status,
  lastSyncAt,
  lastSyncStatus,
  isExpired = false,
  className
}) => {
  const getStatusDetails = () => {
    if (isExpired || status === 'expired') {
      return {
        variant: 'warning' as const,
        text: 'Token Expired',
        description: 'Reconnection required',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      };
    }
    
    switch (status) {
      case 'active':
        return {
          variant: lastSyncStatus === 'error' ? 'warning' as const : 'success' as const,
          text: lastSyncStatus === 'error' ? 'Sync Issues' : 'Connected',
          description: lastSyncAt ? `Last synced ${xeroService.formatDate(lastSyncAt)}` : 'Ready to sync',
          icon: lastSyncStatus === 'error' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      
      case 'error':
        return {
          variant: 'error' as const,
          text: 'Connection Error',
          description: 'Check connection settings',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      
      case 'revoked':
        return {
          variant: 'default' as const,
          text: 'Disconnected',
          description: 'Connection removed',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        };
      
      default:
        return {
          variant: 'default' as const,
          text: 'Unknown',
          description: 'Status unknown',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };
  
  const statusDetails = getStatusDetails();
  
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn(
        'flex items-center space-x-1',
        statusDetails.variant === 'success' && 'text-success-600',
        statusDetails.variant === 'warning' && 'text-warning-600',
        statusDetails.variant === 'error' && 'text-error-600',
        statusDetails.variant === 'default' && 'text-neutral-500'
      )}>
        {statusDetails.icon}
      </div>
      <div>
        <Badge variant={statusDetails.variant}>
          {statusDetails.text}
        </Badge>
        {statusDetails.description && (
          <p className="text-xs text-neutral-500 mt-1">
            {statusDetails.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default XeroStatus;