import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XeroConnection = ({ onDataReceived, onError, company1Data, setCompany1Data }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('invoices');
  
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Check if already authenticated with Xero
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${apiUrl}/auth/xero/status`);
        if (response.data.authenticated) {
          setIsConnected(true);
          setTenants(response.data.tenants || []);
          if (response.data.tenants && response.data.tenants.length > 0) {
            setTenantId(response.data.tenants[0].tenantId);
          }
        }
      } catch (error) {
        console.error('Error checking Xero authentication status:', error);
      }
    };

    checkAuth();
  }, [apiUrl]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/auth/xero/auth-url`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error getting Xero auth URL:', error);
      onError('Failed to connect to Xero: ' + (error.response?.data?.error || error.message));
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await axios.get(`${apiUrl}/auth/xero/disconnect`);
      setIsConnected(false);
      setTenants([]);
      setTenantId('');
      setCompany1Data(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      onError('Failed to disconnect from Xero: ' + (error.response?.data?.error || error.message));
      setIsLoading(false);
    }
  };

  const fetchXeroData = async () => {
    if (!tenantId) {
      onError('Please select an organization first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/auth/xero/${selectedCategory}?tenantId=${tenantId}`);
      
      let formattedData = [];
      
      if (selectedCategory === 'invoices') {
        // Format invoice data to match our expected format
        formattedData = response.data.invoices.map(invoice => ({
          transaction_number: invoice.invoiceNumber,
          transaction_type: invoice.type,
          amount: invoice.total,
          issue_date: invoice.date,
          due_date: invoice.dueDate,
          status: invoice.status,
          reference: invoice.reference || '',
          linked_account_id: invoice.contact?.contactID || null
        }));
      } else if (selectedCategory === 'contacts') {
        // Format contacts data
        formattedData = response.data.contacts;
      }
      
      setCompany1Data(formattedData);
      onDataReceived(formattedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data from Xero:', error);
      onError('Failed to fetch data from Xero: ' + (error.response?.data?.error || error.message));
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Xero Connection</h2>
      
      {isLoading ? (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : isConnected ? (
        <div>
          <div className="mb-4 flex items-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Connected to Xero</span>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Organization
            </label>
            <select
              className="w-full p-2 border rounded"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">Select an organization</option>
              {tenants.map((tenant) => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.tenantName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Data Type
            </label>
            <div className="flex">
              <button
                className={`px-4 py-2 rounded-l ${selectedCategory === 'invoices' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setSelectedCategory('invoices')}
              >
                Invoices
              </button>
              <button
                className={`px-4 py-2 rounded-r ${selectedCategory === 'contacts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setSelectedCategory('contacts')}
              >
                Contacts
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchXeroData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!tenantId}
            >
              Fetch {selectedCategory === 'invoices' ? 'Invoices' : 'Contacts'}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Disconnect
            </button>
          </div>
          
          {company1Data && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">
                  {company1Data.length} records loaded from Xero
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">
            Connect to your Xero account to import AR ledger data directly.
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect to Xero
          </button>
        </div>
      )}
    </div>
  );
};

export default XeroConnection;