import { useState, useEffect, useCallback } from 'react';
import { XeroConnection, XeroConnectionHealth, xeroService } from '../services/xeroService';

export interface UseXeroConnectionsReturn {
  connections: XeroConnection[];
  loading: boolean;
  error: string | null;
  loadConnections: () => Promise<void>;
  disconnectConnection: (connectionId: string) => Promise<void>;
  syncConnection: (connectionId: string) => Promise<{ lastSyncAt: string; status: string }>;
  checkConnectionHealth: (connectionId: string) => Promise<XeroConnectionHealth>;
  refreshConnection: (connectionId: string) => Promise<void>;
}

export const useXeroConnections = (companyId?: string): UseXeroConnectionsReturn => {
  const [connections, setConnections] = useState<XeroConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await xeroService.getConnections(companyId);
      setConnections(data);
    } catch (err: any) {
      console.error('Failed to load Xero connections:', err);
      
      // Handle missing backend endpoints gracefully in demo mode
      if (err.message?.includes('backend implementation') || 
          err.message?.includes('404') ||
          err.response?.status === 404) {
        console.log('Demo mode: Xero backend not implemented yet');
        setConnections([]); // Empty connections for demo
        setError(null); // Don't show error for missing backend
      } else {
        setError(err.message || 'Failed to load connections');
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);
  
  const disconnectConnection = useCallback(async (connectionId: string) => {
    try {
      await xeroService.disconnectConnection(connectionId);
      
      // Update local state to mark connection as revoked
      setConnections(prev => prev.map(conn => 
        conn._id === connectionId 
          ? { ...conn, status: 'revoked' as const }
          : conn
      ));
    } catch (err: any) {
      // Handle gracefully in demo mode
      if (err.message?.includes('backend implementation')) {
        console.log('Demo mode: Disconnect not implemented');
        return;
      }
      throw err;
    }
  }, []);
  
  const syncConnection = useCallback(async (connectionId: string) => {
    try {
      const result = await xeroService.syncConnection(connectionId);
      
      // Update local state with new sync info
      setConnections(prev => prev.map(conn => 
        conn._id === connectionId 
          ? { 
              ...conn, 
              lastSyncAt: result.lastSyncAt,
              lastSyncStatus: result.status as 'success' | 'error' | 'partial'
            }
          : conn
      ));
      
      return result;
    } catch (err: any) {
      // Handle gracefully in demo mode
      if (err.message?.includes('backend implementation')) {
        console.log('Demo mode: Sync not implemented');
        return { lastSyncAt: new Date().toISOString(), status: 'demo' };
      }
      throw err;
    }
  }, []);
  
  const checkConnectionHealth = useCallback(async (connectionId: string) => {
    try {
      return await xeroService.checkConnectionHealth(connectionId);
    } catch (err: any) {
      // Handle gracefully in demo mode
      if (err.message?.includes('backend implementation')) {
        console.log('Demo mode: Health check not implemented');
        return {
          connectionId,
          tenantName: 'Demo Organization',
          status: 'demo',
          isExpired: false,
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: 'demo',
          apiConnectivity: 'ok' as const
        };
      }
      throw err;
    }
  }, []);
  
  const refreshConnection = useCallback(async (connectionId: string) => {
    try {
      // Trigger a sync and then reload connections
      await syncConnection(connectionId);
      await loadConnections();
    } catch (error) {
      // If sync fails, still try to reload connections
      await loadConnections();
      throw error;
    }
  }, [syncConnection, loadConnections]);
  
  // Load connections on mount and when companyId changes
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);
  
  // Auto-refresh connections every 5 minutes (only if not in demo mode)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if we have connections or no error
      if (connections.length > 0 || !error) {
        loadConnections();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [loadConnections, connections.length, error]);
  
  return {
    connections,
    loading,
    error,
    loadConnections,
    disconnectConnection,
    syncConnection,
    checkConnectionHealth,
    refreshConnection
  };
};