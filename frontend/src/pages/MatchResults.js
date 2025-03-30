import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MatchingResults from '../components/MatchingResults';
import { formatCurrency } from '../utils/format';

const MatchResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load results from sessionStorage on component mount
  useEffect(() => {
    const storedResults = window.sessionStorage.getItem('matchResults');
    if (storedResults) {
      try {
        // Parse the JSON data
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing results from session storage:', error);
        navigate('/customer-transaction-matching');
      }
    } else {
      // If no results are available, redirect to the customer invoice matching page
      navigate('/customer-transaction-matching');
    }
    setLoading(false);
  }, [navigate]);

  // Function to handle exporting all results to CSV
  const handleExportAll = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare data for export (this would be implemented in utils/exportUtils.js)
    // For now, just log that export was requested
    console.log('Export all requested');
    
    // Logic for exporting would go here
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-lg font-medium">Loading results...</span>
      </div>
    );
  }

  if (!results) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Invoice Matching Results</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleExportAll}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export All CSV
          </button>
          <Link
            to="/customer-transaction-matching"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Match More Invoices
          </Link>
        </div>
      </div>

      <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
    </div>
  );
};

export default MatchResults;