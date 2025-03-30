import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Custom hook for managing ERP connections
 * Provides a simple interface for working with ERP connections
 */
const useERPConnections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(true);

  // Fetch all connections for the current user
  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.erpConnections.getConnections();
      setConnections(response.data.data || []);
      setServerAvailable(true);
    } catch (err) {
      console.error('Error fetching ERP connections:', err);
      setConnections([]);
      
      // Check if it's a server availability issue
      if (err.response && err.response.status === 404) {
        setServerAvailable(false);
        setError('The ERP connections API is not available. The server may be misconfigured.');
      } else if (err.isNetworkError || err.isTimeoutError) {
        setServerAvailable(false);
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(api.getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load connections on initial mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Create a new connection
  const createConnection = async (connectionData) => {
    try {
      setError(null);
      const response = await api.erpConnections.createConnection(connectionData);
      await fetchConnections(); // Refresh the list
      return response.data.data;
    } catch (err) {
      console.error('Error creating ERP connection:', err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Get a specific connection
  const getConnection = async (connectionId) => {
    try {
      setError(null);
      const response = await api.erpConnections.getConnection(connectionId);
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching ERP connection ${connectionId}:`, err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Update a connection
  const updateConnection = async (connectionId, connectionData) => {
    try {
      setError(null);
      const response = await api.erpConnections.updateConnection(connectionId, connectionData);
      await fetchConnections(); // Refresh the list
      return response.data.data;
    } catch (err) {
      console.error(`Error updating ERP connection ${connectionId}:`, err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Delete a connection
  const deleteConnection = async (connectionId) => {
    try {
      setError(null);
      await api.erpConnections.deleteConnection(connectionId);
      await fetchConnections(); // Refresh the list
      return true;
    } catch (err) {
      console.error(`Error deleting ERP connection ${connectionId}:`, err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Link a Xero tenant to a connection
  const linkXeroTenant = async (connectionId, tenantId, tenantName) => {
    try {
      setError(null);
      const response = await api.erpConnections.linkXeroTenant(connectionId, tenantId, tenantName);
      await fetchConnections(); // Refresh the list
      return response.data.data;
    } catch (err) {
      console.error(`Error linking Xero tenant to connection ${connectionId}:`, err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Get data from a Xero connection
  const getXeroData = async (connectionId, dataType = 'invoices') => {
    try {
      setError(null);
      const response = await api.erpConnections.getXeroData(connectionId, dataType);
      return response.data.data;
    } catch (err) {
      console.error(`Error fetching Xero data from connection ${connectionId}:`, err);
      setError(api.getErrorMessage(err));
      throw err;
    }
  };

  // Clear any errors
  const clearError = () => {
    setError(null);
  };

  // Check server availability
  const checkServerAvailability = async () => {
    try {
      await api.checkHealth();
      setServerAvailable(true);
      return true;
    } catch (err) {
      console.error('Server availability check failed:', err);
      setServerAvailable(false);
      return false;
    }
  };

  // Find a connection by provider type
  const findConnectionByProvider = (provider) => {
    return connections.find(conn => conn.provider === provider);
  };

  return {
    // State
    connections,
    loading,
    error,
    serverAvailable,
    
    // Actions
    fetchConnections,
    createConnection,
    getConnection,
    updateConnection,
    deleteConnection,
    linkXeroTenant,
    getXeroData,
    clearError,
    checkServerAvailability,
    findConnectionByProvider
  };
};

export default useERPConnections;