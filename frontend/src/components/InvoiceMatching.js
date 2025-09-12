import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function InvoiceMatching() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [potentialMatches, setPotentialMatches] = useState({});
  const [loading, setLoading] = useState(false);
  const [customerDataLoading, setCustomerDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if Xero is connected first
      try {
        const statusResponse = await api.get('/api/xero/status');
        if (!statusResponse.data.connected) {
          setError('Please connect your Xero account first.');
          setLoading(false);
          return;
        }
      } catch (authError) {
        console.error('Error checking authentication:', authError);
        setError('Failed to verify Xero connection. Please try reconnecting.');
        setLoading(false);
        return;
      }
      
      const response = await api.get('/api/xero/customers');
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInvoices = async (customerId) => {
    if (!customerId) return;
    
    try {
      setCustomerDataLoading(true);
      setCustomerInvoices([]);
      setPotentialMatches({});
      
      const response = await api.get(`/api/xero/customers/${customerId}/invoices?includeHistory=false`);
      
      const outstandingInvoices = response.data.invoices?.filter(invoice => 
        invoice.Status === 'AUTHORISED' || invoice.Status === 'SENT'
      ) || [];
      
      setCustomerInvoices(outstandingInvoices);
    } catch (err) {
      console.error('Error fetching customer invoices:', err);
      setCustomerInvoices([]);
    } finally {
      setCustomerDataLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerInvoices(customer.ContactID);
    setPotentialMatches({});
    setUploadedFile(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setPotentialMatches({});
    }
  };

  const findMatches = async () => {
    if (!selectedCustomer || customerInvoices.length === 0 || !uploadedFile) {
      setError('Please select a customer and upload a CSV file before matching.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('csvFile', uploadedFile);
      formData.append('customerId', selectedCustomer.ContactID);
      formData.append('dateFormat', dateFormat);
      
      const response = await api.post('/api/xero/match-invoices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPotentialMatches(response.data.matches || {});
    } catch (err) {
      console.error('Error matching invoices:', err);
      setError(err.response?.data?.error || 'Failed to match invoices');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'orange';
    return 'red';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="invoice-matching">
      <h1>Invoice Matching</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="matching-container">
        {/* Customer Selection Panel */}
        <div className="panel customer-panel">
          <h3>1. Select Customer</h3>
          {loading ? (
            <div>Loading customers...</div>
          ) : (
            <div className="customer-list">
              {customers.map(customer => (
                <div 
                  key={customer.ContactID}
                  className={`customer-item ${selectedCustomer?.ContactID === customer.ContactID ? 'selected' : ''}`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="customer-name">{customer.Name}</div>
                  <div className="customer-email">{customer.EmailAddress}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload Panel */}
        <div className="panel upload-panel">
          <h3>2. Upload CSV File</h3>
          <div className="date-format-selector">
            <label>Date Format:</label>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM-DD-YYYY">MM-DD-YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select>
          </div>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            className="file-input"
          />
          
          {uploadedFile && (
            <div className="file-info">
              <strong>File:</strong> {uploadedFile.name}
            </div>
          )}
          
          <button 
            onClick={findMatches}
            disabled={!selectedCustomer || !uploadedFile || loading}
            className="btn btn-primary match-btn"
          >
            {loading ? 'Finding Matches...' : 'Find Matches'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="panel results-panel">
          <h3>3. Review Matches</h3>
          
          {selectedCustomer && (
            <div className="customer-invoices">
              <h4>{selectedCustomer.Name} - Outstanding Invoices</h4>
              {customerDataLoading ? (
                <div>Loading invoices...</div>
              ) : (
                <div className="invoices-list">
                  {customerInvoices.map(invoice => {
                    const matches = potentialMatches[invoice.InvoiceID] || [];
                    return (
                      <div key={invoice.InvoiceID} className="invoice-item">
                        <div className="invoice-header">
                          <span className="invoice-number">{invoice.InvoiceNumber}</span>
                          <span className="invoice-amount">{formatCurrency(invoice.Total)}</span>
                          <span className="invoice-date">{new Date(invoice.Date).toLocaleDateString()}</span>
                        </div>
                        
                        {matches.length > 0 && (
                          <div className="matches">
                            {matches.map((match, index) => (
                              <div key={index} className="match-item">
                                <div className="match-info">
                                  <span className="match-amount">{formatCurrency(match.amount)}</span>
                                  <span className="match-date">{new Date(match.date).toLocaleDateString()}</span>
                                  <span className="match-reference">{match.reference}</span>
                                </div>
                                <div 
                                  className={`confidence-score ${getConfidenceColor(match.confidence)}`}
                                >
                                  {match.confidence}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoiceMatching;