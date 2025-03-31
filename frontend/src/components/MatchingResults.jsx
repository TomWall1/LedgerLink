import React, { useRef } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

const MatchingResults = ({ matchResults }) => {
  const perfectMatchesRef = useRef(null);
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

  // Helper function to normalize dates to their date parts only (remove time)
  const normalizeDateForComparison = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      // Handle .NET JSON date format: "/Date(1728950400000+0000)/"
      if (typeof dateStr === 'string' && dateStr.startsWith('/Date(') && dateStr.includes('+')) {
        const timestamp = parseInt(dateStr.substring(6, dateStr.indexOf('+')));
        if (!isNaN(timestamp)) {
          const date = new Date(timestamp);
          return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        }
      }
      
      // Handle the specific format "27T00:00:00.000Z/10/2024"
      if (typeof dateStr === 'string' && dateStr.includes('T') && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 2) {
          const day = parseInt(parts[0].split('T')[0]);
          const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
          const year = parts.length > 2 ? parseInt(parts[2]) : new Date().getFullYear();
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day).getTime();
          }
        }
      }
      
      // Standard date parsing for other formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      }
      
      return null;
    } catch (error) {
      console.error('Error normalizing date:', error, 'Date value:', dateStr);
      return null;
    }
  };

  // Ensure data is available and properly structured
  const matches = matchResults?.data || [];
  
  // Process and categorize matches based on invoice number and amount
  const exactMatches = [];
  const dateMismatches = [];
  
  matches.forEach(match => {
    if (match.matches && match.matches.length > 0) {
      const bestMatch = match.matches.sort((a, b) => b.confidence - a.confidence)[0];
      const invoice = match.invoice;
      
      // Check if invoice number and amount match
      const invoiceNumberMatches = bestMatch.reference?.toLowerCase() === invoice.InvoiceNumber?.toLowerCase();
      const amountMatches = Math.abs(parseFloat(bestMatch.amount) - parseFloat(invoice.Total)) < 0.01; // Small tolerance for rounding
      
      // Normalize dates for comparison (just the date part, no time)
      const invoiceDate = normalizeDateForComparison(invoice.Date);
      const matchDate = normalizeDateForComparison(bestMatch.date);
      
      // Check if both dates are valid for comparison
      const datesValid = invoiceDate !== null && matchDate !== null;
      
      // Dates match if they refer to the same calendar day (regardless of time)
      const dateMatches = datesValid ? (invoiceDate === matchDate) : false;
      
      // If both invoice number and amount match, categorize based on date match
      if (invoiceNumberMatches && amountMatches) {
        if (dateMatches) {
          exactMatches.push({ ...match, bestMatch });
        } else {
          // Calculate days difference if possible
          let daysDifference = null;
          if (datesValid) {
            daysDifference = Math.abs(invoiceDate - matchDate) / (1000 * 60 * 60 * 24);
          }
          
          dateMismatches.push({ 
            ...match, 
            bestMatch, 
            mismatchType: 'date',
            daysDifference
          });
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
          onClick={() => scrollToSection(perfectMatchesRef)}
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
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Exact Matches ({exactMatches.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <ResultTable
          data={exactMatches.map(match => ({
            'Transaction #': match.bestMatch?.reference || match.invoice?.InvoiceNumber || 'N/A',
            'Type': match.invoice?.Type || 'Invoice',
            'Amount': formatCurrency(match.invoice?.Total || 0),
            'Date': formatDate(match.invoice?.Date),
            'Due Date': formatDate(match.invoice?.DueDate),
            'Status': match.invoice?.Status || 'N/A'
          }))}
          columns={['Transaction #', 'Type', 'Amount', 'Date', 'Due Date', 'Status']}
        />
      </div>

      {/* Date Mismatches Section */}
      {dateMismatches.length > 0 && (
        <div ref={dateMismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 border-l-4 border-l-yellow-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Date Discrepancies in Matched Transactions ({dateMismatches.length})
            </h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <p className="mb-4 text-sm text-gray-700">
            These transactions are matched based on transaction numbers and amounts, but have discrepancies in their dates.
          </p>
          <ResultTable
            data={dateMismatches.map(match => ({
              'Transaction #': match.bestMatch?.reference || match.invoice?.InvoiceNumber || 'N/A',
              'Type': match.invoice?.Type || 'Invoice',
              'Amount': formatCurrency(match.invoice?.Total || 0),
              'AR Date': formatDate(match.invoice?.Date),
              'AP Date': formatDate(match.bestMatch?.date),
              'Days Difference': match.daysDifference !== null ? Math.round(match.daysDifference) : 'N/A'
            }))}
            columns={['Transaction #', 'Type', 'Amount', 'AR Date', 'AP Date', 'Days Difference']}
          />
        </div>
      )}

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
                  {invoice.Status || 'No Match'}
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