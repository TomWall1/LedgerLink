import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MatchingResults from '../components/MatchingResults';
import { formatCurrency } from '../utils/format';
import dayjs from 'dayjs';

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
        console.log('Original results from session:', parsedResults);
        
        // Pre-process the data for the enhanced display
        const enhancedResults = enhanceResultsData(parsedResults);
        console.log('Enhanced results:', enhancedResults);
        setResults(enhancedResults);
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

  // Function to process and enhance the raw results data
  const enhanceResultsData = (rawResults) => {
    if (!rawResults || !rawResults.data) {
      return rawResults;
    }

    // Create the data object structure for the enhanced format
    const enhancedData = {
      ...rawResults,
      perfectMatches: [],
      mismatches: [],
      dateMismatches: [],
      unmatchedItems: {
        company1: [],
        company2: []
      },
      historicalInsights: []
    };

    // Set unmatched AR items directly from the source
    if (rawResults.unmatchedInvoices && Array.isArray(rawResults.unmatchedInvoices)) {
      enhancedData.unmatchedItems.company1 = rawResults.unmatchedInvoices.map(invoice => ({
        transactionNumber: invoice.InvoiceNumber,
        amount: invoice.Total,
        date: invoice.Date,
        dueDate: invoice.DueDate,
        status: invoice.Status || 'Open',
        type: invoice.Type || 'Invoice'
      }));
    }

    // Collect all matched AP references to identify unmatched AP items later
    const matchedAPReferences = new Set();
    
    // Process matches
    if (rawResults.data && Array.isArray(rawResults.data)) {
      rawResults.data.forEach(match => {
        if (match.matches && match.matches.length > 0) {
          const invoice = match.invoice;
          const bestMatch = match.matches.sort((a, b) => b.confidence - a.confidence)[0];

          // Record this AP reference as matched
          if (bestMatch.reference) {
            matchedAPReferences.add(bestMatch.reference.toLowerCase());
          }

          // Create company1 (AR) and company2 (AP) objects for consistent structure
          const company1 = {
            transactionNumber: invoice.InvoiceNumber,
            amount: invoice.Total,
            date: invoice.Date,
            dueDate: invoice.DueDate,
            status: invoice.Status || 'Open',
            type: invoice.Type || 'Invoice',
            is_partially_paid: invoice.is_partially_paid || false,
            amount_paid: invoice.amount_paid || 0,
            original_amount: invoice.original_amount || invoice.Total
          };

          const company2 = {
            transactionNumber: bestMatch.reference,
            amount: bestMatch.amount,
            date: bestMatch.date,
            status: bestMatch.status || 'Open',
            type: 'Payable',
            description: bestMatch.description || ''
          };

          // Check if invoice number and amount match
          const invoiceNumberMatches = bestMatch.reference?.toLowerCase() === invoice.InvoiceNumber?.toLowerCase();
          const amountMatches = Math.abs(parseFloat(bestMatch.amount || 0) - parseFloat(invoice.Total || 0)) < 0.01;

          // Categorize match
          if (invoiceNumberMatches && amountMatches) {
            // Add to perfect matches
            enhancedData.perfectMatches.push({
              company1,
              company2
            });
            
            // Check for date mismatch
            const dateMismatch = findDateMismatch(company1, company2);
            if (dateMismatch) {
              enhancedData.dateMismatches.push({
                company1,
                company2,
                mismatchType: dateMismatch.type,
                company1Date: dateMismatch.date1,
                company2Date: dateMismatch.date2,
                daysDifference: dateMismatch.daysDifference
              });
            }
          } else {
            // Amounts or invoice numbers don't match
            enhancedData.mismatches.push({
              company1,
              company2
            });
            
            // Add to historical insights if the amounts differ significantly
            if (!amountMatches) {
              // Check if there might be a partial payment
              const amountDifference = Math.abs(parseFloat(company1.amount) - parseFloat(company2.amount));
              const isPotentialPartialPayment = parseFloat(company1.amount) > parseFloat(company2.amount);
              
              // Create a historical insight entry
              enhancedData.historicalInsights.push({
                apItem: company2,
                historicalMatch: company1,
                insight: {
                  severity: isPotentialPartialPayment ? 'warning' : 'error',
                  message: isPotentialPartialPayment ?
                    `Potential partial payment: AP shows ${formatCurrency(company2.amount)} vs. AR showing ${formatCurrency(company1.amount)} (difference of ${formatCurrency(amountDifference)})` :
                    `Amount mismatch: AP shows ${formatCurrency(company2.amount)} vs. AR showing ${formatCurrency(company1.amount)}`
                }
              });
            } else if (!invoiceNumberMatches) {
              // Invoice number mismatch
              enhancedData.historicalInsights.push({
                apItem: company2,
                historicalMatch: company1,
                insight: {
                  severity: 'info',
                  message: `Reference mismatch: AP reference '${company2.transactionNumber}' doesn't match AR invoice '${company1.transactionNumber}'`
                }
              });
            }
          }
        }
      });
    }

    // Find and add unmatched AP items
    if (rawResults.data && Array.isArray(rawResults.data)) {
      // Create a Set to track processed references
      const processedAPReferences = new Set();

      // Process each entry in the data array
      rawResults.data.forEach(item => {
        // Process each match in the matches array
        if (item.matches && Array.isArray(item.matches)) {
          item.matches.forEach(apItem => {
            // Only process if we haven't seen this reference before
            if (apItem.reference && !processedAPReferences.has(apItem.reference.toLowerCase())) {
              // Mark this reference as processed
              processedAPReferences.add(apItem.reference.toLowerCase());
              
              // Check if this AP reference was matched to an AR invoice
              if (!matchedAPReferences.has(apItem.reference.toLowerCase())) {
                // This AP item has no matching AR invoice - add to unmatched
                enhancedData.unmatchedItems.company2.push({
                  transactionNumber: apItem.reference,
                  amount: apItem.amount,
                  date: apItem.date,
                  status: apItem.status || 'Open',
                  type: 'Payable',
                  description: apItem.description || ''
                });
              }
            }
          });
        }
      });
    }

    // Calculate proper totals
    // Company1 (AR) total - already in the original data
    // Company2 (AP) total - sum all matched AP items
    let company2Total = 0;
    
    // Add up all AP amounts from perfect matches and mismatches
    [...enhancedData.perfectMatches, ...enhancedData.mismatches].forEach(item => {
      if (item.company2 && item.company2.amount) {
        company2Total += parseFloat(item.company2.amount) || 0;
      }
    });
    
    // Add unmatched AP items
    enhancedData.unmatchedItems.company2.forEach(item => {
      if (item.amount) {
        company2Total += parseFloat(item.amount) || 0;
      }
    });
    
    // Update the totals
    enhancedData.totals = {
      company1Total: rawResults.totals?.company1Total || 0,
      company2Total: company2Total,
      variance: (rawResults.totals?.company1Total || 0) - company2Total
    };

    return enhancedData;
  };

  // Function to find date mismatches between two otherwise matching items
  const findDateMismatch = (item1, item2) => {
    // Check transaction date mismatch
    if (item1.date && item2.date) {
      // Normalize date formats before comparison
      const date1 = dayjs(item1.date);
      const date2 = dayjs(item2.date);
      
      if (date1.isValid() && date2.isValid()) {
        const daysDifference = Math.abs(date1.diff(date2, 'day'));
        
        // If dates differ by more than 1 day, it's a mismatch
        if (daysDifference > 1) {
          return {
            type: 'transaction_date',
            date1: item1.date,
            date2: item2.date,
            daysDifference
          };
        }
      }
    }
    
    // Check due date mismatch
    if (item1.dueDate && item2.date) {
      const dueDate1 = dayjs(item1.dueDate);
      const date2 = dayjs(item2.date);
      
      if (dueDate1.isValid() && date2.isValid()) {
        const daysDifference = Math.abs(dueDate1.diff(date2, 'day'));
        
        // If due date and transaction date differ by more than 1 day, it's a mismatch
        if (daysDifference > 1) {
          return {
            type: 'due_date',
            date1: item1.dueDate,
            date2: item2.date,
            daysDifference
          };
        }
      }
    }
    
    return null; // No date mismatches found
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
            <p className="text-2xl font-bold">{formatCurrency(results.totals?.variance || 0)}</p>
          </div>
        </div>
      </div>

      <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
    </div>
  );
};

export default MatchResults;