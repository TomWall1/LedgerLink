import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useXero } from '../context/XeroContext';
import XeroConnection from '../components/XeroConnection';

const Upload = () => {
  const [arFile, setArFile] = useState(null);
  const [apFile, setApFile] = useState(null);
  const [dateFormat1, setDateFormat1] = useState('YYYY-MM-DD');
  const [dateFormat2, setDateFormat2] = useState('YYYY-MM-DD');
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [xeroData, setXeroData] = useState(null);
  const [allXeroCustomers, setAllXeroCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isLoadingXero, setIsLoadingXero] = useState(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getApiUrl } = useXero();
  
  // Check if we're coming from Xero connection
  useEffect(() => {
    if (location.state?.xeroEnabled && isAuthenticated) {
      // Fetch Xero customers when enabled
      console.log('Xero integration enabled');
      fetchXeroCustomers();
    }
    
    // Display success message if present
    if (location.state?.message) {
      // You could set a success message state and display it
      console.log('Message from navigation:', location.state.message);
    }
  }, [location.state, isAuthenticated]);

  // Function to fetch Xero customers from the real API
  const fetchXeroCustomers = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingXero(true);
      setError(null);
      setIsSelectingCustomer(true);
      
      const apiUrl = getApiUrl();
      console.log('Fetching Xero customers from:', apiUrl);
      
      // Simplify the fetch request by removing unnecessary headers
      const response = await fetch(`${apiUrl}/api/xero/customers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch customers: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Raw Xero customers data:', data);
      
      // Check if it's the new backend format or the direct Xero API format
      const customers = data.customers || data; // Handle both formats
      
      // Transform the data to match our expected format
      const formattedCustomers = customers.map(customer => ({
        id: customer.contactID || customer.ContactID,
        name: customer.name || customer.Name,
        email: customer.emailAddress || customer.EmailAddress || 'No email'
      }));
      
      setAllXeroCustomers(formattedCustomers);
      console.log('Xero customers loaded:', formattedCustomers);
    } catch (err) {
      console.error('Error fetching Xero customers:', err);
      setError('Failed to fetch Xero customers: ' + err.message);
      setIsSelectingCustomer(false);
    } finally {
      setIsLoadingXero(false);
    }
  };

  // Function to fetch invoices for a selected customer from the real API
  const fetchCustomerData = async (customerId) => {
    try {
      setIsLoadingXero(true);
      setError(null);
      
      // Find the selected customer name for display
      const customer = allXeroCustomers.find(c => c.id === customerId);
      const customerName = customer ? customer.name : 'Unknown';
      
      const apiUrl = getApiUrl();
      console.log(`Fetching invoices for customer ${customerId} from: ${apiUrl}`);
      
      const response = await fetch(`${apiUrl}/api/xero/customers/${customerId}/invoices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch invoices: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Raw Xero invoices data:', data);
      
      // Check for the different response format and normalize it
      const invoices = data.invoices || data; // Handle both formats
      
      // Transform the data to match our expected format
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.invoiceID || invoice.InvoiceID,
        type: invoice.type || invoice.Type,
        amount: parseFloat(invoice.amount || invoice.Total || invoice.AmountDue || 0),
        issueDate: invoice.date || invoice.Date || invoice.dateString || null,
        dueDate: invoice.dueDate || invoice.DueDate || invoice.dueDateString || null,
        status: invoice.status || invoice.Status,
        reference: invoice.reference || invoice.Reference || invoice.invoiceNumber || invoice.InvoiceNumber
      }));
      
      // Set the Xero data with customer information and formatted invoices
      setXeroData({
        customerId,
        customerName,
        invoices: formattedInvoices
      });
      
      console.log('Customer invoices loaded:', formattedInvoices);
      
      // Hide the customer selection once data is loaded
      setIsSelectingCustomer(false);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
      setError('Failed to fetch customer invoices: ' + err.message);
    } finally {
      setIsLoadingXero(false);
    }
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    
    if (customerId) {
      fetchCustomerData(customerId);
    }
  };

  const handleARFileChange = (e) => {
    setArFile(e.target.files[0]);
    // Clear Xero data if file is uploaded
    if (e.target.files[0]) {
      setXeroData(null);
      setIsSelectingCustomer(false);
    }
  };

  const handleAPFileChange = (e) => {
    setApFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!arFile && !xeroData && !isSelectingCustomer) {
      setError('Please select at least one file to upload or connect to Xero');
      return;
    }
    
    if (!apFile) {
      setError('Please select an AP file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      if (arFile) formData.append('arFile', arFile);
      if (apFile) formData.append('apFile', apFile);
      
      // Add Xero data if available
      if (xeroData) {
        formData.append('arData', JSON.stringify(xeroData.invoices));
        formData.append('customerName', xeroData.customerName);
        formData.append('customerId', xeroData.customerId);
        console.log('Including Xero data in submission:', xeroData);
      }
      
      // Add date formats and historical data flag
      formData.append('dateFormat1', dateFormat1);
      formData.append('dateFormat2', dateFormat2);
      formData.append('useHistoricalData', useHistoricalData);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com';
      
      const response = await axios.post(`${apiUrl}/api/match`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Navigate to results page with the data
      navigate('/results', { state: { results: response.data } });
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Error uploading files: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to use Xero data
  const useXeroData = () => {
    if (!isAuthenticated) {
      setError('Please connect to Xero first');
      return;
    }
    
    fetchXeroCustomers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-primary mb-6">Upload Ledger Files</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* AR File Upload */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-primary">Accounts Receivable (AR)</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {isSelectingCustomer ? (
                    <div className="mb-4">
                      <h3 className="font-medium text-lg mb-2">Select a Xero Customer</h3>
                      {isLoadingXero ? (
                        <div className="text-sm bg-blue-100 p-3 rounded-lg flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p>Loading customers from Xero...</p>
                        </div>
                      ) : (
                        <div>
                          {allXeroCustomers.length > 0 ? (
                            <>
                              <select
                                value={selectedCustomer}
                                onChange={handleCustomerSelect}
                                className="w-full p-2 border border-gray-300 rounded mb-2"
                              >
                                <option value="">Select a customer</option>
                                {allXeroCustomers.map(customer => (
                                  <option key={customer.id} value={customer.id}>
                                    {customer.name} ({customer.email})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSelectingCustomer(false);
                                  setSelectedCustomer('');
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <div className="text-sm bg-yellow-50 p-3 rounded-lg">
                              <p className="font-medium text-yellow-700">No customers found in Xero</p>
                              <p className="text-yellow-600 mt-1">Either you don't have any customers in Xero or we can't access them.</p>
                              <button
                                type="button"
                                onClick={() => setIsSelectingCustomer(false)}
                                className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                              >
                                Go Back
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <label className="block mb-4">
                        <span className="text-text block mb-2">Upload AR CSV file</span>
                        <input 
                          type="file" 
                          accept=".csv" 
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-primary file:text-white
                            hover:file:bg-opacity-90 transition-colors"
                          onChange={handleARFileChange}
                          disabled={xeroData !== null || isLoadingXero}
                        />
                      </label>
                      
                      {arFile && (
                        <div className="text-sm bg-primary bg-opacity-5 p-3 rounded-lg">
                          <p className="font-medium text-primary">{arFile.name}</p>
                          <p className="text-text">{(arFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      )}
                      
                      {isLoadingXero && !isSelectingCustomer && (
                        <div className="text-sm bg-blue-100 p-3 rounded-lg flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p>Loading Xero data...</p>
                        </div>
                      )}
                      
                      {xeroData && (
                        <div className="text-sm bg-accent bg-opacity-10 p-3 rounded-lg">
                          <p className="font-medium text-accent">Using Xero Data</p>
                          <p className="font-medium">Customer: {xeroData.customerName}</p>
                          <p className="text-text">{xeroData.invoices.length} invoices from Xero</p>
                          <button 
                            type="button"
                            onClick={() => setXeroData(null)}
                            className="mt-2 text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                          >
                            Remove Xero Data
                          </button>
                        </div>
                      )}
                      
                      {isAuthenticated && !xeroData && !isLoadingXero && !arFile && (
                        <button
                          type="button"
                          onClick={useXeroData}
                          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Import from Xero
                        </button>
                      )}
                    </>
                  )}
                  
                  <div className="mt-4">
                    <label className="text-sm text-text block mb-1">Date format</label>
                    <select
                      className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                      value={dateFormat1}
                      onChange={(e) => setDateFormat1(e.target.value)}
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>
                  
                  <p className="text-sm text-text mt-3">
                    CSV format: Transaction number, Type, Amount, Issue date, Due date, Status, Reference
                  </p>
                </div>
              </div>
              
              {/* AP File Upload */}
              <div>
                <h2 className="text-lg font-semibold mb-3 text-primary">Accounts Payable (AP)</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="block mb-4">
                    <span className="text-text block mb-2">Upload AP CSV file</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-secondary file:text-white
                        hover:file:bg-opacity-90 transition-colors"
                      onChange={handleAPFileChange}
                    />
                  </label>
                  
                  {apFile && (
                    <div className="text-sm bg-secondary bg-opacity-5 p-3 rounded-lg">
                      <p className="font-medium text-secondary">{apFile.name}</p>
                      <p className="text-text">{(apFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className="text-sm text-text block mb-1">Date format</label>
                    <select
                      className="block w-full text-sm border border-gray-300 rounded-lg p-2"
                      value={dateFormat2}
                      onChange={(e) => setDateFormat2(e.target.value)}
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    </select>
                  </div>
                  
                  <p className="text-sm text-text mt-3">
                    CSV format: Transaction number, Type, Amount, Issue date, Due date, Status, Reference
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useHistoricalData"
                  className="h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                  checked={useHistoricalData}
                  onChange={(e) => setUseHistoricalData(e.target.checked)}
                />
                <label htmlFor="useHistoricalData" className="ml-2 block text-sm text-text">
                  Use historical data (if available) for enhanced matching
                </label>
              </div>
              <p className="text-xs text-text mt-1 ml-6">
                This will use historical invoice data to help identify previously resolved matches.
              </p>
            </div>
            
            {isLoading && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary bg-opacity-10">
                        Uploading
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-secondary">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-secondary bg-opacity-10">
                    <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center mt-6">
              <button 
                type="submit" 
                className="bg-secondary hover:bg-opacity-90 text-white px-6 py-3 rounded-lg font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isLoading || isLoadingXero || isSelectingCustomer}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Match & Process Files'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Xero Integration */}
        <div className="mt-8">
          <XeroConnection onUseXeroData={useXeroData} />
        </div>
      </div>
    </div>
  );
};

export default Upload;