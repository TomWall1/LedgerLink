/**
 * Xero Integration Component
 * 
 * Handles Xero API integration for LedgerLink
 */

import React, { useState } from 'react';
import './XeroIntegration.css';

const XeroIntegration = ({ onDataFetched }) => {
  const [connectionState, setConnectionState] = useState({
    isConnected: false,
    isConnecting: false,
    isFetching: false,
    error: null,
    successMessage: null
  });
  
  const [xeroConfig, setXeroConfig] = useState({
    organizationId: '',
    clientId: '',
    clientSecret: '',
    authMethod: 'oauth' // Currently only OAuth supported
  });
  
  const [fetchOptions, setFetchOptions] = useState({
    dataType: 'invoices', // 'invoices', 'bills', 'contacts', 'all'
    startDate: '',
    endDate: '',
    limit: 100
  });
  
  // Handle config changes
  const handleConfigChange = (field, value) => {
    setXeroConfig(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle fetch option changes
  const handleFetchOptionChange = (field, value) => {
    setFetchOptions(prev => ({ ...prev, [field]: value }));
  };
  
  // Test Xero connection
  const testConnection = async () => {
    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
      successMessage: null
    }));
    
    try {
      // Simulate Xero connection test
      // In a real implementation, this would call your backend Xero service
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // For demo purposes, we'll simulate a successful connection
      if (xeroConfig.organizationId && xeroConfig.clientId) {
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          successMessage: 'Successfully connected to Xero!'
        }));
      } else {
        throw new Error('Please fill in all required fields');
      }
      
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect to Xero'
      }));
    }
  };
  
  // Fetch data from Xero
  const fetchData = async () => {
    setConnectionState(prev => ({
      ...prev,
      isFetching: true,
      error: null,
      successMessage: null
    }));
    
    try {
      // Simulate Xero data fetch
      // In a real implementation, this would call your backend Xero service
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
      
      // Generate sample data based on selection
      const sampleData = generateSampleXeroData(fetchOptions.dataType, fetchOptions.limit);
      
      setConnectionState(prev => ({
        ...prev,
        isFetching: false,
        successMessage: `Successfully fetched ${sampleData.length} ${fetchOptions.dataType} from Xero!`
      }));
      
      // Pass data to parent component
      if (onDataFetched) {
        onDataFetched(sampleData, fetchOptions.dataType);
      }
      
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        isFetching: false,
        error: error.message || 'Failed to fetch data from Xero'
      }));
    }
  };
  
  // Generate sample Xero data for demo
  const generateSampleXeroData = (dataType, limit) => {
    const data = [];
    
    for (let i = 1; i <= Math.min(limit, 50); i++) {
      if (dataType === 'invoices' || dataType === 'all') {
        data.push({
          invoiceID: `xero-inv-${String(i).padStart(3, '0')}`,
          invoiceNumber: `INV-${String(i).padStart(4, '0')}`,
          type: 'ACCREC', // Accounts Receivable
          contact: `Customer ${i}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID'][Math.floor(Math.random() * 4)],
          lineAmountTypes: 'Exclusive',
          subTotal: Math.round((Math.random() * 5000 + 100) * 100) / 100,
          totalTax: Math.round((Math.random() * 500 + 10) * 100) / 100,
          total: Math.round((Math.random() * 5500 + 110) * 100) / 100,
          currencyCode: 'USD',
          source: 'xero-api',
          dataType: 'invoice'
        });
      }
      
      if (dataType === 'bills' || dataType === 'all') {
        data.push({
          invoiceID: `xero-bill-${String(i).padStart(3, '0')}`,
          invoiceNumber: `BILL-${String(i).padStart(4, '0')}`,
          type: 'ACCPAY', // Accounts Payable
          contact: `Supplier ${i}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['DRAFT', 'SUBMITTED', 'AUTHORISED', 'PAID'][Math.floor(Math.random() * 4)],
          lineAmountTypes: 'Exclusive',
          subTotal: Math.round((Math.random() * 3000 + 50) * 100) / 100,
          totalTax: Math.round((Math.random() * 300 + 5) * 100) / 100,
          total: Math.round((Math.random() * 3300 + 55) * 100) / 100,
          currencyCode: 'USD',
          source: 'xero-api',
          dataType: 'bill'
        });
      }
      
      if (dataType === 'contacts' || dataType === 'all') {
        data.push({
          contactID: `xero-contact-${String(i).padStart(3, '0')}`,
          name: `Contact ${i}`,
          contactStatus: 'ACTIVE',
          defaultCurrency: 'USD',
          emailAddress: `contact${i}@example.com`,
          phones: [{
            phoneType: 'DEFAULT',
            phoneNumber: `+1-555-000-${String(i).padStart(4, '0')}`
          }],
          addresses: [{
            addressType: 'STREET',
            city: 'New York',
            region: 'NY',
            postalCode: '10001',
            country: 'United States'
          }],
          source: 'xero-api',
          dataType: 'contact'
        });
      }
    }
    
    return data;
  };
  
  return (
    <div className="xero-integration">
      <div className="xero-header">
        <h3>🔗 Xero Integration</h3>
        <p>Connect directly to your Xero accounting system to automatically sync invoice and bill data.</p>
      </div>
      
      {/* Connection Status */}
      <div className={`connection-status ${connectionState.isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <span className={`status-dot ${connectionState.isConnected ? 'green' : 'red'}`}></span>
          <span className="status-text">
            {connectionState.isConnected ? 'Connected to Xero' : 'Not Connected'}
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
      
      {/* Xero Configuration */}
      <div className="xero-config">
        <h4>Xero Configuration</h4>
        
        <div className="config-notice">
          <div className="notice-icon">📝</div>
          <div className="notice-content">
            <strong>Note:</strong> This is a demo implementation. In a production environment, 
            you would need to register your application with Xero and implement proper OAuth 2.0 authentication.
          </div>
        </div>
        
        <div className="form-group">
          <label>Organization ID:</label>
          <input
            type="text"
            placeholder="Your Xero Organization ID"
            value={xeroConfig.organizationId}
            onChange={(e) => handleConfigChange('organizationId', e.target.value)}
            className="form-input"
          />
          <small>Found in Xero Settings → General Settings → Organization</small>
        </div>
        
        <div className="form-group">
          <label>Client ID:</label>
          <input
            type="text"
            placeholder="Your Xero App Client ID"
            value={xeroConfig.clientId}
            onChange={(e) => handleConfigChange('clientId', e.target.value)}
            className="form-input"
          />
          <small>From your Xero Developer App configuration</small>
        </div>
        
        <div className="form-group">
          <label>Client Secret:</label>
          <input
            type="password"
            placeholder="Your Xero App Client Secret"
            value={xeroConfig.clientSecret}
            onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
            className="form-input"
          />
          <small>Keep this secure - never share your client secret</small>
        </div>
        
        <button
          onClick={testConnection}
          disabled={connectionState.isConnecting || !xeroConfig.organizationId}
          className="btn btn-primary test-connection-btn"
        >
          {connectionState.isConnecting ? (
            <>🔄 Testing Connection...</>
          ) : (
            <>🔍 Test Connection</>
          )}
        </button>
      </div>
      
      {/* Data Fetching */}
      {connectionState.isConnected && (
        <div className="data-fetching">
          <h4>Fetch Data from Xero</h4>
          
          <div className="form-group">
            <label>Data Type:</label>
            <select
              value={fetchOptions.dataType}
              onChange={(e) => handleFetchOptionChange('dataType', e.target.value)}
              className="form-select"
            >
              <option value="invoices">Invoices (AR)</option>
              <option value="bills">Bills (AP)</option>
              <option value="contacts">Contacts</option>
              <option value="all">All Data</option>
            </select>
          </div>
          
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
          
          <div className="form-group">
            <label>Limit:</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={fetchOptions.limit}
              onChange={(e) => handleFetchOptionChange('limit', parseInt(e.target.value))}
              className="form-input"
            />
            <small>Maximum number of records to fetch</small>
          </div>
          
          <button
            onClick={fetchData}
            disabled={connectionState.isFetching}
            className="btn btn-success fetch-data-btn"
          >
            {connectionState.isFetching ? (
              <>🔄 Fetching Data...</>
            ) : (
              <>📊 Fetch Data from Xero</>
            )}
          </button>
        </div>
      )}
      
      {/* Xero Setup Guide */}
      <div className="setup-guide">
        <h4>📚 Xero Setup Guide</h4>
        <div className="guide-steps">
          <div className="guide-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Create Xero Developer Account</strong>
              <p>Sign up at <a href="https://developer.xero.com" target="_blank" rel="noopener noreferrer">developer.xero.com</a></p>
            </div>
          </div>
          <div className="guide-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>Create New App</strong>
              <p>Create a new application in your Xero Developer dashboard</p>
            </div>
          </div>
          <div className="guide-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>Configure OAuth 2.0</strong>
              <p>Set up OAuth 2.0 scopes: accounting.transactions.read, accounting.contacts.read</p>
            </div>
          </div>
          <div className="guide-step">
            <span className="step-number">4</span>
            <div className="step-content">
              <strong>Get Credentials</strong>
              <p>Copy your Client ID and Client Secret from the app configuration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroIntegration;