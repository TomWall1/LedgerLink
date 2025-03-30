import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useXero } from '../context/XeroContext';
import FileUpload from './FileUpload';
import DateFormatSelect from './DateFormatSelect';

const CustomerTransactionMatcher = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  const [findingMatches, setFindingMatches] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY'); // Change default format to DD/MM/YYYY
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  
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
      setError(null);
      
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
    // Clear any previous error when selecting a new customer
    setError(null);
    setUploadedFile(null);
  };
  
  // Handle file upload
  const handleFileUpload = (file) => {
    setUploadedFile(file);
    // Clear any previous error when uploading a new file
    setError(null);
  };
  
  // Find potential matches between customer invoices and uploaded CSV file
  const findMatches = async () => {
    if (!selectedCustomer || customerInvoices.length === 0 || !uploadedFile) {
      setError('Please select a customer and upload a CSV file before matching.');
      return;
    }
    
    try {
      setFindingMatches(true);
      setError(null);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('customerInvoices', JSON.stringify(customerInvoices));
      formData.append('csvFile', uploadedFile);
      formData.append('dateFormat', dateFormat);
      formData.append('customerId', selectedCustomer.ContactID);
      formData.append('useHistoricalData', useHistoricalData);
      
      const response = await api.post('/api/transactions/match-customer-invoices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Navigate to the match results page with the response data
      if (response.data.success) {
        // Prepare the results object with necessary data for the results page
        const results = {
          data: response.data.data,
          unmatchedInvoices: customerInvoices.filter(invoice => 
            !response.data.data.some(match => match.invoice.InvoiceID === invoice.InvoiceID)
          ),
          customer: selectedCustomer,
          totals: {
            company1Total: customerInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.Total || 0), 0), 
            company2Total: 0, // Will be calculated on the results page
            variance: 0 // Will be calculated on the results page
          }
        };
        
        // Navigate to the results page with the match data
        navigate('/match-results', { state: { results } });
      } else {
        setError('No matches found for the selected customer\'s invoices.');
      }
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err.response?.data?.error || 'Failed to find potential matches');
    } finally {
      setFindingMatches(false);
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
    navigate('/dashboard');
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
  
  if (error && !selectedCustomer) {
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
              onClick={() => navigate('/erp-connections')}
              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm"
            >
              Connect to Xero
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
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left panel - Customers list */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">1. Select a Customer</h2>
          <div className="overflow-y-auto max-h-[60vh]">
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
        
        {/* Middle panel - CSV upload and options */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">2. Upload CSV Data</h2>
          
          {selectedCustomer ? (
            <div className="space-y-4">
              <FileUpload
                onFileSelected={handleFileUpload}
                accept=".csv"
                label="Upload CSV File"
              />
              
              {uploadedFile && (
                <p className="text-sm text-green-600">
                  ✓ {uploadedFile.name} uploaded
                </p>
              )}
              
              <DateFormatSelect
                selectedFormat={dateFormat}
                onChange={setDateFormat}
                label="CSV Date Format"
              />
              
              <div className="mt-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="useHistoricalData"
                    checked={useHistoricalData}
                    onChange={(e) => setUseHistoricalData(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="useHistoricalData" className="text-gray-700 text-sm">
                    Include historical data
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Check this to see if matching invoices have been paid in the past</p>
              </div>
              
              <button
                onClick={findMatches}
                disabled={!uploadedFile || customerInvoices.length === 0 || findingMatches}
                className={`mt-4 w-full px-4 py-2 text-white rounded-md ${!uploadedFile || customerInvoices.length === 0 || findingMatches ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {findingMatches ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding Matches...
                  </>
                ) : (
                  'Find Matches'
                )}
              </button>
              
              <div className="mt-4 bg-gray-50 p-3 rounded text-sm">
                <h3 className="font-semibold mb-1">CSV Requirements:</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Must include headers</li>
                  <li>Required columns: transaction_number, amount, issue_date</li>
                  <li>Optional: reference, description, status</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>Select a customer first</p>
            </div>
          )}
        </div>
        
        {/* Right panel - Customer invoices */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">3. Customer Invoices</h2>
          
          {customerDataLoading ? (
            <div className="flex justify-center items-center p-8">
              <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading invoices...</span>
            </div>
          ) : selectedCustomer ? (
            customerInvoices.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No outstanding invoices found for this customer.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[60vh]">
                {customerInvoices.map(invoice => (
                  <div key={invoice.InvoiceID} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">#{invoice.InvoiceNumber}</span>
                        <span className="ml-2 text-sm text-gray-500">{formatCurrency(invoice.Total)}</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {invoice.Status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <span>Date: {formatDate(invoice.Date)}</span>
                      <span className="ml-4">Due: {formatDate(invoice.DueDate)}</span>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">
                    {customerInvoices.length} invoice{customerInvoices.length !== 1 ? 's' : ''} ready for matching
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total value: {formatCurrency(customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.Total || 0), 0))}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>Select a customer to view invoices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionMatcher;