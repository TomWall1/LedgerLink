import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import DateFormatSelect from './DateFormatSelect';

const CustomerTransactionMatcher = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  
  // Connection states
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  
  // Customer states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Invoice states
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  
  // Matching states
  const [findingMatches, setFindingMatches] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  const [matches, setMatches] = useState([]);
  const [approvingMatches, setApprovingMatches] = useState({});
  
  const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
  
  // Load connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);
  
  // Fetch available Xero connections
  const fetchConnections = async () => {
    try {
      setConnectionsLoading(true);
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/xero/connections`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to access Xero connections.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched connections:', data);
      
      const connectionsList = data.data || [];
      setConnections(connectionsList);
      
      // Auto-select if only one connection
      if (connectionsList.length === 1) {
        setSelectedConnection(connectionsList[0]);
      }
      
      if (connectionsList.length === 0) {
        setError('No Xero connections found. Please connect to Xero first from the Connections page.');
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to fetch Xero connections. Please ensure you are connected.');
    } finally {
      setConnectionsLoading(false);
      setLoading(false);
    }
  };
  
  // Fetch Xero customers for selected connection
  const fetchCustomers = async () => {
    if (!selectedConnection) {
      setError('Please select a Xero connection first.');
      return;
    }
    
    try {
      setCustomersLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      console.log('📞 Fetching customers from Xero for AR...');
      console.log('   Using endpoint: xero/customers');
      console.log('   Connection ID:', selectedConnection._id);
      
      const response = await fetch(`${apiUrl}/api/xero/customers?connectionId=${selectedConnection._id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Not connected to Xero. Please connect your Xero account first.');
          return;
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Connection ID is required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched customers response:', data);
      
      // Handle different response formats
      const customersList = data.data?.customers || data.customers || [];
      
      // Transform the data to match our expected format
      const formattedCustomers = customersList.map(customer => ({
        id: customer.ContactID || customer.contactID,
        name: customer.Name || customer.name,
        email: customer.EmailAddress || customer.emailAddress || 'No email'
      }));
      
      setCustomers(formattedCustomers);
      
      if (formattedCustomers.length === 0) {
        setError('No customers found for this connection.');
      }
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
      console.error('   Error message:', err.message);
      setError(`Failed to fetch customers: ${err.message}`);
    } finally {
      setCustomersLoading(false);
    }
  };
  
  // Handle connection selection
  const handleConnectionSelect = (connection) => {
    setSelectedConnection(connection);
    setCustomers([]);
    setSelectedCustomer(null);
    setCustomerInvoices([]);
    setMatches([]);
    setError(null);
    setSuccess('');
  };
  
  // Handle customer selection
  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerInvoices([]);
    setMatches([]);
    setError(null);
    setSuccess('');
    
    // Fetch customer invoices
    try {
      setCustomerDataLoading(true);
      
      const token = localStorage.getItem('authToken');
      
      // Use the invoices endpoint with customer filter
      const response = await fetch(`${apiUrl}/api/xero/invoices?connectionId=${selectedConnection._id}&contactId=${customer.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched invoices for customer:', data);
      
      // Handle different response formats
      const invoicesList = data.data?.invoices || data.invoices || [];
      
      // Transform the data to match our expected format
      const formattedInvoices = invoicesList.map(invoice => ({
        id: invoice.InvoiceID || invoice.invoiceID,
        type: invoice.Type || invoice.type,
        amount: parseFloat(invoice.Total || invoice.total || 0),
        issueDate: invoice.Date || invoice.date || invoice.dateString,
        dueDate: invoice.DueDate || invoice.dueDate || invoice.dueDateString,
        status: invoice.Status || invoice.status,
        reference: invoice.Reference || invoice.reference || invoice.InvoiceNumber || invoice.invoiceNumber,
        customer: customer.name
      }));
      
      setCustomerInvoices(formattedInvoices);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
      // Don't set main error, just log it
      setCustomerInvoices([]);
    } finally {
      setCustomerDataLoading(false);
    }
  };
  
  // Handle finding matches
  const handleFindMatches = async () => {
    if (!uploadedFile || !selectedCustomer) {
      setError('Please select a customer and upload a CSV file.');
      return;
    }
    
    try {
      setFindingMatches(true);
      setError(null);
      setMatches([]);
      
      console.log('Selected file in FileUpload:', uploadedFile);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('customerId', selectedCustomer.id);
      formData.append('dateFormat', dateFormat);
      formData.append('useHistoricalData', useHistoricalData);
      
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/api/transactions/match-customer-invoices`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }
      
      const matchResults = await response.json();
      console.log('Match results:', matchResults);
      
      if (matchResults.matches && matchResults.matches.length > 0) {
        setMatches(matchResults.matches);
        setSuccess(`Found ${matchResults.matches.length} potential matches`);
      } else {
        setError('No matches found. Please check your CSV format and try again.');
      }
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err.message || 'Failed to find potential matches');
    } finally {
      setFindingMatches(false);
    }
  };
  
  // Handle match approval
  const handleApproveMatch = async (matchId) => {
    try {
      setApprovingMatches(prev => ({ ...prev, [matchId]: true }));
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/transactions/approve-customer-match`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ matchId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve match');
      }
      
      // Remove approved match from list
      setMatches(prev => prev.filter(match => match.id !== matchId));
      setSuccess('Match approved successfully!');
    } catch (err) {
      console.error('Error approving match:', err);
      setError('Failed to approve match');
    } finally {
      setApprovingMatches(prev => ({ ...prev, [matchId]: false }));
    }
  };
  
  // Handle match rejection
  const handleRejectMatch = (matchId) => {
    setMatches(prev => prev.filter(match => match.id !== matchId));
    setSuccess('Match rejected.');
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU');
  };
  
  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading connections...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B365D]">Customer Invoice Matching</h1>
            <p className="text-gray-600 mt-2">Match CSV transactions with Xero customer invoices</p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">Error:</span>
              <span className="text-red-600 ml-1">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">Success:</span>
              <span className="text-green-600 ml-1">{success}</span>
            </div>
          </div>
        )}
        
        {/* Four Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel 0: Connection Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">1. Select ERP</h2>
            
            {connectionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading connections...</p>
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No connections found</p>
                <button
                  onClick={() => navigate('/connections')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Go to Connections
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection._id}
                    onClick={() => handleConnectionSelect(connection)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedConnection?._id === connection._id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium text-[#1B365D]">{connection.tenantName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{connection.provider.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            )}
            
            {selectedConnection && (
              <div className="mt-4">
                <button
                  onClick={fetchCustomers}
                  disabled={customersLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {customersLoading ? 'Loading...' : 'Load Customers'}
                </button>
              </div>
            )}
          </div>
          
          {/* Panel 1: Customer Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">2. Select Customer</h2>
            
            {!selectedConnection ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Please select a connection first</p>
              </div>
            ) : customersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No customers found</p>
                <button
                  onClick={fetchCustomers}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium text-[#1B365D]">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                ))}
              </div>
            )}
            
            {selectedCustomer && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-[#1B365D] mb-2">Customer Invoices</h4>
                {customerDataLoading ? (
                  <p className="text-sm text-gray-600">Loading invoices...</p>
                ) : customerInvoices.length > 0 ? (
                  <div className="space-y-2">
                    {customerInvoices.slice(0, 5).map((invoice, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                        <span className="text-gray-600 ml-2">#{invoice.reference}</span>
                      </div>
                    ))}
                    {customerInvoices.length > 5 && (
                      <p className="text-sm text-gray-500">...and {customerInvoices.length - 5} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No invoices found</p>
                )}
              </div>
            )}
          </div>
          
          {/* Panel 2: File Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">3. Upload CSV</h2>
            
            <div className="space-y-4">
              <FileUpload
                onFileSelect={(file) => setUploadedFile(file)}
                selectedFile={uploadedFile}
              />
              
              <DateFormatSelect
                value={dateFormat}
                onChange={setDateFormat}
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="historicalData"
                  checked={useHistoricalData}
                  onChange={(e) => setUseHistoricalData(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="historicalData" className="ml-2 block text-sm text-gray-700">
                  Include historical data
                </label>
              </div>
              
              <button
                onClick={handleFindMatches}
                disabled={!uploadedFile || !selectedCustomer || findingMatches}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg font-medium ${
                  !uploadedFile || !selectedCustomer || findingMatches
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#00A4B4] hover:bg-[#008999] text-white'
                }`}
              >
                {findingMatches ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finding Matches...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Find Matches
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Panel 3: Match Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#1B365D] mb-4">4. Review Matches</h2>
            
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">Upload a CSV file and select a customer to find potential matches.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {matches.map((match, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-[#1B365D]">Invoice #{match.invoice.reference}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
                            {Math.round(match.confidence)}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Amount: {formatCurrency(match.invoice.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(match.invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">CSV Transaction:</h5>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(match.transaction.amount)} - {match.transaction.reference || 'No reference'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(match.transaction.date)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleApproveMatch(match.id)}
                        disabled={approvingMatches[match.id]}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
                      >
                        {approvingMatches[match.id] ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectMatch(match.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionMatcher;