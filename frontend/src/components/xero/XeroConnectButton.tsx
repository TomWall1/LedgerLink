import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { xeroService } from '../../services/xeroService';

export interface XeroConnectButtonProps {
  companyId: string;
  onConnectionStart?: () => void;
  onConnectionError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const XeroConnectButton: React.FC<XeroConnectButtonProps> = ({
  companyId,
  onConnectionStart,
  onConnectionError,
  disabled = false,
  className
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    if (!companyId) {
      onConnectionError?.('Company ID is required');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      onConnectionStart?.();
      
      // Get authorization URL from backend
      const authData = await xeroService.initiateConnection(companyId);
      
      // Redirect to Xero for authorization
      window.location.href = authData.authUrl;
      
    } catch (error: any) {
      console.error('Failed to connect to Xero:', error);
      onConnectionError?.(error.message || 'Failed to connect to Xero');
      setIsConnecting(false);
    }
  };
  
  return (
    <Button
      variant="primary"
      onClick={handleConnect}
      disabled={disabled || isConnecting || !companyId}
      isLoading={isConnecting}
      className={className}
      leftIcon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      }
    >
      {isConnecting ? 'Connecting to Xero...' : 'Connect to Xero'}
    </Button>
  );
};

export default XeroConnectButton;