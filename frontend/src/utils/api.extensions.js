// Extensions to the api.js utility for ERP connections

// Add these functions to your existing api.js utility or create a new module

// ERP Connections API methods
const erpConnections = {
  // Get all connections for the current user
  getConnections: async () => {
    try {
      // First try with /api prefix
      return await api.get('/api/erp-connections');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.get('/erp-connections');
      }
      throw err;
    }
  },
  
  // Create a new connection
  createConnection: async (connectionData) => {
    try {
      // First try with /api prefix
      return await api.post('/api/erp-connections', connectionData);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.post('/erp-connections', connectionData);
      }
      throw err;
    }
  },
  
  // Get a specific connection
  getConnection: async (connectionId) => {
    try {
      // First try with /api prefix
      return await api.get(`/api/erp-connections/${connectionId}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.get(`/erp-connections/${connectionId}`);
      }
      throw err;
    }
  },
  
  // Update a connection
  updateConnection: async (connectionId, connectionData) => {
    try {
      // First try with /api prefix
      return await api.put(`/api/erp-connections/${connectionId}`, connectionData);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.put(`/erp-connections/${connectionId}`, connectionData);
      }
      throw err;
    }
  },
  
  // Delete a connection
  deleteConnection: async (connectionId) => {
    try {
      // First try with /api prefix
      return await api.delete(`/api/erp-connections/${connectionId}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.delete(`/erp-connections/${connectionId}`);
      }
      throw err;
    }
  },
  
  // Link a Xero tenant to a connection
  linkXeroTenant: async (connectionId, tenantId) => {
    try {
      // First try with /api prefix
      return await api.post(`/api/erp-connections/${connectionId}/link-xero`, {
        tenantId
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.post(`/erp-connections/${connectionId}/link-xero`, {
          tenantId
        });
      }
      throw err;
    }
  },
  
  // Get data from a Xero connection
  getXeroData: async (connectionId) => {
    try {
      // First try with /api prefix
      return await api.get(`/api/erp-connections/${connectionId}/xero-data`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Fall back to no prefix if 404
        return await api.get(`/erp-connections/${connectionId}/xero-data`);
      }
      throw err;
    }
  }
};

// Add to the api object
api.erpConnections = erpConnections;

export default api;
