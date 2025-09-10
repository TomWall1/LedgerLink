/**
 * Xero Integration Component
 * 
 * Handles connection to Xero accounting system and data fetching.
 * This restores the original Xero integration functionality.
 */

import React, { useState, useEffect } from 'react';
import './XeroIntegration.css';

const XeroIntegration = ({ onDataFetched }) => {
  const [xeroState, setXeroState] = useState({
    isConnected: false,
    isConnecting: false,
    isFetching: false,
    accessToken: null,
    tenantId: null,
    error: null,
    successMessage: null
  });

  const [fetchOptions, setFetchOptions] = useState({
    dataType: 'invoices', // 'invoices', 'contacts', 'accounts', 'all'
    startDate: '',
    endDate: '',
    status: 'all'
  });

  // Check for existing Xero connection on component mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Check if there's an existing Xero connection
  const checkExistingConnection = async () => {
    try {
      const response = await fetch('/api/xero/connection-status');
      const result = await response.json();
      
      if (result.success && result.isConnected) {
        setXeroState(prev => ({
          ...prev,
          isConnected: true,
          accessToken: result.accessToken,
          tenantId: result.tenantId,
          successMessage: 'Connected to Xero'
        }));
      }
    } catch (error) {
      console.log('No existing Xero connection found');
    }
  };

  // Initiate Xero OAuth connection
  const connectToXero = async () => {
    setXeroState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null, 
      successMessage: null 
    }));

    try {
      // Get OAuth authorization URL
      const response = await fetch('/api/xero/auth-url');
      const result = await response.json();

      if (result.success) {
        // Redirect to Xero OAuth
        window.location.href = result.authUrl;
      } else {
        setXeroState(prev => ({
          ...prev,
          isConnecting: false,
          error: result.message || 'Failed to initiate Xero connection'
        }));
      }
    } catch (error) {
      console.error('Xero connection error:', error);
      setXeroState(prev => ({
        ...prev,
        isConnecting: false,
        error: `Connection error: ${error.message}`
      }));
    }
  };

  // Test Xero connection
  const testConnection = async () => {
    setXeroState(prev => ({ 
      ...prev, 
      isFetching: true, 
      error: null, 
      successMessage: null 
    }));

    try {
      const response = await fetch('/api/xero/test-connection');
      const result = await response.json();

      if (result.success) {
        setXeroState(prev => ({
          ...prev,
          successMessage: 'Xero connection test successful!'
        }));
      } else {
        setXeroState(prev => ({
          ...prev,
          error: result.message || 'Connection test failed'
        }));
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setXeroState(prev => ({
        ...prev,
        error: `Test failed: ${error.message}`
      }));
    } finally {
      setXeroState(prev => ({ ...prev, isFetching: false }));
    }
  };

  // Fetch data from Xero
  const fetchData = async () => {
    if (!xeroState.isConnected) {
      setXeroState(prev => ({
        ...prev,
        error: 'Please connect to Xero first'
      }));
      return;
    }

    setXeroState(prev => ({ 
      ...prev, 
      isFetching: true, 
      error: null, 
      successMessage: null 
    }));

    try {
      let endpoint = '';
      const params = new URLSearchParams();
      
      // Add filters
      if (fetchOptions.startDate) params.append('startDate', fetchOptions.startDate);
      if (fetchOptions.endDate) params.append('endDate', fetchOptions.endDate);
      if (fetchOptions.status !== 'all') params.append('status', fetchOptions.status);

      // Determine endpoint
      switch (fetchOptions.dataType) {
        case 'invoices':
          endpoint = '/api/xero/invoices';
          break;
        case 'contacts':
          endpoint = '/api/xero/contacts';
          break;
        case 'accounts':
          endpoint = '/api/xero/accounts';
          break;
        case 'all':
          endpoint = '/api/xero/all-data';
          break;
        default:
          endpoint = '/api/xero/invoices';
      }

      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setXeroState(prev => ({
          ...prev,
          successMessage: `Successfully fetched ${result.data.length} records from Xero!`
        }));
        
        if (onDataFetched) {
          onDataFetched(result.data);
        }
      } else {
        setXeroState(prev => ({
          ...prev,
          error: result.message || 'Failed to fetch data from Xero'
        }));
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      setXeroState(prev => ({
        ...prev,
        error: `Fetch error: ${error.message}`
      }));
    } finally {
      setXeroState(prev => ({ ...prev, isFetching: false }));
    }
  };

  // Disconnect from Xero
  const disconnectXero = async () => {
    try {
      await fetch('/api/xero/disconnect', { method: 'POST' });
      
      setXeroState({
        isConnected: false,
        isConnecting: false,
        isFetching: false,
        accessToken: null,
        tenantId: null,
        error: null,
        successMessage: 'Disconnected from Xero'
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <div className="xero-integration">
      <div className="xero-header">
        <h3>🔗 Xero Integration</h3>
        <p>Connect to your Xero accounting system to automatically fetch financial data.</p>
      </div>

      {/* Connection Status */}
      <div className={`connection-status ${xeroState.isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <span className={`status-dot ${xeroState.isConnected ? 'green' : 'red'}`}></span>
          <span className="status-text">
            {xeroState.isConnected ? 'Connected to Xero' : 'Not Connected'}
          </span>
        </div>
        {xeroState.isConnected && (
          <button onClick={disconnectXero} className="btn btn-outline btn-sm">
            Disconnect
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {xeroState.error && (
        <div className="message error-message">
          ❌ {xeroState.error}
        </div>
      )}
      
      {xeroState.successMessage && (
        <div className="message success-message">
          ✅ {xeroState.successMessage}
        </div>
      )}

      {/* Connection Section */}
      {!xeroState.isConnected && (
        <div className="connection-section">
          <h4>Connect to Xero</h4>
          <p>You'll be redirected to Xero to authorize LedgerLink to access your accounting data.</p>
          
          <div className="connection-info">
            <h5>🔒 What we'll access:</h5>
            <ul>
              <li>Invoices and bills</li>
              <li>Contact information</li>
              <li>Chart of accounts</li>
              <li>Basic organization details</li>
            </ul>
            <p><strong>Note:</strong> LedgerLink will only read your data, never modify it.</p>
          </div>

          <button
            onClick={connectToXero}
            disabled={xeroState.isConnecting}
            className="btn btn-primary connect-btn"
          >
            {xeroState.isConnecting ? (
              <>🔄 Connecting to Xero...</>
            ) : (
              <>🔗 Connect to Xero</>
            )}
          </button>
        </div>
      )}

      {/* Data Fetching Section */}
      {xeroState.isConnected && (
        <div className="data-fetching-section">
          <h4>Fetch Data from Xero</h4>
          
          {/* Test Connection */}
          <div className="test-section">
            <button
              onClick={testConnection}
              disabled={xeroState.isFetching}
              className="btn btn-outline"
            >
              {xeroState.isFetching ? 'Testing...' : '🔍 Test Connection'}
            </button>
          </div>

          {/* Data Type Selection */}
          <div className="form-group">
            <label>What data to fetch:</label>
            <select
              value={fetchOptions.dataType}
              onChange={(e) => setFetchOptions(prev => ({ ...prev, dataType: e.target.value }))}
              className="form-select"
            >
              <option value="invoices">Invoices</option>
              <option value="contacts">Contacts</option>
              <option value="accounts">Chart of Accounts</option>
              <option value="all">All Data</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label>From Date:</label>
              <input
                type="date"
                value={fetchOptions.startDate}
                onChange={(e) => setFetchOptions(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>To Date:</label>
              <input
                type="date"
                value={fetchOptions.endDate}
                onChange={(e) => setFetchOptions(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="form-group">
            <label>Status Filter:</label>
            <select
              value={fetchOptions.status}
              onChange={(e) => setFetchOptions(prev => ({ ...prev, status: e.target.value }))}
              className="form-select"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="authorised">Authorised</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Fetch Data Button */}
          <button
            onClick={fetchData}
            disabled={xeroState.isFetching}
            className="btn btn-success fetch-data-btn"
          >
            {xeroState.isFetching ? (
              <>🔄 Fetching Data...</>
            ) : (
              <>📊 Fetch Data from Xero</>
            )}
          </button>
        </div>
      )}

      {/* OAuth Callback Instructions */}
      <div className="oauth-instructions">
        <h4>📝 OAuth Setup Instructions</h4>
        <p>If this is your first time connecting, make sure your backend is configured with:</p>
        <ul>
          <li>Xero OAuth app credentials</li>
          <li>Proper redirect URLs</li>
          <li>Required scopes</li>
        </ul>
        <p>Check your backend environment variables for XERO_CLIENT_ID and XERO_CLIENT_SECRET.</p>
      </div>
    </div>
  );
};

export default XeroIntegration;