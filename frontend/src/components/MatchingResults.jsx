import React, { useState } from 'react';

const MatchingResults = ({ results }) => {
  const [activeTab, setActiveTab] = useState('perfectMatches');

  if (!results) {
    return <div>No results available</div>;
  }
  
  const { perfectMatches, mismatches, unmatchedItems, dateMismatches, historicalInsights } = results;

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const renderPerfectMatches = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Perfect Matches ({perfectMatches.length})</h3>
      {perfectMatches.length === 0 ? (
        <p className="text-gray-500">No perfect matches found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Co. 1)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Co. 2)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {perfectMatches.map((match, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{match.company1.transactionNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{match.company1.type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(match.company1.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(Math.abs(match.company2.amount))}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(match.company1.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{match.company1.reference || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderMismatches = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Mismatches ({mismatches.length})</h3>
      {mismatches.length === 0 ? (
        <p className="text-gray-500">No mismatches found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Co. 1)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Co. 2)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mismatches.map((mismatch, index) => {
                const amountDiff = Math.abs(Math.abs(mismatch.company1.amount) - Math.abs(mismatch.company2.amount));
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{mismatch.company1.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{mismatch.company1.type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(mismatch.company1.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(Math.abs(mismatch.company2.amount))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">{formatCurrency(amountDiff)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(mismatch.company1.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{mismatch.company1.reference || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDateMismatches = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Date Mismatches ({dateMismatches?.length || 0})</h3>
      {!dateMismatches || dateMismatches.length === 0 ? (
        <p className="text-gray-500">No date mismatches found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date (Co. 1)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date (Co. 2)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference (Days)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dateMismatches.map((mismatch, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{mismatch.company1.transactionNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{mismatch.mismatchType === 'transaction_date' ? 'Transaction Date' : 'Due Date'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(mismatch.company1Date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(mismatch.company2Date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-yellow-600">{mismatch.daysDifference} days</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(mismatch.company1.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUnmatchedItems = () => (
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Unmatched Items in Company 1 ({unmatchedItems.company1.length})</h3>
        {unmatchedItems.company1.length === 0 ? (
          <p className="text-gray-500">No unmatched items found in Company 1.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unmatchedItems.company1.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.reference || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Unmatched Items in Company 2 ({unmatchedItems.company2.length})</h3>
        {unmatchedItems.company2.length === 0 ? (
          <p className="text-gray-500">No unmatched items found in Company 2.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unmatchedItems.company2.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.transactionNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(Math.abs(item.amount))}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.reference || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoricalInsights = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Historical Insights ({historicalInsights?.length || 0})</h3>
      {!historicalInsights || historicalInsights.length === 0 ? (
        <p className="text-gray-500">No historical insights available.</p>
      ) : (
        <div className="space-y-4">
          {historicalInsights.map((insight, index) => {
            const severityClass = 
              insight.insight.severity === 'error' ? 'bg-red-50 border-red-200' :
              insight.insight.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200';
              
            const textClass = 
              insight.insight.severity === 'error' ? 'text-red-700' :
              insight.insight.severity === 'warning' ? 'text-yellow-700' :
              'text-blue-700';
              
            return (
              <div key={index} className={`p-4 border rounded-lg ${severityClass}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium mb-1">{insight.apItem.transactionNumber}</h4>
                    <p className={`${textClass}`}>{insight.insight.message}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Amount: {formatCurrency(Math.abs(insight.apItem.amount))}</div>
                    <div>Date: {formatDate(insight.apItem.date)}</div>
                    {insight.linkedAccountId && (
                      <div className="text-indigo-600">Linked Account: {insight.linkedAccountId}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'perfectMatches' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('perfectMatches')}
          >
            Perfect Matches ({perfectMatches.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'mismatches' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('mismatches')}
          >
            Mismatches ({mismatches.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'dateMismatches' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('dateMismatches')}
          >
            Date Mismatches ({dateMismatches?.length || 0})
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'unmatchedItems' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('unmatchedItems')}
          >
            Unmatched Items ({unmatchedItems.company1.length + unmatchedItems.company2.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md ${activeTab === 'historicalInsights' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('historicalInsights')}
          >
            Historical Insights ({historicalInsights?.length || 0})
          </button>
        </div>
      </div>
      
      <div>
        {activeTab === 'perfectMatches' && renderPerfectMatches()}
        {activeTab === 'mismatches' && renderMismatches()}
        {activeTab === 'dateMismatches' && renderDateMismatches()}
        {activeTab === 'unmatchedItems' && renderUnmatchedItems()}
        {activeTab === 'historicalInsights' && renderHistoricalInsights()}
      </div>
    </div>
  );
};

export default MatchingResults;