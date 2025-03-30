import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useXero } from '../context/XeroContext';
import { navigateTo } from '../utils/customRouter';

const CustomerTransactionMatcher = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  const [matchSource, setMatchSource] = useState('csv'); // 'csv' or 'erp'
  const [potentialMatches, setPotentialMatches] = useState({});
  const [findingMatches, setFindingMatches] = useState(false);
  const [processingMatch, setProcessingMatch] = useState(false);
  
  const { isAuthenticated, checkAuth } = useXero();
  
  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  // Fetch Xero customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check Xero authentication
      try {
        const authenticated = await checkAuth();
        if (!authenticated) {
          setError('Not connected to Xero. Please connect your Xero account first.');
          setLoading(false);
          return;
        }
      } catch (authError) {
        console.error('Error checking authentication:', authError);
        setError('Failed to verify Xero connection. Please try reconnecting.');
        setLoading(false);
        return;
      }
      
      // Fetch customers from Xero
      const response = await api.get('/api/xero/customers');
      
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch invoices for a specific customer
  const fetchCustomerInvoices = async (customerId) => {
    if (!customerId) return;
    
    try {
      setCustomerDataLoading(true);
      setCustomerInvoices([]);
      setPotentialMatches({});
      
      const response = await api.get(`/api/xero/customers/${customerId}/invoices?includeHistory=false`);
      
      // Only show outstanding/unpaid invoices
      const outstandingInvoices = response.data.invoices?.filter(invoice => 
        invoice.Status === 'AUTHORISED' || invoice.Status === 'SENT'
      ) || [];
      
      setCustomerInvoices(outstandingInvoices);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
      // Don't set the main error state, just clear the invoices
      setCustomerInvoices([]);
    } finally {
      setCustomerDataLoading(false);
    }
  };
  
  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerInvoices(customer.ContactID);
  };
  
  // Find potential matches for selected customer's invoices
  const findMatches = async () => {
    if (!selectedCustomer || customerInvoices.length === 0) return;
    
    try {
      setFindingMatches(true);
      setPotentialMatches({});
      
      const response = await api.post('/api/transactions/match-customer-invoices', {
        customerId: selectedCustomer.ContactID,
        invoices: customerInvoices,
        matchSource: matchSource
      });
      
      // Transform the data for easier access
      const matchesObj = {};
      response.data.data.forEach(item => {
        matchesObj[item.invoice.InvoiceID] = item.matches;
      });
      
      setPotentialMatches(matchesObj);
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err.response?.data?.error || 'Failed to find potential matches');
    } finally {
      setFindingMatches(false);
    }
  };
  
  // Approve a match
  const approveMatch = async (invoiceId, transactionId) => {
    try {
      setProcessingMatch(true);
      
      await api.post('/api/transactions/approve-customer-match', {
        invoiceId,
        transactionId
      });
      
      // Remove from potential matches
      const updatedMatches = { ...potentialMatches };
      delete updatedMatches[invoiceId];
      setPotentialMatches(updatedMatches);
    } catch (err) {
      console.error('Error approving match:', err);
      setError('Failed to approve match. Please try again.');
    } finally {
      setProcessingMatch(false);
    }
  };
  
  // Reject a match
  const rejectMatch = (invoiceId, transactionId) => {
    // Just filter it out from the UI - no server action needed
    const updatedMatches = { ...potentialMatches };
    if (updatedMatches[invoiceId]) {
      updatedMatches[invoiceId] = updatedMatches[invoiceId].filter(match => match.id !== transactionId);
      if (updatedMatches[invoiceId].length === 0) {
        delete updatedMatches[invoiceId];
      }
      setPotentialMatches(updatedMatches);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Handle back to dashboard 
  const handleBackToDashboard = () => {
    navigateTo('dashboard');
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium">Loading customer data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <div className="mt-3">
            <button
              onClick={fetchCustomers}
              className="inline-flex items-center px-3 py-1 mr-3 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
            >
              Retry
            </button>
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Not Connected</p>
          <p>You need to connect to Xero before you can match customer invoices.</p>
          <div className="mt-3">
            <button
              onClick={() => navigateTo('erp-connections')}
              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm"
            >
              Connect to Xero
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (customers.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">No Customers Found</h2>
          <p>No customers were found in your Xero account.</p>
          <div className="mt-4">
            <button
              onClick={fetchCustomers}
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Invoice Matching</h1>
        <button
          onClick={handleBackToDashboard}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Customers list */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Select a Customer</h2>
          <div className="overflow-y-auto max-h-[70vh]">
            {customers.map(customer => (
              <div 
                key={customer.ContactID} 
                className={`p-3 mb-2 rounded cursor-pointer ${selectedCustomer?.ContactID === customer.ContactID ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div className="font-medium">{customer.Name}</div>
                <div className="text-sm text-gray-600 truncate">{customer.EmailAddress || 'No email'}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right panel - Customer details, invoices and matching options */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          {selectedCustomer ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><span className="font-medium">Name:</span> {selectedCustomer.Name}</p>
                <p><span className="font-medium">Email:</span> {selectedCustomer.EmailAddress || 'N/A'}</p>
                <p>
                  <span className="font-medium">Phone:</span> 
                  {selectedCustomer.Phones && selectedCustomer.Phones.length > 0 
                    ? selectedCustomer.Phones[0].PhoneNumber 
                    : 'N/A'}
                </p>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Outstanding Invoices</h3>
                <div className="flex space-x-2">
                  <div className="inline-flex items-center">
                    <label className="mr-2 text-sm">Match with:</label>
                    <select 
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={matchSource}
                      onChange={(e) => setMatchSource(e.target.value)}
                    >
                      <option value="csv">CSV Data</option>
                      <option value="erp">ERP Data</option>
                    </select>
                  </div>
                  <button
                    onClick={findMatches}
                    disabled={customerInvoices.length === 0 || findingMatches}
                    className={`px-3 py-1 rounded text-white text-sm ${customerInvoices.length === 0 || findingMatches ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    {findingMatches ? 'Finding Matches...' : 'Find Matches'}
                  </button>
                </div>
              </div>
              
              {customerDataLoading ? (
                <div className="flex justify-center items-center p-8">
                  <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading customer invoices...</span>
                </div>
              ) : customerInvoices.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No outstanding invoices found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerInvoices.map(invoice => {
                    const matchesForInvoice = potentialMatches[invoice.InvoiceID] || [];
                    return (
                      <div key={invoice.InvoiceID} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p><span className="font-medium">Invoice Number:</span> {invoice.InvoiceNumber || 'N/A'}</p>
                            <p><span className="font-medium">Reference:</span> {invoice.Reference || 'N/A'}</p>
                            <p><span className="font-medium">Amount:</span> {formatCurrency(invoice.Total)}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Date:</span> {formatDate(invoice.Date)}</p>
                            <p><span className="font-medium">Due Date:</span> {formatDate(invoice.DueDate)}</p>
                            <p><span className="font-medium">Status:</span> {invoice.Status}</p>
                          </div>
                        </div>
                        
                        {/* Matching results section */}
                        {matchesForInvoice.length > 0 ? (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Potential Matches:</h4>
                            <div className="divide-y divide-gray-200">
                              {matchesForInvoice.map(match => (
                                <div key={match.id} className="py-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                    <div>
                                      <p className="text-sm"><span className="font-medium">Reference:</span> {match.reference || 'N/A'}</p>
                                      <p className="text-sm"><span className="font-medium">Amount:</span> {formatCurrency(match.amount)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(match.date)}</p>
                                      <p className="text-sm"><span className="font-medium">Source:</span> {match.source}</p>
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <span className={`self-center px-2 py-0.5 text-xs rounded-full ${
                                      match.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                                      match.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {Math.round(match.confidence * 100)}% match
                                    </span>
                                    <button
                                      onClick={() => rejectMatch(invoice.InvoiceID, match.id)}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                                      disabled={processingMatch}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => approveMatch(invoice.InvoiceID, match.id)}
                                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                                      disabled={processingMatch}
                                    >
                                      {processingMatch ? 'Processing...' : 'Approve'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : Object.keys(potentialMatches).length > 0 ? (
                          <div className="text-center p-2 text-sm text-gray-500">
                            No matches found for this invoice
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">Select a customer from the list to view their invoices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionMatcher;