/**
 * Coupa Connection Component
 * 
 * This component provides the user interface for connecting to Coupa.
 * Users can enter their credentials and test the connection.
 */

import React, { useState, useEffect } from 'react';
import './CoupaConnection.css';

const CoupaConnection = ({ onConnectionSuccess, onDataFetched }) => {
  // State for managing the connection process
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    isTesting: false,
    isFetching: false,
    error: null,
    successMessage: null
  });

  // State for Coupa credentials
  const [credentials, setCredentials] = useState({
    baseURL: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    authMethod: 'api-key' // 'api-key' or 'oauth'
  });

  // State for data fetching options
  const [fetchOptions, setFetchOptions] = useState({
    dataType: 'invoices', // 'invoices', 'approvals', 'suppliers', 'all'
    startDate: '',
    endDate: '',
    limit: 100
  });

  // Load saved credentials from localStorage when component mounts
  useEffect(() => {
    const savedCredentials = localStorage.getItem('coupaCredentials');
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setCredentials(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, []);

  // Handle input changes for credentials
  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle input changes for fetch options
  const handleFetchOptionChange = (field, value) => {
    setFetchOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save credentials to localStorage (without sensitive data)
  const saveCredentials = () => {
    const credentialsToSave = {
      baseURL: credentials.baseURL,
      authMethod: credentials.authMethod
      // Don't save API keys or secrets for security
    };
    localStorage.setItem('coupaCredentials', JSON.stringify(credentialsToSave));
  };

  // Test connection to Coupa
  const testConnection = async () => {
    setConnectionState(prev => ({ 
      ...prev, 
      isTesting: true, 
      error: null, 
      successMessage: null 
    }));

    try {
      // Set environment variables for the backend (this would normally be done server-side)
      const testData = {
        baseURL: credentials.baseURL,
        apiKey: credentials.authMethod === 'api-key' ? credentials.apiKey : undefined,
        clientId: credentials.authMethod === 'oauth' ? credentials.clientId : undefined,
        clientSecret: credentials.authMethod === 'oauth' ? credentials.clientSecret : undefined
      };

      const response = await fetch('/api/coupa/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();

      if (result.success) {
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          successMessage: 'Successfully connected to Coupa!'
        }));
        
        saveCredentials();
        
        if (onConnectionSuccess) {
          onConnectionSuccess(result);
        }
      } else {
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          error: result.message || 'Connection failed'
        }));
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        error: `Connection error: ${error.message}`
      }));
    } finally {
      setConnectionState(prev => ({ ...prev, isTesting: false }));
    }
  };

  // Fetch data from Coupa
  const fetchData = async () => {
    if (!connectionState.isConnected) {
      setConnectionState(prev => ({
        ...prev,
        error: 'Please test connection first'
      }));
      return;
    }

    setConnectionState(prev => ({ 
      ...prev, 
      isFetching: true, 
      error: null, 
      successMessage: null 
    }));

    try {
      let endpoint = '';
      let requestData = {
        startDate: fetchOptions.startDate || undefined,
        endDate: fetchOptions.endDate || undefined,
        limit: fetchOptions.limit
      };

      // Determine which endpoint to call
      switch (fetchOptions.dataType) {
        case 'invoices':
          endpoint = '/api/coupa/fetch-invoices';
          break;
        case 'approvals':
          endpoint = '/api/coupa/fetch-approvals';
          break;
        case 'suppliers':
          endpoint = '/api/coupa/suppliers';
          break;
        case 'all':
          endpoint = '/api/coupa/sync-all';
          break;
        default:
          endpoint = '/api/coupa/fetch-invoices';
      }

      const response = await fetch(endpoint, {
        method: fetchOptions.dataType === 'suppliers' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: fetchOptions.dataType === 'suppliers' ? undefined : JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        setConnectionState(prev => ({
          ...prev,
          successMessage: `Successfully fetched ${result.totalRecords || 'data'} records from Coupa!`
        }));
        
        if (onDataFetched) {
          onDataFetched(result.data, fetchOptions.dataType);
        }
      } else {
        setConnectionState(prev => ({
          ...prev,
          error: result.message || 'Failed to fetch data'
        }));
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      setConnectionState(prev => ({
        ...prev,
        error: `Fetch error: ${error.message}`
      }));
    } finally {
      setConnectionState(prev => ({ ...prev, isFetching: false }));
    }
  };

  return (
    <div className="coupa-connection">
      <div className="coupa-header">
        <h3>🔗 Connect to Coupa</h3>
        <p>Connect directly to your Coupa instance to automatically fetch invoice and approval data.</p>
      </div>

      {/* Connection Status */}
      <div className={`connection-status ${connectionState.isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <span className={`status-dot ${connectionState.isConnected ? 'green' : 'red'}`}></span>
          <span className="status-text">
            {connectionState.isConnected ? 'Connected to Coupa' : 'Not Connected'}
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {connectionState.error && (
        <div className="message error-message">
          ❌ {connectionState.error}
        </div>
      )}
      
      {connectionState.successMessage && (
        <div className="message success-message">
          ✅ {connectionState.successMessage}
        </div>
      )}

      {/* Credentials Section */}
      <div className="credentials-section">
        <h4>Coupa Credentials</h4>
        
        {/* Base URL */}
        <div className="form-group">
          <label>Coupa Instance URL:</label>
          <input
            type="url"
            placeholder="https://your-company.coupahost.com"
            value={credentials.baseURL}
            onChange={(e) => handleCredentialChange('baseURL', e.target.value)}
            className="form-input"
          />
          <small>Your Coupa instance URL (e.g., https://acme.coupahost.com)</small>
        </div>

        {/* Authentication Method */}
        <div className="form-group">
          <label>Authentication Method:</label>
          <select
            value={credentials.authMethod}
            onChange={(e) => handleCredentialChange('authMethod', e.target.value)}
            className="form-select"
          >
            <option value="api-key">API Key (Simpler)</option>
            <option value="oauth">OAuth 2.0 (More Secure)</option>
          </select>
        </div>

        {/* API Key Method */}
        {credentials.authMethod === 'api-key' && (
          <div className="form-group">
            <label>API Key:</label>
            <input
              type="password"
              placeholder="Your Coupa API Key"
              value={credentials.apiKey}
              onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              className="form-input"
            />
            <small>Get this from your Coupa administrator</small>
          </div>
        )}

        {/* OAuth Method */}
        {credentials.authMethod === 'oauth' && (
          <>
            <div className="form-group">
              <label>Client ID:</label>
              <input
                type="text"
                placeholder="Your OAuth Client ID"
                value={credentials.clientId}
                onChange={(e) => handleCredentialChange('clientId', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Client Secret:</label>
              <input
                type="password"
                placeholder="Your OAuth Client Secret"
                value={credentials.clientSecret}
                onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}

        {/* Test Connection Button */}
        <button
          onClick={testConnection}
          disabled={connectionState.isTesting || !credentials.baseURL}
          className="btn btn-primary test-connection-btn"
        >
          {connectionState.isTesting ? (
            <>🔄 Testing Connection...</>
          ) : (
            <>🔍 Test Connection</>
          )}
        </button>
      </div>

      {/* Data Fetching Section */}
      {connectionState.isConnected && (
        <div className="data-fetching-section">
          <h4>Fetch Data from Coupa</h4>
          
          {/* Data Type Selection */}
          <div className="form-group">
            <label>What data to fetch:</label>
            <select
              value={fetchOptions.dataType}
              onChange={(e) => handleFetchOptionChange('dataType', e.target.value)}
              className="form-select"
            >
              <option value="invoices">Invoices</option>
              <option value="approvals">Invoice Approvals</option>
              <option value="suppliers">Suppliers</option>
              <option value="all">All Data</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={fetchOptions.startDate}
                onChange={(e) => handleFetchOptionChange('startDate', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={fetchOptions.endDate}
                onChange={(e) => handleFetchOptionChange('endDate', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Limit */}
          <div className="form-group">
            <label>Number of records to fetch:</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={fetchOptions.limit}
              onChange={(e) => handleFetchOptionChange('limit', parseInt(e.target.value))}
              className="form-input"
            />
            <small>Maximum 1000 records per request</small>
          </div>

          {/* Fetch Data Button */}
          <button
            onClick={fetchData}
            disabled={connectionState.isFetching}
            className="btn btn-success fetch-data-btn"
          >
            {connectionState.isFetching ? (
              <>🔄 Fetching Data...</>
            ) : (
              <>📊 Fetch Data from Coupa</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CoupaConnection;