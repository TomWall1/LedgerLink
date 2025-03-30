import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useXero } from '../context/XeroContext';

const ERPDataView = ({ connectionId }) => {
  const navigate = useNavigate();
  const params = useParams();
  // If connectionId is not passed as prop, try getting it from URL params
  const urlConnectionId = connectionId || params.connectionId;
  
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  
  const { isAuthenticated: isXeroAuthenticated } = useXero();
  
  // Fetch connection details
  useEffect(() => {
    const fetchConnection = async () => {
      if (!urlConnectionId) {
        setError('Connection ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/erp-connections/${urlConnectionId}`);
        setConnection(response.data.data);
        
        // Load invoices by default
        fetchInvoices();
      } catch (err) {
        console.error('Error fetching connection:', err);
        setError(err.response?.data?.error || 'Failed to load connection details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnection();
  }, [urlConnectionId]);
  
  // Check Xero authentication status
  useEffect(() => {
    if (!isXeroAuthenticated && connection && connection.provider === 'xero') {
      setError('You are not connected to Xero. Please connect to Xero and try again.');
    } else if (isXeroAuthenticated && error && error.includes('not connected to Xero')) {
      // Clear the error if it was about Xero connection and we're now connected
      setError(null);
      // Reload data
      if (activeTab === 'invoices') {
        fetchInvoices();
      } else if (activeTab === 'customers') {
        fetchCustomers();
      }
    }
  }, [isXeroAuthenticated, connection, error, activeTab]);
  
  // Fetch invoices for the connection
  const fetchInvoices = async () => {
    if (!urlConnectionId) return;
    
    try {
      setDataLoading(true);
      setError(null);
      const response = await api.get(`/api/xero/invoices`);
      setInvoices(response.data.invoices || []);
      setActiveTab('invoices');
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.error || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setDataLoading(false);
    }
  };
  
  // Fetch customers for the connection
  const fetchCustomers = async () => {
    if (!urlConnectionId) return;
    
    try {
      setDataLoading(true);
      setError(null);
      const response = await api.get(`/api/xero/customers`);
      setCustomers(response.data.customers || []);
      setActiveTab('customers');
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setDataLoading(false);
    }
  };
  
  // Fetch invoices for a specific customer
  const fetchCustomerInvoices = async (customerId) => {
    if (!customerId) return;
    
    try {
      setCustomerDataLoading(true);
      const response = await api.get(`/api/xero/customers/${customerId}/invoices?includeHistory=true`);
      setCustomerInvoices(response.data.invoices || []);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
      // Don't set the main error state, just log it
      setCustomerInvoices([]);
    } finally {
      setCustomerDataLoading(false);
    }
  };
  
  // Format currency display
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
  
  // Handle tab change
  const handleTabChange = (tab) => {
    if (tab === 'invoices') {
      fetchInvoices();
    } else if (tab === 'customers') {
      fetchCustomers();
    }
  };

  // Navigate back to connections
  const handleBackToConnections = () => {
    navigate('/erp-connections');
  };
  
  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerInvoices(customer.ContactID);
  };
  
  // Handle closing customer details
  const handleCloseCustomerDetails = () => {
    setSelectedCustomer(null);
    setCustomerInvoices([]);
  };
  
  // Handle refreshing data
  const handleRefreshData = () => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading connection data...</p>
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
              onClick={handleRefreshData}
              className="inline-flex items-center px-3 py-1 mr-3 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
            >
              Retry
            </button>
            <button
              onClick={handleBackToConnections}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
            >
              Back to Connections
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!connection) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p>Connection not found</p>
        </div>
        <button
          onClick={handleBackToConnections}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Connections
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{connection.connectionName}</h1>
          <p className="text-gray-600">{connection.companyId?.name} • {connection.provider.toUpperCase()} • Last synced: {connection.lastSyncedAt ? new Date(connection.lastSyncedAt).toLocaleString() : 'Never'}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={handleRefreshData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <button
            onClick={handleBackToConnections}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Connections
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('invoices')}
            className={`${activeTab === 'invoices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Invoices
          </button>
          <button
            onClick={() => handleTabChange('customers')}
            className={`${activeTab === 'customers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Customers
          </button>
        </nav>
      </div>
      
      {/* Content area */}
      <div>
        {dataLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Loading {activeTab}...</p>
          </div>
        ) : activeTab === 'invoices' ? (
          <div>
            {invoices.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-700">No invoices found for this connection.</p>
                <button 
                  onClick={handleRefreshData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice, index) => (
                      <tr key={`${invoice.InvoiceID || invoice.transactionNumber || index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.InvoiceNumber || invoice.transactionNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.Type || invoice.type || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.Date || invoice.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.DueDate || invoice.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.Total || invoice.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (invoice.Status || invoice.status) === 'PAID' ? 'bg-green-100 text-green-800' :
                            (invoice.Status || invoice.status) === 'VOIDED' ? 'bg-gray-100 text-gray-800' :
                            (invoice.Status || invoice.status) === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {invoice.Status || invoice.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.Reference || invoice.reference || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'customers' ? (
          <div>
            {/* Customer details modal */}
            {selectedCustomer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6 flex justify-between items-start border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedCustomer.Name}</h2>
                      <p className="text-gray-600">{selectedCustomer.EmailAddress || 'No email available'}</p>
                    </div>
                    <button
                      onClick={handleCloseCustomerDetails}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Contact Details</h3>
                        <p><strong>Phone:</strong> {selectedCustomer.Phones?.[0]?.PhoneNumber || 'N/A'}</p>
                        <p><strong>Website:</strong> {selectedCustomer.Website || 'N/A'}</p>
                        <p><strong>Tax Number:</strong> {selectedCustomer.TaxNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Address</h3>
                        {selectedCustomer.Addresses && selectedCustomer.Addresses.length > 0 ? (
                          <div>
                            <p>{selectedCustomer.Addresses[0].AddressLine1 || ''}</p>
                            {selectedCustomer.Addresses[0].AddressLine2 && <p>{selectedCustomer.Addresses[0].AddressLine2}</p>}
                            <p>
                              {selectedCustomer.Addresses[0].City || ''}
                              {selectedCustomer.Addresses[0].City && selectedCustomer.Addresses[0].Region ? ', ' : ''}
                              {selectedCustomer.Addresses[0].Region || ''}
                              {' '}
                              {selectedCustomer.Addresses[0].PostalCode || ''}
                            </p>
                            <p>{selectedCustomer.Addresses[0].Country || ''}</p>
                          </div>
                        ) : (
                          <p>No address available</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-700 mb-4">Customer Invoices</h3>
                      {customerDataLoading ? (
                        <div className="text-center py-8">
                          <svg className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <p className="text-gray-600">Loading invoices...</p>
                        </div>
                      ) : customerInvoices.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <p className="text-gray-600">No invoices found for this customer</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {customerInvoices.map((invoice, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.InvoiceNumber || '-'}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.Date)}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.DueDate)}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(invoice.Total)}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      invoice.Status === 'PAID' ? 'bg-green-100 text-green-800' :
                                      invoice.Status === 'VOIDED' ? 'bg-gray-100 text-gray-800' :
                                      invoice.Status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {invoice.Status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4 flex justify-end">
                    <button
                      onClick={handleCloseCustomerDetails}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {customers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-700">No customers found for this connection.</p>
                <button 
                  onClick={handleRefreshData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Number</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.ContactID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.Name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.EmailAddress || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.Phones?.[0]?.PhoneNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.Website || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.TaxNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleCustomerSelect(customer)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ERPDataView;