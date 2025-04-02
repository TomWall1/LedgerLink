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
        
        // DEBUG: Log the raw data structure to console
        console.log('Raw session data:', parsedResults);
        
        // Create a simulated structure that matches what the reference implementation expects
        const simulatedResults = createSimulatedResults(parsedResults);
        console.log('Simulated results:', simulatedResults);
        
        setResults(simulatedResults);
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

  // Function to create a structure that matches the reference implementation
  const createSimulatedResults = (rawData) => {
    // Initiate the structure
    const simulatedData = {
      ...rawData,
      perfectMatches: [],
      mismatches: [],
      dateMismatches: [],
      unmatchedItems: {
        company1: [],
        company2: []
      },
      historicalInsights: []
    };

    // Track all AP items for finding unmatched ones
    const allAPItems = [];
    const matchedAPRefs = new Set();

    // If there are unmatched AR invoices, add them to company1
    if (rawData.unmatchedInvoices && Array.isArray(rawData.unmatchedInvoices)) {
      simulatedData.unmatchedItems.company1 = rawData.unmatchedInvoices.map(invoice => ({
        transactionNumber: invoice.InvoiceNumber,
        amount: invoice.Total,
        date: invoice.Date,
        dueDate: invoice.DueDate,
        status: invoice.Status || 'Open',
        type: invoice.Type || 'Invoice'
      }));
    }

    // Process all matches
    if (rawData.data && Array.isArray(rawData.data)) {
      rawData.data.forEach(matchEntry => {
        if (!matchEntry.invoice || !matchEntry.matches || !Array.isArray(matchEntry.matches)) {
          return; // Skip invalid entries
        }

        const invoice = matchEntry.invoice;
        
        // Collect all AP items for later processing
        matchEntry.matches.forEach(match => {
          allAPItems.push(match);
        });

        // Find the best match based on confidence
        if (matchEntry.matches.length > 0) {
          const bestMatch = matchEntry.matches.sort((a, b) => b.confidence - a.confidence)[0];
          
          // Convert to our standard objects
          const company1 = {
            transactionNumber: invoice.InvoiceNumber,
            amount: parseFloat(invoice.Total),
            date: invoice.Date,
            dueDate: invoice.DueDate,
            status: invoice.Status || 'Open',
            type: invoice.Type || 'Invoice'
          };

          const company2 = {
            transactionNumber: bestMatch.reference,
            amount: parseFloat(bestMatch.amount),
            date: bestMatch.date,
            status: 'Open',
            type: 'Payable',
            description: bestMatch.description || ''
          };

          // Mark this AP reference as matched
          if (bestMatch.reference) {
            matchedAPRefs.add(bestMatch.reference.toLowerCase());
          }

          // Check if this is a perfect match or a mismatch
          if (isExactMatch(invoice, bestMatch)) {
            // It's a perfect match
            simulatedData.perfectMatches.push({ company1, company2 });
            
            // Check for date discrepancies
            const dateMismatch = checkDateMismatch(invoice, bestMatch);
            if (dateMismatch) {
              simulatedData.dateMismatches.push({
                company1,
                company2,
                mismatchType: dateMismatch.type,
                company1Date: dateMismatch.date1,
                company2Date: dateMismatch.date2,
                daysDifference: dateMismatch.daysDifference
              });
            }
          } else {
            // It's a mismatch
            simulatedData.mismatches.push({ company1, company2 });
            
            // Add to historical insights
            const invoiceAmount = parseFloat(invoice.Total || 0);
            const matchAmount = parseFloat(bestMatch.amount || 0);
            
            if (Math.abs(invoiceAmount - matchAmount) > 0.01) {
              // Amount mismatch
              simulatedData.historicalInsights.push({
                apItem: company2,
                historicalMatch: company1,
                insight: {
                  severity: 'warning',
                  message: `Amount mismatch: AP shows ${formatCurrency(matchAmount)} vs. AR showing ${formatCurrency(invoiceAmount)}`
                }
              });
            } else {
              // Reference number mismatch
              simulatedData.historicalInsights.push({
                apItem: company2,
                historicalMatch: company1,
                insight: {
                  severity: 'info',
                  message: `Reference mismatch: AP reference '${bestMatch.reference}' doesn't match AR invoice '${invoice.InvoiceNumber}'`
                }
              });
            }
          }
        }
      });
    }

    // Find unmatched AP items
    const unmatchedAP = allAPItems.filter(item => 
      item.reference && !matchedAPRefs.has(item.reference.toLowerCase())
    );
    
    // Add all unmatched AP items to company2
    unmatchedAP.forEach(apItem => {
      simulatedData.unmatchedItems.company2.push({
        transactionNumber: apItem.reference,
        amount: parseFloat(apItem.amount),
        date: apItem.date,
        status: 'Open',
        type: 'Payable',
        description: apItem.description || ''
      });
    });

    // Calculate AP total
    let apTotal = 0;
    
    // Add amounts from perfect matches
    simulatedData.perfectMatches.forEach(match => {
      apTotal += match.company2.amount || 0;
    });
    
    // Add amounts from mismatches
    simulatedData.mismatches.forEach(match => {
      apTotal += match.company2.amount || 0;
    });
    
    // Add amounts from unmatched AP items
    simulatedData.unmatchedItems.company2.forEach(item => {
      apTotal += item.amount || 0;
    });

    // Set the totals
    simulatedData.totals = {
      company1Total: rawData.totals?.company1Total || 0,
      company2Total: apTotal,
      variance: (rawData.totals?.company1Total || 0) - apTotal
    };

    // Log the counts
    console.log('Generated results counts:', {
      perfectMatches: simulatedData.perfectMatches.length,
      mismatches: simulatedData.mismatches.length,
      dateMismatches: simulatedData.dateMismatches.length,
      unmatchedAR: simulatedData.unmatchedItems.company1.length,
      unmatchedAP: simulatedData.unmatchedItems.company2.length,
      historicalInsights: simulatedData.historicalInsights.length
    });

    return simulatedData;
  };

  // Helper function to check if an invoice and match are an exact match
  const isExactMatch = (invoice, match) => {
    // For an exact match, both numbers and amounts must match exactly
    const numbersMatch = invoice.InvoiceNumber?.toLowerCase() === match.reference?.toLowerCase();
    const amountsMatch = Math.abs(parseFloat(invoice.Total || 0) - parseFloat(match.amount || 0)) < 0.01;
    
    return numbersMatch && amountsMatch;
  };

  // Helper function to check for date mismatches
  const checkDateMismatch = (invoice, match) => {
    // Helper to convert string to date and get days since epoch
    const getDays = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
    };

    // Check transaction date mismatch
    const invoiceDays = getDays(invoice.Date);
    const matchDays = getDays(match.date);
    
    if (invoiceDays !== null && matchDays !== null) {
      const daysDifference = Math.abs(invoiceDays - matchDays);
      if (daysDifference > 1) { // More than one day difference
        return {
          type: 'transaction_date',
          date1: invoice.Date,
          date2: match.date,
          daysDifference
        };
      }
    }

    // Check due date mismatch
    const dueDays = getDays(invoice.DueDate);
    if (dueDays !== null && matchDays !== null) {
      const daysDifference = Math.abs(dueDays - matchDays);
      if (daysDifference > 1) { // More than one day difference
        return {
          type: 'due_date',
          date1: invoice.DueDate,
          date2: match.date,
          daysDifference
        };
      }
    }

    return null; // No date mismatch
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