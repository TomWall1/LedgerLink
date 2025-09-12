import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function ERPConnectionManager() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/erp/connections');
      setConnections(response.data.connections || []);
    } catch (err) {
      console.error('Error fetching ERP connections:', err);
      setError('Failed to fetch ERP connections');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Are you sure you want to disconnect this ERP system?')) {
      return;
    }

    try {
      await api.delete(`/api/erp/connections/${connectionId}`);
      await fetchConnections(); // Refresh the list
    } catch (err) {
      console.error('Error disconnecting ERP:', err);
      setError('Failed to disconnect ERP system');
    }
  };

  const handleConnectXero = () => {
    window.location.href = '/xero-auth';
  };

  if (loading) {
    return <div className="loading">Loading ERP connections...</div>;
  }

  return (
    <div className="erp-connection-manager">
      <h1>ERP Connection Manager</h1>
      <p>Manage your connections to external ERP systems</p>

      {error && <div className="error-message">{error}</div>}

      <div className="available-erp-systems">
        <h2>Available ERP Systems</h2>
        <div className="erp-cards">
          <div className="erp-card">
            <h3>Xero</h3>
            <p>Connect to Xero accounting system to sync invoices and customers</p>
            <button onClick={handleConnectXero} className="btn btn-primary">
              Connect to Xero
            </button>
          </div>
          
          {/* Future ERP systems can be added here */}
          <div className="erp-card coming-soon">
            <h3>QuickBooks</h3>
            <p>QuickBooks integration coming soon</p>
            <button disabled className="btn btn-secondary">
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {connections.length > 0 && (
        <div className="active-connections">
          <h2>Active Connections</h2>
          <div className="connections-list">
            {connections.map(connection => (
              <div key={connection.id} className="connection-item">
                <div className="connection-info">
                  <h3>{connection.type}</h3>
                  <p>Connected: {new Date(connection.connectedAt).toLocaleDateString()}</p>
                  <p>Status: {connection.status}</p>
                  {connection.organizationName && (
                    <p>Organization: {connection.organizationName}</p>
                  )}
                </div>
                <div className="connection-actions">
                  <button 
                    onClick={() => handleDisconnect(connection.id)}
                    className="btn btn-danger"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ERPConnectionManager;