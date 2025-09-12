import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function XeroAuth() {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/api/xero/status');
      if (response.data.connected) {
        setConnectionStatus('connected');
        setOrganizationInfo(response.data.organization);
      } else {
        setConnectionStatus('not_connected');
      }
    } catch (err) {
      console.error('Error checking Xero status:', err);
      setConnectionStatus('error');
      setError('Failed to check connection status');
    }
  };

  const handleOAuthCallback = async (code, state) => {
    try {
      setLoading(true);
      const response = await api.post('/api/xero/callback', { code, state });
      
      if (response.data.success) {
        setConnectionStatus('connected');
        setOrganizationInfo(response.data.organization);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError('OAuth callback failed');
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err.response?.data?.error || 'OAuth callback failed');
    } finally {
      setLoading(false);
    }
  };

  const initiateXeroConnection = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/xero/auth-url');
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error('Error initiating Xero connection:', err);
      setError('Failed to initiate Xero connection');
      setLoading(false);
    }
  };

  const disconnectXero = async () => {
    if (!window.confirm('Are you sure you want to disconnect from Xero?')) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/xero/disconnect');
      setConnectionStatus('not_connected');
      setOrganizationInfo(null);
    } catch (err) {
      console.error('Error disconnecting from Xero:', err);
      setError('Failed to disconnect from Xero');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/xero/test');
      alert(`Connection test successful! Found ${response.data.contactCount} contacts.`);
    } catch (err) {
      console.error('Error testing connection:', err);
      setError('Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="xero-auth loading">
        <div className="loading-spinner">Processing Xero connection...</div>
      </div>
    );
  }

  return (
    <div className="xero-auth">
      <h1>Xero Integration</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="connection-status">
        {connectionStatus === 'checking' && (
          <div className="status-checking">
            <p>Checking connection status...</p>
          </div>
        )}
        
        {connectionStatus === 'not_connected' && (
          <div className="status-not-connected">
            <h2>Not Connected to Xero</h2>
            <p>Connect your Xero account to enable invoice matching and data synchronization.</p>
            <button 
              onClick={initiateXeroConnection}
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              Connect to Xero
            </button>
          </div>
        )}
        
        {connectionStatus === 'connected' && organizationInfo && (
          <div className="status-connected">
            <h2>✅ Connected to Xero</h2>
            <div className="organization-info">
              <h3>Organization Details:</h3>
              <p><strong>Name:</strong> {organizationInfo.Name}</p>
              <p><strong>Legal Name:</strong> {organizationInfo.LegalName}</p>
              <p><strong>Country:</strong> {organizationInfo.CountryCode}</p>
              <p><strong>Currency:</strong> {organizationInfo.BaseCurrency}</p>
              {organizationInfo.Addresses && organizationInfo.Addresses.length > 0 && (
                <div>
                  <strong>Address:</strong>
                  <p>
                    {organizationInfo.Addresses[0].AddressLine1}<br/>
                    {organizationInfo.Addresses[0].City}, {organizationInfo.Addresses[0].Region} {organizationInfo.Addresses[0].PostalCode}
                  </p>
                </div>
              )}
            </div>
            
            <div className="connection-actions">
              <button 
                onClick={testConnection}
                className="btn btn-secondary"
                disabled={loading}
              >
                Test Connection
              </button>
              <button 
                onClick={disconnectXero}
                className="btn btn-danger"
                disabled={loading}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
        
        {connectionStatus === 'error' && (
          <div className="status-error">
            <h2>❌ Connection Error</h2>
            <p>There was an error checking your Xero connection.</p>
            <button 
              onClick={checkConnectionStatus}
              className="btn btn-secondary"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default XeroAuth;