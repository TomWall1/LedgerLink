import React, { useRef, useState } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

const MatchingResults = ({ matchResults }) => {
  const exactMatchesRef = useRef(null);
  const dateMismatchesRef = useRef(null);
  const unmatchedRef = useRef(null);

  const formatPercentage = (amount, total) => {
    if (!amount || !total) return '0%';
    const numAmount = parseFloat(amount);
    const numTotal = parseFloat(total);
    if (isNaN(numAmount) || isNaN(numTotal) || numTotal === 0) return '0%';
    return ((numAmount / numTotal) * 100).toFixed(2) + '%';
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ensure data is available and properly structured
  const matches = matchResults?.data || [];
  
  // Process and categorize matches
  const exactMatches = [];
  const dateMismatches = [];
  
  // Categorize matches based on invoice number, amount, and date
  matches.forEach(match => {
    if (match.matches && match.matches.length > 0) {
      const bestMatch = match.matches.sort((a, b) => b.confidence - a.confidence)[0];
      const invoice = match.invoice;
      
      // Check if invoice number and amount match
      const invoiceNumberMatches = bestMatch.reference?.toLowerCase() === invoice.InvoiceNumber?.toLowerCase();
      const amountMatches = Math.abs(parseFloat(bestMatch.amount) - parseFloat(invoice.Total)) < 0.01; // Small tolerance for rounding
      
      // Extract dates for comparison
      const invoiceDate = new Date(invoice.Date);
      const matchDate = new Date(bestMatch.date);
      
      // Check if dates are valid before comparing
      const datesValid = !isNaN(invoiceDate.getTime()) && !isNaN(matchDate.getTime());
      const dateMatches = datesValid ? 
        Math.abs(invoiceDate.getTime() - matchDate.getTime()) < 86400000 : // 1 day tolerance
        false;
      
      // If both invoice number and amount match, categorize based on date match
      if (invoiceNumberMatches && amountMatches) {
        if (dateMatches) {
          exactMatches.push({ ...match, bestMatch });
        } else {
          dateMismatches.push({ ...match, bestMatch, mismatchType: 'date' });
        }
      } else {
        // Currently only supporting exact matches on invoice number and amount
        // Other partial matches are not displayed
      }
    }
  });
  
  // Get unmatched invoices
  const unmatchedInvoices = matchResults?.unmatchedInvoices || [];
  
  // Calculate totals
  const totalInvoices = exactMatches.length + dateMismatches.length + unmatchedInvoices.length;
  const exactMatchesAmount = exactMatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const dateMismatchesAmount = dateMismatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const unmatchedAmount = unmatchedInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.Total || 0), 0);
  const totalAmount = exactMatchesAmount + dateMismatchesAmount + unmatchedAmount;

  // Helper function to render a match
  const renderInvoiceMatch = (match) => {
    const invoice = match.invoice;
    const bestMatch = match.bestMatch;
    
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">AR (ERP)</h3>
            <div className="text-sm">
              <p><span className="font-medium">Invoice #:</span> {invoice.InvoiceNumber || 'N/A'}</p>
              <p><span className="font-medium">Amount:</span> {formatCurrency(invoice.Total)}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoice.Date)}</p>
              <p><span className="font-medium">Due Date:</span> {formatDate(invoice.DueDate)}</p>
              <p><span className="font-medium">Customer:</span> {invoice.CustomerName || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">AP (CSV)</h3>
            <div className="text-sm">
              <p><span className="font-medium">Reference:</span> {bestMatch.reference || 'N/A'}</p>
              <p><span className="font-medium">Amount:</span> {formatCurrency(bestMatch.amount)}</p>
              <p><span className="font-medium">Date:</span> {formatDate(bestMatch.date)}</p>
              <p><span className="font-medium">Description:</span> {bestMatch.description || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Table component for consistent styling
  const ResultTable = ({ title, data, columns }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-blue-700">Total Invoices</h3>
          <p className="text-3xl font-bold text-blue-800">{totalInvoices}</p>
          <p className="text-sm text-gray-600 mt-2">{formatCurrency(totalAmount)}</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-green-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(exactMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Exact Matches</h3>
          <p className="text-3xl font-bold text-green-500">{exactMatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(exactMatchesAmount)}
            <br />
            ({formatPercentage(exactMatchesAmount, totalAmount)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-yellow-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(dateMismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Date Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-500">{dateMismatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(dateMismatchesAmount)}
            <br />
            ({formatPercentage(dateMismatchesAmount, totalAmount)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-red-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">No Matches</h3>
          <p className="text-3xl font-bold text-red-500">{unmatchedInvoices.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(unmatchedAmount)}
            <br />
            ({formatPercentage(unmatchedAmount, totalAmount)})
          </p>
        </div>
      </div>

      {/* Exact Matches Section */}
      <div ref={exactMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Exact Matches ({exactMatches.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <div className="space-y-4">
          {exactMatches.length > 0 ? (
            exactMatches.map((match, index) => (
              <div key={index}>
                {renderInvoiceMatch(match)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No exact matches found.</p>
          )}
        </div>
      </div>

      {/* Date Mismatches Section */}
      <div ref={dateMismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Date Mismatches ({dateMismatches.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <div className="space-y-4">
          {dateMismatches.length > 0 ? (
            dateMismatches.map((match, index) => (
              <div key={index}>
                {renderInvoiceMatch(match)}
                <div className="-mt-2 mb-4 ml-4 text-sm text-yellow-600">
                  <p>
                    <span className="font-medium">Note:</span> The invoice number and amount match, but the dates don't match.
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No date mismatches found.</p>
          )}
        </div>
      </div>

      {/* No Matches Section */}
      <div ref={unmatchedRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Unmatched Invoices ({unmatchedInvoices.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        {unmatchedInvoices.length > 0 ? (
          <ResultTable
            data={unmatchedInvoices.map(invoice => ({
              'Invoice #': invoice.InvoiceNumber || 'N/A',
              'Customer': invoice.CustomerName || 'N/A',
              'Amount': formatCurrency(invoice.Total),
              'Date': formatDate(invoice.Date),
              'Due Date': formatDate(invoice.DueDate),
              'Status': (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  No Match
                </span>
              )
            }))}
            columns={['Invoice #', 'Customer', 'Amount', 'Date', 'Due Date', 'Status']}
          />
        ) : (
          <p className="text-gray-500 italic">No unmatched invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default MatchingResults;