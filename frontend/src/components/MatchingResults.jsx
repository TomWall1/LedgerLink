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

  // Ensure arrays and objects exist
  const safeMatchResults = matchResults || {};
  const safePerfectMatches = Array.isArray(safeMatchResults.perfectMatches) ? safeMatchResults.perfectMatches : [];
  const safeMismatches = Array.isArray(safeMatchResults.mismatches) ? safeMatchResults.mismatches : [];
  const safeUnmatchedItems = safeMatchResults.unmatchedItems || { company1: [], company2: [] };
  const safeHistoricalInsights = Array.isArray(safeMatchResults.historicalInsights) ? safeMatchResults.historicalInsights : [];
  const safeDateMismatches = Array.isArray(safeMatchResults.dateMismatches) ? safeMatchResults.dateMismatches : [];
  const safeTotals = safeMatchResults.totals || { company1Total: 0, company2Total: 0, variance: 0 };

  console.log('Historical insights:', safeHistoricalInsights);

  // Safe amount calculations
  const calculateAmount = (item) => {
    if (!item) return 0;
    const amount = parseFloat(item.amount || item.Total || 0);
    return isNaN(amount) ? 0 : amount;
  };

  // Calculate total amounts for each category
  const perfectMatchAmount = safePerfectMatches.reduce((sum, match) => {
    const amount = match && match.company1 ? calculateAmount(match.company1) : 0;
    return sum + amount;
  }, 0);

  const mismatchAmount = safeMismatches.reduce((sum, match) => {
    const amount = match && match.company1 ? calculateAmount(match.company1) : 0;
    return sum + amount;
  }, 0);

  const unmatchedAmount = [
    ...(safeUnmatchedItems.company1 || []),
    ...(safeUnmatchedItems.company2 || [])
  ].reduce((sum, item) => sum + calculateAmount(item), 0);

  // Safe total receivables calculation
  const totalReceivables = parseFloat(safeTotals.company1Total || 0);

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

  // Helper to check if an item has partial payment and return a badge if it does
  const getPartialPaymentBadge = (item) => {
    if (!item || !item.is_partially_paid) return null;
    
    const originalAmount = parseFloat(item.original_amount || 0);
    const amountPaid = parseFloat(item.amount_paid || 0);
    const remainingAmount = parseFloat(item.amount || 0);
    
    return (
      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Partially Paid: {formatCurrency(amountPaid)} of {formatCurrency(originalAmount)}
      </span>
    );
  };

  // Status badge for Paid/Open status
  const getStatusBadge = (status) => {
    if (!status) return null;
    
    let bgClass = '';
    switch(status.toUpperCase()) {
      case 'PAID':
        bgClass = 'bg-green-100 text-green-800';
        break;
      case 'AUTHORISED':
      case 'SENT':
      case 'OPEN':
        bgClass = 'bg-blue-100 text-blue-800';
        break;
      case 'VOIDED':
        bgClass = 'bg-red-100 text-red-800';
        break;
      case 'DRAFT':
        bgClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        bgClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`}>
        {status}
      </span>
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
      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-green-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Perfect Matches</h3>
          <p className="text-3xl font-bold text-green-500">{safePerfectMatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(perfectMatchAmount)}
            <br />
            ({formatPercentage(perfectMatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-yellow-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-500">{safeMismatches.length}</p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(mismatchAmount)}
            <br />
            ({formatPercentage(mismatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-red-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-blue-700">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-500">
            {(safeUnmatchedItems.company1?.length || 0) + (safeUnmatchedItems.company2?.length || 0)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {formatCurrency(unmatchedAmount)}
            <br />
            ({formatPercentage(unmatchedAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className={`bg-white rounded-lg shadow-lg p-6 border-l-4 border ${safeDateMismatches.length > 0 ? 'border-purple-400 cursor-pointer hover:bg-gray-50' : safeHistoricalInsights.length > 0 ? 'border-amber-400 cursor-pointer hover:bg-gray-50' : 'border-gray-300'} transition-colors`}
          onClick={() => {
            if (safeDateMismatches.length > 0) {
              scrollToSection(dateMismatchesRef);
            } else if (safeHistoricalInsights.length > 0) {
              scrollToSection(historicalInsightsRef);
            }
          }}
        >
          <h3 className="text-lg font-semibold text-blue-700">
            {safeDateMismatches.length > 0 ? 'Date Discrepancies' : 'Historical Insights'}
          </h3>
          <p className={`text-3xl font-bold ${safeDateMismatches.length > 0 ? 'text-purple-500' : safeHistoricalInsights.length > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
            {safeDateMismatches.length > 0 ? safeDateMismatches.length : safeHistoricalInsights.length}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {safeDateMismatches.length > 0 
              ? 'Date differences in matched transactions' 
              : safeHistoricalInsights.length > 0 
                ? 'Historical data for reconciliation' 
                : 'No historical data found'}
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Perfect Matches ({safePerfectMatches.length})</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <ResultTable
          data={safePerfectMatches.map(match => {
            // Check for partial payment badge
            const partialPaymentBadge = match.company1?.is_partially_paid ? 
              getPartialPaymentBadge(match.company1) : 
              (match.company2?.is_partially_paid ? getPartialPaymentBadge(match.company2) : null);

            // Get status badge
            const statusBadge = getStatusBadge(match.company1?.status || match.company2?.status);
              
            return {
              'Transaction #': (
                <div className="flex items-center">
                  <span>{match?.company1?.transactionNumber || match?.company2?.transactionNumber || 'N/A'}</span>
                  {partialPaymentBadge}
                  {statusBadge}
                </div>
              ),
              'Type': match?.company1?.type || match?.company2?.type || 'N/A',
              'Amount': formatCurrency(match?.company1?.amount || 0),
              'Date': formatDate(match?.company1?.date || match?.company2?.date),
              'Due Date': formatDate(match?.company1?.dueDate || match?.company2?.dueDate),
              'Status': match?.company1?.status || match?.company2?.status || 'N/A'
            };
          })}
          columns={['Transaction #', 'Type', 'Amount', 'Date', 'Due Date', 'Status']}
        />
      </div>

      {/* Mismatches Section */}
      {safeMismatches.length > 0 && (
        <div ref={mismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">Mismatches ({safeMismatches.length})</h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <ResultTable
            data={safeMismatches.map(mismatch => {
              // Determine if the invoice is paid
              const isInvoicePaid = mismatch.company1?.is_paid || mismatch.company1?.status === 'PAID';
              const isAPPaid = mismatch.company2?.is_paid || mismatch.company2?.status === 'PAID';
              
              // Extract the amounts with proper handling for null/undefined values
              const receivableAmount = Math.abs(parseFloat(mismatch?.company1?.amount || 0));
              const originalAmount = Math.abs(parseFloat(mismatch?.company1?.original_amount || receivableAmount));
              const payableAmount = Math.abs(parseFloat(mismatch?.company2?.amount || 0));
              
              // For paid items, show $0 instead of the original amount
              const displayReceivableAmount = isInvoicePaid ? 0 : receivableAmount;
              const displayPayableAmount = isAPPaid ? 0 : payableAmount;
              
              // Calculate difference - if one is paid and one is open, the difference is the original amount
              let difference;
              if (isInvoicePaid && !isAPPaid) {
                difference = payableAmount; // Company1 is paid, Company2 is open
              } else if (!isInvoicePaid && isAPPaid) {
                difference = receivableAmount; // Company1 is open, Company2 is paid
              } else {
                difference = Math.abs(receivableAmount - payableAmount);
              }
              
              // Check for partial payment information
              const partialPaymentBadge = mismatch.company1?.is_partially_paid ? 
                getPartialPaymentBadge(mismatch.company1) : 
                (mismatch.company2?.is_partially_paid ? getPartialPaymentBadge(mismatch.company2) : null);
              
              // Get status badges
              const ar_statusBadge = getStatusBadge(mismatch.company1?.status);
              const ap_statusBadge = getStatusBadge(mismatch.company2?.status);
              
              // Prepare payment info display with historical context
              let paymentInfo = null;
              let historyNote = null;
              
              if (mismatch.company1?.payment_date || mismatch.company2?.payment_date) {
                const paymentDate = mismatch.company1?.payment_date || mismatch.company2?.payment_date;
                
                // Format the text based on whether it's partial or full payment
                const paymentType = mismatch.company1?.is_partially_paid || mismatch.company2?.is_partially_paid ? 'Partial payment' : 'Payment';
                
                paymentInfo = (
                  <div>
                    <span>{formatCurrency(displayPayableAmount)}</span>
                    <div className="text-xs text-green-600 mt-1">
                      {paymentType} on {formatDate(paymentDate)}
                    </div>
                  </div>
                );
                
                // Add history note for insights section
                historyNote = {
                  type: 'payment',
                  message: `${paymentType} made on ${formatDate(paymentDate)}`,
                  amount: mismatch.company1?.amount_paid || mismatch.company2?.amount_paid || 'unknown',
                  date: paymentDate
                };
              } else {
                paymentInfo = formatCurrency(displayPayableAmount);
              }
              
              return {
                'Transaction #': (
                  <div className="flex items-center">
                    <span>{mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A'}</span>
                    {partialPaymentBadge}
                  </div>
                ),
                'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
                'Receivable Amount': (
                  <div className="flex items-center">
                    <span>{formatCurrency(displayReceivableAmount)}</span>
                    {ar_statusBadge}
                  </div>
                ),
                'Payable Amount': (
                  <div className="flex items-center">
                    <span>{paymentInfo}</span>
                    {ap_statusBadge}
                  </div>
                ),
                'Difference': formatCurrency(difference),
                'Date': formatDate(mismatch?.company1?.date || mismatch?.company2?.date),
                'Status': (
                  <div>
                    {`${mismatch?.company1?.status || 'N/A'} / ${mismatch?.company2?.status || 'N/A'}`}
                    {historyNote && (
                      <div className="text-xs text-amber-600 mt-1">
                        {historyNote.message}
                      </div>
                    )}
                  </div>
                )
              };
            })}
            columns={['Transaction #', 'Type', 'Receivable Amount', 'Payable Amount', 'Difference', 'Date', 'Status']}
          />
        </div>
      )}

      {/* Date Mismatches Section */}
      {safeDateMismatches.length > 0 && (
        <div ref={dateMismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 border-l-4 border-l-purple-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Date Discrepancies in Matched Transactions ({safeDateMismatches.length})
            </h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <p className="mb-4 text-sm text-gray-700">
            These transactions are matched based on transaction numbers and amounts, but have discrepancies in their dates.
          </p>
          <ResultTable
            data={safeDateMismatches.map(mismatch => {
              // Determine the type of date mismatch
              const mismatchType = mismatch.mismatchType === 'transaction_date' 
                ? 'Transaction Date' 
                : 'Due Date';
              
              return {
                'Transaction #': mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A',
                'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
                'Amount': formatCurrency(mismatch?.company1?.amount || 0),
                'Discrepancy Type': mismatchType,
                'AR Date': formatDate(mismatch.company1Date),
                'AP Date': formatDate(mismatch.company2Date),
                'Days Difference': mismatch.daysDifference || 'N/A'
              };
            })}
            columns={['Transaction #', 'Type', 'Amount', 'Discrepancy Type', 'AR Date', 'AP Date', 'Days Difference']}
          />
        </div>
      )}

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-700">Unmatched Items</h2>
          <button className="text-blue-700 hover:text-blue-900 transition-colors">
            Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-700">Unmatched Receivables ({safeUnmatchedItems.company1?.length || 0})</h3>
            {safeUnmatchedItems.company1 && safeUnmatchedItems.company1.length > 0 ? (
              <ResultTable
                data={(safeUnmatchedItems.company1 || []).map(item => {
                  const partialPaymentBadge = item.is_partially_paid ? getPartialPaymentBadge(item) : null;
                  const statusBadge = getStatusBadge(item.status || item.Status);
                  
                  return {
                    'Transaction #': (
                      <div className="flex items-center">
                        <span>{item?.transactionNumber || item?.InvoiceNumber || 'N/A'}</span>
                        {partialPaymentBadge}
                        {statusBadge}
                      </div>
                    ),
                    'Amount': formatCurrency(item?.amount || item?.Total || 0),
                    'Date': formatDate(item?.date || item?.Date),
                    'Due Date': formatDate(item?.dueDate || item?.DueDate),
                    'Status': item?.status || item?.Status || 'N/A'
                  };
                })}
                columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
              />
            ) : (
              <p className="text-gray-500 italic">No unmatched receivables found.</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-700">Unmatched Payables ({safeUnmatchedItems.company2?.length || 0})</h3>
            {safeUnmatchedItems.company2 && safeUnmatchedItems.company2.length > 0 ? (
              <ResultTable
                data={(safeUnmatchedItems.company2 || []).map(item => {
                  const partialPaymentBadge = item.is_partially_paid ? getPartialPaymentBadge(item) : null;
                  const statusBadge = getStatusBadge(item.status);
                  
                  return {
                    'Transaction #': (
                      <div className="flex items-center">
                        <span>{item?.transactionNumber || 'N/A'}</span>
                        {partialPaymentBadge}
                        {statusBadge}
                      </div>
                    ),
                    'Amount': formatCurrency(item?.amount || 0),
                    'Date': formatDate(item?.date),
                    'Due Date': formatDate(item?.dueDate),
                    'Status': item?.status || 'N/A'
                  };
                })}
                columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
              />
            ) : (
              <p className="text-gray-500 italic">No unmatched payables found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Insights Section */}
      {safeHistoricalInsights.length > 0 && (
        <div ref={historicalInsightsRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 border-l-4 border-l-amber-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Historical Insights for AP Items ({safeHistoricalInsights.length})
            </h2>
            <button className="text-blue-700 hover:text-blue-900 transition-colors">
              Export CSV
            </button>
          </div>
          <div className="space-y-4">
            {safeHistoricalInsights.map((insight, index) => {
              const badgeClass = getInsightBadgeClass(insight.insight?.severity || 'info');
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-700">AP Item</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Transaction #:</span> {insight.apItem?.transactionNumber || 'N/A'}</p>
                        <p><span className="font-medium">Amount:</span> {formatCurrency(insight.apItem?.amount || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.apItem?.date)}</p>
                        <p><span className="font-medium">Status:</span> {insight.apItem?.status || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-700">AR Historical Match</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Transaction #:</span> {insight.historicalMatch?.transactionNumber || 'N/A'}</p>
                        <p><span className="font-medium">Original Amount:</span> {formatCurrency(insight.historicalMatch?.original_amount || insight.historicalMatch?.amount || 0)}</p>
                        {insight.historicalMatch?.is_partially_paid && (
                          <p>
                            <span className="font-medium">Paid Amount:</span> {formatCurrency(insight.historicalMatch?.amount_paid || 0)}
                            <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                              {((insight.historicalMatch.amount_paid / insight.historicalMatch.original_amount) * 100).toFixed(0)}% paid
                            </span>
                          </p>
                        )}
                        <p><span className="font-medium">Current Amount:</span> {formatCurrency(insight.historicalMatch?.amount || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.historicalMatch?.date)}</p>
                        <p><span className="font-medium">Status:</span> {insight.historicalMatch?.status || 'N/A'}</p>
                        {insight.historicalMatch?.payment_date && (
                          <p><span className="font-medium">Payment Date:</span> {formatDate(insight.historicalMatch?.payment_date)}</p>
                        )}
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