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
      setError(err.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [companyId]);
  
  const disconnectConnection = useCallback(async (connectionId: string) => {
    await xeroService.disconnectConnection(connectionId);
    
    // Update local state to mark connection as revoked
    setConnections(prev => prev.map(conn => 
      conn._id === connectionId 
        ? { ...conn, status: 'revoked' as const }
        : conn
    ));
  }, []);
  
  const syncConnection = useCallback(async (connectionId: string) => {
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
  }, []);
  
  const checkConnectionHealth = useCallback(async (connectionId: string) => {
    return await xeroService.checkConnectionHealth(connectionId);
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
  
  // Auto-refresh connections every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadConnections();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [loadConnections]);
  
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