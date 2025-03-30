import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Custom hook for managing ERP connections
 * 
 * This hook provides a clean interface for working with ERP connections,
 * including loading, creation, deletion, and error handling. It also includes
 * a fallback "mock mode" for development when the backend is unavailable.
 * 
 * @returns {Object} Connection state and management functions
 */
const useERPConnections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mockMode, setMockMode] = useState(false);

  // Fetch connections from API
  const fetchConnections = useCallback(async () => {
    if (mockMode) return; // Skip API calls in mock mode
    
    try {
      setLoading(true);
      setError(null);
      
      // Try with the enhanced api utility if available
      if (api.erpConnections) {
        const response = await api.erpConnections.getConnections();
        setConnections(response.data.data || []);
        return;
      }
      
      // Fallback to direct API calls if the extension isn't available
      try {
        // Try with /api prefix first
        const response = await api.get('/api/erp-connections');
        setConnections(response.data.data || []);
      } catch (prefixErr) {
        if (prefixErr.response && prefixErr.response.status === 404) {
          // Try without the /api prefix
          const altResponse = await api.get('/erp-connections');
          setConnections(altResponse.data.data || []);
        } else {
          throw prefixErr;
        }
      }
    } catch (err) {
      console.error('Error fetching ERP connections:', err);
      
      // Switch to mock mode if endpoint not found
      if (err.response && err.response.status === 404) {
        console.warn('ERP connections endpoint not found, switching to mock mode');
        setMockMode(true);
        setConnections([]);
        setError('The ERP connections feature is currently in development mode.');
      } else {
        setError(`Failed to load connections: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [mockMode]);
  
  // Load connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);
  
  // Create a new connection
  const createConnection = useCallback(async (connectionData) => {
    try {
      setError(null);
      
      // In mock mode, create a local connection
      if (mockMode) {
        const mockConnection = {
          _id: 'mock-' + Date.now(),
          ...connectionData,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        setConnections(prev => [...prev, mockConnection]);
        return { success: true, data: mockConnection };
      }
      
      // Use the enhanced API utility if available
      if (api.erpConnections) {
        const response = await api.erpConnections.createConnection(connectionData);
        await fetchConnections(); // Refresh the list
        return response.data;
      }
      
      // Fallback to direct API calls
      try {
        const response = await api.post('/api/erp-connections', connectionData);
        await fetchConnections();
        return response.data;
      } catch (prefixErr) {
        if (prefixErr.response && prefixErr.response.status === 404) {
          const altResponse = await api.post('/erp-connections', connectionData);
          await fetchConnections();
          return altResponse.data;
        } else {
          throw prefixErr;
        }
      }
    } catch (err) {
      console.error('Error creating ERP connection:', err);
      
      // Switch to mock mode if endpoint not found
      if (err.response && err.response.status === 404) {
        setMockMode(true);
        const mockConnection = {
          _id: 'mock-' + Date.now(),
          ...connectionData,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        setConnections(prev => [...prev, mockConnection]);
        setError('Created in demo mode. The ERP connections API is unavailable.');
        return { success: true, data: mockConnection };
      }
      
      setError(`Failed to create connection: ${err.message || 'Unknown error'}`);
      throw err;
    }
  }, [mockMode, fetchConnections]);
  
  // Delete a connection
  const deleteConnection = useCallback(async (connectionId) => {
    try {
      setError(null);
      
      // In mock mode, just remove from local state
      if (mockMode) {
        setConnections(prev => prev.filter(conn => conn._id !== connectionId));
        return { success: true };
      }
      
      // Use the enhanced API utility if available
      if (api.erpConnections) {
        const response = await api.erpConnections.deleteConnection(connectionId);
        await fetchConnections(); // Refresh the list
        return response.data;
      }
      
      // Fallback to direct API calls
      try {
        const response = await api.delete(`/api/erp-connections/${connectionId}`);
        await fetchConnections();
        return response.data;
      } catch (prefixErr) {
        if (prefixErr.response && prefixErr.response.status === 404) {
          const altResponse = await api.delete(`/erp-connections/${connectionId}`);
          await fetchConnections();
          return altResponse.data;
        } else {
          throw prefixErr;
        }
      }
    } catch (err) {
      console.error('Error deleting ERP connection:', err);
      setError(`Failed to delete connection: ${err.message || 'Unknown error'}`);
      throw err;
    }
  }, [mockMode, fetchConnections]);
  
  // Enable mock mode manually
  const enableMockMode = useCallback(() => {
    setMockMode(true);
    setLoading(false);
    setError('Demo mode activated. Changes will not persist.');
  }, []);

  return {
    connections,
    loading,
    error,
    mockMode,
    fetchConnections,
    createConnection,
    deleteConnection,
    enableMockMode,
    clearError: () => setError(null)
  };
};

export default useERPConnections;
