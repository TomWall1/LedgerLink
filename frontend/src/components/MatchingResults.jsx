import React, { useRef } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

const MatchingResults = ({ matchResults }) => {
  const perfectMatchesRef = useRef(null);
  const mismatchesRef = useRef(null);
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
  
  // Calculate match statistics
  const perfectMatches = matches.filter(m => m.matches && m.matches.some(match => match.confidence >= 0.9));
  const partialMatches = matches.filter(m => m.matches && m.matches.some(match => match.confidence >= 0.5 && match.confidence < 0.9));
  const noMatches = matchResults?.unmatchedInvoices || [];
  
  // Calculate totals
  const totalInvoices = (perfectMatches.length + partialMatches.length + noMatches.length);
  const perfectMatchesAmount = perfectMatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const partialMatchesAmount = partialMatches.reduce((sum, m) => sum + parseFloat(m.invoice.Total || 0), 0);
  const noMatchesAmount = noMatches.reduce((sum, invoice) => sum + parseFloat(invoice.Total || 0), 0);
  const totalAmount = perfectMatchesAmount + partialMatchesAmount + noMatchesAmount;

  // Helper function to render a match
  const renderInvoiceMatch = (invoiceMatch) => {
    const invoice = invoiceMatch.invoice;
    const bestMatch = invoiceMatch.matches && invoiceMatch.matches.length > 0 ? 
      invoiceMatch.matches.sort((a, b) => b.confidence - a.confidence)[0] : null;
    
    const confidenceClass = bestMatch ? 
      (bestMatch.confidence >= 0.9 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') : 
      'bg-red-100 text-red-800';
      
    const confidenceText = bestMatch ? 
      (bestMatch.confidence >= 0.9 ? 'High Match' : 'Partial Match') : 
      'No Match';
      
    return (
      <div className="border rounded-lg overflow-hidden shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-primary">Invoice</h3>
            <div className="text-sm">
              <p><span className="font-medium">Invoice #:</span> {invoice.InvoiceNumber || 'N/A'}</p>
              <p><span className="font-medium">Amount:</span> {formatCurrency(invoice.Total)}</p>
              <p><span className="font-medium">Date:</span> {formatDate(invoice.Date)}</p>
              <p><span className="font-medium">Customer:</span> {invoice.CustomerName || 'N/A'}</p>
            </div>
          </div>
          
          {bestMatch && (
            <div className="space-y-2">
              <h3 className="font-medium text-primary">Transaction Match</h3>
              <div className="text-sm">
                <p><span className="font-medium">Reference:</span> {bestMatch.reference || 'N/A'}</p>
                <p><span className="font-medium">Amount:</span> {formatCurrency(bestMatch.amount)}</p>
                <p><span className="font-medium">Date:</span> {formatDate(bestMatch.date)}</p>
                <p><span className="font-medium">Description:</span> {bestMatch.description || 'N/A'}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium text-primary">Match Status</h3>
            <div className="text-sm">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${confidenceClass}`}>
                {confidenceText}
              </span>
              
              {bestMatch && (
                <p className="mt-2">
                  <span className="font-medium">Confidence Score:</span> {(bestMatch.confidence * 100).toFixed(0)}%
                </p>
              )}
              
              <div className="mt-4">
                <button className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-opacity-90 transition-colors">
                  {bestMatch ? 'Approve Match' : 'Find Manually'}
                </button>
              </div>
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
          <thead className="bg-primary bg-opacity-5 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">
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
          <h3 className="text-lg font-semibold mb-2 text-primary">Total Invoices</h3>
          <p className="text-3xl font-bold text-secondary">{totalInvoices}</p>
          <p className="text-sm text-gray-600 mt-2">{formatCurrency(totalAmount)}</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-green-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-primary">Perfect Matches</h3>
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
          <h3 className="text-lg font-semibold text-primary">Partial Matches</h3>
          <p className="text-3xl font-bold text-yellow-500">{partialMatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(partialMatchesAmount)}
            <br />
            ({formatPercentage(partialMatchesAmount, totalAmount)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-red-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-primary">No Matches</h3>
          <p className="text-3xl font-bold text-red-500">{noMatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(noMatchesAmount)}
            <br />
            ({formatPercentage(noMatchesAmount, totalAmount)})
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Perfect Matches ({perfectMatches.length})</h2>
          <button className="text-primary hover:text-secondary transition-colors">
            Export CSV
          </button>
        </div>
        <div className="space-y-4">
          {perfectMatches.length > 0 ? (
            perfectMatches.map((match, index) => (
              <div key={index}>
                {renderInvoiceMatch(match)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No perfect matches found.</p>
          )}
        </div>
      </div>

      {/* Partial Matches Section */}
      <div ref={mismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Partial Matches ({partialMatches.length})</h2>
          <button className="text-primary hover:text-secondary transition-colors">
            Export CSV
          </button>
        </div>
        <div className="space-y-4">
          {partialMatches.length > 0 ? (
            partialMatches.map((match, index) => (
              <div key={index}>
                {renderInvoiceMatch(match)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No partial matches found.</p>
          )}
        </div>
      </div>

      {/* No Matches Section */}
      <div ref={unmatchedRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Unmatched Invoices ({noMatches.length})</h2>
          <button className="text-primary hover:text-secondary transition-colors">
            Export CSV
          </button>
        </div>
        {noMatches.length > 0 ? (
          <ResultTable
            data={noMatches.map(invoice => ({
              'Invoice #': invoice.InvoiceNumber || 'N/A',
              'Customer': invoice.CustomerName || 'N/A',
              'Amount': formatCurrency(invoice.Total),
              'Date': formatDate(invoice.Date),
              'Status': (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  No Match
                </span>
              ),
              'Action': (
                <button className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-opacity-90 transition-colors">
                  Find Manually
                </button>
              )
            }))}
            columns={['Invoice #', 'Customer', 'Amount', 'Date', 'Status', 'Action']}
          />
        ) : (
          <p className="text-gray-500 italic">No unmatched invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default MatchingResults;