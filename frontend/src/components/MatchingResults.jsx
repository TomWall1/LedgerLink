import React, { useRef } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

const MatchingResults = ({ matchResults }) => {
  const perfectMatchesRef = useRef(null);
  const mismatchesRef = useRef(null);
  const unmatchedRef = useRef(null);
  const dateMismatchesRef = useRef(null);
  const historicalInsightsRef = useRef(null);

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
  
  // Process and categorize matches
  const perfectMatches = [];
  const mismatches = [];
  const dateMismatches = [];
  const historicalInsights = [];
  
  // Get unmatched invoices
  const unmatchedInvoices = matchResults?.unmatchedInvoices || [];
  
  // Calculate AP total
  const calculateApTotal = () => {
    let total = 0;
    
    // Sum amounts from all match.bestMatch entries
    matches.forEach(match => {
      if (match.matches && match.matches.length > 0) {
        const bestMatch = match.matches.sort((a, b) => b.confidence - a.confidence)[0];
        if (bestMatch && bestMatch.amount) {
          total += parseFloat(bestMatch.amount) || 0;
        }
      }
    });
    
    return total;
  };

  // Process matches
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
      
      // Calculate days difference for date mismatches
      let daysDifference = null;
      if (datesValid && !dateMatches) {
        daysDifference = Math.abs(invoiceDate - matchDate) / (1000 * 60 * 60 * 24);
      }

      // Categorize match
      if (invoiceNumberMatches && amountMatches) {
        // Check for date mismatch
        if (!dateMatches && datesValid) {
          // Add to date mismatches section
          dateMismatches.push({
            invoice,
            bestMatch,
            mismatchType: 'date',
            daysDifference,
            company1Date: invoice.Date,
            company2Date: bestMatch.date
          });
        }
        
        // Add to perfect matches if all match
        if (dateMatches) {
          perfectMatches.push({ invoice, bestMatch });
        } else {
          // If amounts match but dates don't, still consider it a perfect match by transaction number
          perfectMatches.push({ invoice, bestMatch });
        }
      } else {
        // Amounts or invoice numbers don't match
        mismatches.push({ invoice, bestMatch });
        
        // Add to historical insights if the amounts differ significantly
        if (!amountMatches) {
          // Create a historical insight entry
          historicalInsights.push({
            apItem: bestMatch,
            historicalMatch: invoice,
            insight: {
              severity: 'warning',
              message: `Amount mismatch: AP shows ${formatCurrency(bestMatch.amount)} vs. AR showing ${formatCurrency(invoice.Total)}`
            }
          });
        }
      }
    }
  });
  
  // Calculate totals
  const totalInvoices = perfectMatches.length + mismatches.length + unmatchedInvoices.length;
  const perfectMatchesAmount = perfectMatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const mismatchesAmount = mismatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const unmatchedAmount = unmatchedInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.Total || 0), 0);
  const totalAmount = perfectMatchesAmount + mismatchesAmount + unmatchedAmount;

  // Calculate totals for display
  const company1Total = perfectMatchesAmount + mismatchesAmount + unmatchedAmount; // AR Total
  const company2Total = calculateApTotal(); // AP Total
  const variance = company1Total - company2Total;

  // Helper function to get badge style based on severity
  const getInsightBadgeClass = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
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
      {/* Totals Cards with Export All Data Button */}
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Accounts Receivable Total</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(company1Total)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Accounts Payable Total</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(company2Total)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">Variance</h3>
            <p className={`text-3xl font-bold ${Math.abs(variance) < 0.01 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(variance)}
            </p>
          </div>
        </div>
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-green-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Perfect Matches</h3>
          <p className="text-3xl font-bold text-green-500">{perfectMatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(perfectMatchesAmount)}
            <br />
            ({formatPercentage(perfectMatchesAmount, totalAmount)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-yellow-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-500">{mismatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(mismatchesAmount)}
            <br />
            ({formatPercentage(mismatchesAmount, totalAmount)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-red-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-500">{unmatchedInvoices.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(unmatchedAmount)}
            <br />
            ({formatPercentage(unmatchedAmount, totalAmount)})
          </p>
        </div>

        <div 
          className={`bg-white rounded-lg shadow-lg p-6 border-l-4 border ${dateMismatches.length > 0 ? 'border-purple-400 cursor-pointer hover:bg-gray-50' : 'border-gray-300'} transition-colors`}
          onClick={() => dateMismatches.length > 0 && scrollToSection(dateMismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Date Discrepancies</h3>
          <p className={`text-3xl font-bold ${dateMismatches.length > 0 ? 'text-purple-500' : 'text-gray-400'}`}>
            {dateMismatches.length}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {dateMismatches.length > 0 ? 'Date differences in matched transactions' : 'No date discrepancies found'}
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Perfect Matches ({perfectMatches.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <ResultTable
          data={perfectMatches.map(match => ({
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

      {/* Mismatches Section */}
      {mismatches.length > 0 && (
        <div ref={mismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">Mismatches ({mismatches.length})</h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <ResultTable
            data={mismatches.map(mismatch => {
              // Extract the amounts with proper handling for null/undefined values
              const receivableAmount = Math.abs(parseFloat(mismatch.invoice?.Total || 0));
              const payableAmount = Math.abs(parseFloat(mismatch.bestMatch?.amount || 0));
              
              // Calculate absolute difference between absolute values of amounts
              const difference = Math.abs(receivableAmount - payableAmount);
              
              return {
                'Transaction #': mismatch.bestMatch?.reference || mismatch.invoice?.InvoiceNumber || 'N/A',
                'Type': mismatch.invoice?.Type || 'Invoice',
                'Receivable Amount': formatCurrency(mismatch.invoice?.Total || 0),
                'Payable Amount': formatCurrency(mismatch.bestMatch?.amount || 0),
                'Difference': formatCurrency(difference),
                'Date': formatDate(mismatch.invoice?.Date),
                'Status': mismatch.invoice?.Status || 'N/A'
              };
            })}
            columns={['Transaction #', 'Type', 'Receivable Amount', 'Payable Amount', 'Difference', 'Date', 'Status']}
          />
        </div>
      )}

      {/* Date Mismatches Section */}
      {dateMismatches.length > 0 && (
        <div ref={dateMismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 border-l-4 border-l-purple-400">
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
              'AR Date': formatDate(match.company1Date),
              'AP Date': formatDate(match.company2Date),
              'Days Difference': match.daysDifference !== null ? Math.round(match.daysDifference) : 'N/A'
            }))}
            columns={['Transaction #', 'Type', 'Amount', 'AR Date', 'AP Date', 'Days Difference']}
          />
        </div>
      )}

      {/* Unmatched Items Section */}
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

      {/* Historical Insights Section */}
      {historicalInsights.length > 0 && (
        <div ref={historicalInsightsRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Historical Insights for AP Items ({historicalInsights.length})
            </h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <div className="space-y-4">
            {historicalInsights.map((insight, index) => {
              const badgeClass = getInsightBadgeClass(insight.insight.severity);
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-700">AP Item</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Transaction #:</span> {insight.apItem?.reference || 'N/A'}</p>
                        <p><span className="font-medium">Amount:</span> {formatCurrency(insight.apItem?.amount || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.apItem?.date)}</p>
                        <p><span className="font-medium">Description:</span> {insight.apItem?.description || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-700">AR Item</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Invoice #:</span> {insight.historicalMatch?.InvoiceNumber || 'N/A'}</p>
                        <p><span className="font-medium">Original Amount:</span> {formatCurrency(insight.historicalMatch?.Total || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.historicalMatch?.Date)}</p>
                        <p><span className="font-medium">Status:</span> {insight.historicalMatch?.Status || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-700">Insight</h3>
                      <div className={`text-sm px-3 py-2 rounded-md border ${badgeClass}`}>
                        {insight.insight?.message || 'No additional insights available'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingResults;