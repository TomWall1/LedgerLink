import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useXero } from '../context/XeroContext';
import { navigateTo } from '../utils/customRouter';

const TransactionMatcher = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matchingCriteria, setMatchingCriteria] = useState({
    matchByAmount: true,
    matchByDate: true,
    dateToleranceDays: 7,
    matchByReference: true,
    partialReferenceMatch: true,
    matchByDescription: false
  });
  const [processingMatch, setProcessingMatch] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const { isAuthenticated, checkAuthStatus } = useXero();
  
  // Load invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  // Fetch all outstanding invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check Xero authentication
      const authenticated = await checkAuthStatus(true);
      if (!authenticated) {
        setError('Not connected to Xero. Please connect your Xero account first.');
        setLoading(false);
        return;
      }
      
      // Fetch invoices that need matching
      const response = await api.get('/api/xero/invoices-to-match');
      
      setInvoices(response.data.invoices || []);
      
      if (response.data.invoices?.length > 0) {
        // Auto-select the first invoice
        findMatchesForInvoice(response.data.invoices[0]);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.error || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };
  
  // Find potential matches for a specific invoice
  const findMatchesForInvoice = async (invoice) => {
    try {
      setSelectedInvoice(invoice);
      setLoading(true);
      
      const response = await api.post('/api/transactions/find-matches', {
        invoice,
        criteria: matchingCriteria
      });
      
      setPotentialMatches(response.data.matches || []);
    } catch (err) {
      console.error('Error finding matches:', err);
      setPotentialMatches([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle criteria change
  const handleCriteriaChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : 
                    type === 'number' ? parseInt(value, 10) : 
                    value;
    
    setMatchingCriteria(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // If there's a selected invoice, re-run matching with new criteria
    if (selectedInvoice) {
      findMatchesForInvoice(selectedInvoice);
    }
  };
  
  // Approve a match
  const approveMatch = async (match) => {
    try {
      setProcessingMatch(true);
      
      await api.post('/api/transactions/approve-match', {
        invoiceId: selectedInvoice.InvoiceID,
        transactionId: match.id
      });
      
      // Remove the matched invoice from the list
      setInvoices(prevInvoices => 
        prevInvoices.filter(inv => inv.InvoiceID !== selectedInvoice.InvoiceID)
      );
      
      // If there are more invoices, select the next one
      const remainingInvoices = invoices.filter(inv => inv.InvoiceID !== selectedInvoice.InvoiceID);
      if (remainingInvoices.length > 0) {
        findMatchesForInvoice(remainingInvoices[0]);
      } else {
        // No more invoices to match
        setSelectedInvoice(null);
        setPotentialMatches([]);
      }
    } catch (err) {
      console.error('Error approving match:', err);
      setError('Failed to approve match. Please try again.');
    } finally {
      setProcessingMatch(false);
    }
  };
  
  // Reject a match and remove it from potential matches
  const rejectMatch = (match) => {
    // Just filter it out from the UI - no server action needed
    setPotentialMatches(prevMatches => 
      prevMatches.filter(m => m.id !== match.id)
    );
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
  
  if (loading && !selectedInvoice) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[50vh]">
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium">Loading transaction data...</span>
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
              onClick={fetchInvoices}
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
          <p>You need to connect to Xero before you can match transactions.</p>
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
  
  if (invoices.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">No Transactions to Match</h2>
          <p>All your invoices are currently matched or there are no outstanding transactions requiring matching.</p>
          <div className="mt-4">
            <button
              onClick={fetchInvoices}
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
        <h1 className="text-2xl font-bold">Transaction Matching</h1>
        <button
          onClick={handleBackToDashboard}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Invoices list */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Invoices to Match</h2>
          <div className="overflow-y-auto max-h-[70vh]">
            {invoices.map(invoice => (
              <div 
                key={invoice.InvoiceID} 
                className={`p-3 mb-2 rounded cursor-pointer ${selectedInvoice?.InvoiceID === invoice.InvoiceID ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => findMatchesForInvoice(invoice)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{invoice.InvoiceNumber || 'No Reference'}</span>
                  <span>{formatCurrency(invoice.Total)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Date: {formatDate(invoice.Date)}</div>
                  <div>Due: {formatDate(invoice.DueDate)}</div>
                  <div className="truncate">{invoice.Contact?.Name || 'Unknown Contact'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Middle panel - Current invoice and matches */}
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          {selectedInvoice ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Current Invoice</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Invoice Number:</span> {selectedInvoice.InvoiceNumber || 'N/A'}</p>
                    <p><span className="font-medium">Customer:</span> {selectedInvoice.Contact?.Name || 'N/A'}</p>
                    <p><span className="font-medium">Amount:</span> {formatCurrency(selectedInvoice.Total)}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Date:</span> {formatDate(selectedInvoice.Date)}</p>
                    <p><span className="font-medium">Due Date:</span> {formatDate(selectedInvoice.DueDate)}</p>
                    <p><span className="font-medium">Status:</span> {selectedInvoice.Status}</p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Potential Matches</h3>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <svg className="animate-spin h-6 w-6 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Finding potential matches...</span>
                </div>
              ) : potentialMatches.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No potential matches found for this invoice.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {potentialMatches.map(match => (
                    <div key={match.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p><span className="font-medium">Reference:</span> {match.reference || 'N/A'}</p>
                          <p><span className="font-medium">Description:</span> {match.description || 'N/A'}</p>
                          <p><span className="font-medium">Amount:</span> {formatCurrency(match.amount)}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Date:</span> {formatDate(match.date)}</p>
                          <p><span className="font-medium">Source:</span> {match.source || 'Unknown'}</p>
                          <p><span className="font-medium">Match Confidence:</span> 
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                              match.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                              match.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(match.confidence * 100)}%
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => rejectMatch(match)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          disabled={processingMatch}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approveMatch(match)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          disabled={processingMatch}
                        >
                          {processingMatch ? 'Processing...' : 'Approve Match'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">Select an invoice from the list to view potential matches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionMatcher;