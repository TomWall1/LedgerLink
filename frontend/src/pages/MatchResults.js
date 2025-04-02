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
        
        // Log the raw data to understand its structure
        console.log('Raw data from session storage:', parsedResults);
        
        // Process the raw data to create proper matching results
        const processedResults = processMatchResults(parsedResults);
        setResults(processedResults);
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

  // Process match results into the required categories
  const processMatchResults = (rawData) => {
    // Create the base structure for the results
    const processedData = {
      ...rawData,
      perfectMatches: [],
      mismatches: [],
      dateMismatches: [],
      unmatchedItems: {
        company1: [], // AR Invoices (receivables)
        company2: []  // AP Transactions (payables)
      },
      historicalInsights: []
    };

    // Extract the AR total from the raw data
    const arTotal = rawData.totals?.company1Total || 0;
    let apTotal = 0; // We'll calculate this as we process the data
    
    // Process matches if data exists
    if (rawData.data && Array.isArray(rawData.data) && rawData.data.length > 0) {
      // Process each AR invoice and its potential matches
      rawData.data.forEach(item => {
        if (!item.invoice || !item.matches || item.matches.length === 0) return;
        
        const invoice = item.invoice;
        const bestMatch = item.matches[0]; // Use the first match, which should be the highest confidence match
        
        // Create the standard AR transaction object format
        const arTransaction = {
          transactionNumber: invoice.InvoiceNumber,
          amount: parseFloat(invoice.Total),
          date: invoice.Date,
          dueDate: invoice.DueDate,
          status: invoice.Status || 'Open',
          type: invoice.Type || 'Invoice'
        };
        
        // Create the standard AP transaction object format
        const apTransaction = {
          transactionNumber: bestMatch.reference,
          amount: parseFloat(bestMatch.amount),
          date: bestMatch.date,
          status: 'Open',
          type: 'Payable',
          description: bestMatch.description || ''
        };
        
        // Add to AP total
        apTotal += parseFloat(bestMatch.amount);

        // Determine if this is a perfect match, a date mismatch, or an amount mismatch
        const hasAmountMismatch = Math.abs(arTransaction.amount - apTransaction.amount) > 0.01;
        
        // Calculate date difference in days
        const arDate = new Date(arTransaction.date);
        const apDate = new Date(apTransaction.date);
        const dateDifferenceMs = Math.abs(arDate - apDate);
        const dateDifferenceDays = Math.floor(dateDifferenceMs / (1000 * 60 * 60 * 24));
        
        const hasDateMismatch = dateDifferenceDays > 2; // Consider a 2-day difference a mismatch
        
        if (hasAmountMismatch) {
          // Amount mismatch takes precedence
          processedData.mismatches.push({
            company1: arTransaction,
            company2: apTransaction
          });
          
          // Also add an insight about the mismatch
          processedData.historicalInsights.push({
            apItem: apTransaction,
            historicalMatch: arTransaction,
            insight: {
              severity: 'warning',
              message: `Amount mismatch: AP shows ${formatCurrency(apTransaction.amount)} vs. AR showing ${formatCurrency(arTransaction.amount)}`
            }
          });
        } else if (hasDateMismatch) {
          // Date mismatch
          processedData.dateMismatches.push({
            company1: arTransaction,
            company2: apTransaction,
            mismatchType: 'transaction_date', // or 'due_date' if comparing due dates
            company1Date: arTransaction.date,
            company2Date: apTransaction.date,
            daysDifference: dateDifferenceDays
          });
        } else {
          // Perfect match
          processedData.perfectMatches.push({
            company1: arTransaction,
            company2: apTransaction
          });
        }
      });
    }
    
    // Process unmatched AR invoices
    if (rawData.unmatchedInvoices && Array.isArray(rawData.unmatchedInvoices)) {
      // Add all unmatched AR invoices
      processedData.unmatchedItems.company1 = rawData.unmatchedInvoices.map(invoice => ({
        transactionNumber: invoice.InvoiceNumber,
        amount: parseFloat(invoice.Total),
        date: invoice.Date,
        dueDate: invoice.DueDate,
        status: invoice.Status || 'Open',
        type: invoice.Type || 'Invoice'
      }));
    }
    
    // Get all matched AP transaction references to identify unmatched AP items
    const matchedApRefs = [
      ...processedData.perfectMatches.map(match => match.company2.transactionNumber),
      ...processedData.mismatches.map(match => match.company2.transactionNumber),
      ...processedData.dateMismatches.map(match => match.company2.transactionNumber)
    ];
    
    // Find unmatched AP transactions from the raw data
    // In a real implementation, you would have all AP transactions available
    // Here we're using the matches array to identify potential unmatched AP items
    if (rawData.data && Array.isArray(rawData.data)) {
      // Create a set of all unique AP transactions from all matches
      const allApTransactions = new Set();
      const apTransactionMap = new Map();
      
      rawData.data.forEach(item => {
        if (!item.matches || !Array.isArray(item.matches)) return;
        
        item.matches.forEach(match => {
          // Only process the match if we haven't seen this AP reference before
          if (!allApTransactions.has(match.reference)) {
            allApTransactions.add(match.reference);
            
            // Store the AP transaction in a map for easy lookup
            apTransactionMap.set(match.reference, {
              transactionNumber: match.reference,
              amount: parseFloat(match.amount),
              date: match.date,
              status: 'Open', // Default status
              type: 'Payable', // Default type
              description: match.description || ''
            });
          }
        });
      });
      
      // Find AP transactions that aren't in any matched category
      // For this, we check each AP transaction in the map against our matched list
      apTransactionMap.forEach((transaction, reference) => {
        if (!matchedApRefs.includes(reference)) {
          // This AP transaction isn't matched to any AR invoice
          processedData.unmatchedItems.company2.push(transaction);
          apTotal += transaction.amount; // Add to AP total
        }
      });
    }
    
    // Update totals
    processedData.totals = {
      company1Total: arTotal,
      company2Total: apTotal,
      variance: arTotal - apTotal
    };
    
    return processedData;
  };

  // Function to handle exporting all results to CSV
  const handleExportAll = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    const customerName = results?.customer?.Name || 'customer';
    const filename = `${customerName}_invoice_matches_${date}.csv`;
    
    // Create CSV content
    let csvContent = 'Invoice #,Amount,AR Date,AR Due Date,AP Reference,AP Amount,AP Date,AP Description\n';
    
    // Add data rows for perfect matches
    if (results?.perfectMatches && results.perfectMatches.length > 0) {
      results.perfectMatches.forEach(match => {
        csvContent += `"${match.company1?.transactionNumber || ''}",`;
        csvContent += `"${match.company1?.amount || ''}",`;
        csvContent += `"${match.company1?.date || ''}",`;
        csvContent += `"${match.company1?.dueDate || ''}",`;
        csvContent += `"${match.company2?.transactionNumber || ''}",`;
        csvContent += `"${match.company2?.amount || ''}",`;
        csvContent += `"${match.company2?.date || ''}",`;
        csvContent += `"${match.company2?.description || ''}"\n`;
      });
    }
    
    // Add data rows for mismatches
    if (results?.mismatches && results.mismatches.length > 0) {
      results.mismatches.forEach(match => {
        csvContent += `"${match.company1?.transactionNumber || ''}",`;
        csvContent += `"${match.company1?.amount || ''}",`;
        csvContent += `"${match.company1?.date || ''}",`;
        csvContent += `"${match.company1?.dueDate || ''}",`;
        csvContent += `"${match.company2?.transactionNumber || ''}",`;
        csvContent += `"${match.company2?.amount || ''}",`;
        csvContent += `"${match.company2?.date || ''}",`;
        csvContent += `"${match.company2?.description || ''}"\n`;
      });
    }
    
    // Add data rows for date mismatches
    if (results?.dateMismatches && results.dateMismatches.length > 0) {
      results.dateMismatches.forEach(match => {
        csvContent += `"${match.company1?.transactionNumber || ''}",`;
        csvContent += `"${match.company1?.amount || ''}",`;
        csvContent += `"${match.company1?.date || ''}",`;
        csvContent += `"${match.company1?.dueDate || ''}",`;
        csvContent += `"${match.company2?.transactionNumber || ''}",`;
        csvContent += `"${match.company2?.amount || ''}",`;
        csvContent += `"${match.company2?.date || ''}",`;
        csvContent += `"${match.company2?.description || ''}"\n`;
      });
    }
    
    // Create downloadable link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Invoice Matching Results</h1>
          {results.customer && (
            <p className="text-lg text-gray-600 mt-1">
              Customer: {results.customer.Name}
            </p>
          )}
        </div>
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

      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-4">Matching Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total AR (Receivables)</h3>
            <p className="text-2xl font-bold">{formatCurrency(results.totals?.company1Total || 0)}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total AP (Payables)</h3>
            <p className="text-2xl font-bold">{formatCurrency(results.totals?.company2Total || 0)}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Variance</h3>
            <p className={`text-2xl font-bold ${Math.abs(results.totals?.variance || 0) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(results.totals?.variance || 0)}
            </p>
          </div>
        </div>
      </div>

      <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
    </div>
  );
};

export default MatchResults;