// frontend/src/components/matching/MatchingResults.tsx
// This component displays the results of the matching process
// Think of it as a detailed report showing what matched and what didn't

import React, { useState } from 'react';
import { MatchingResult, MatchedPair, MatchingTransaction } from '../../types/matching';
import { matchingService } from '../../services/matchingService';

interface MatchingResultsProps {
  result: MatchingResult;
  onExport: () => void;
  onDelete: () => void;
}

export const MatchingResults: React.FC<MatchingResultsProps> = ({ result, onExport, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'perfect' | 'mismatches' | 'unmatched'>('perfect');
  const [isExporting, setIsExporting] = useState(false);

  // Handle export functionality
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await matchingService.exportResults(result._id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `matching-results-${result.company1Name}-${result.company2Name}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onExport();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Format currency amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  // Get confidence badge color
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Statistics summary component
  const StatsSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-green-50 p-6 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{result.statistics.perfectMatches}</div>
        <div className="text-sm text-green-800">Perfect Matches</div>
        <div className="text-xs text-green-600 mt-1">
          {formatCurrency(result.statistics.matchedAmount)}
        </div>
      </div>
      
      <div className="bg-yellow-50 p-6 rounded-lg">
        <div className="text-2xl font-bold text-yellow-600">{result.statistics.mismatches}</div>
        <div className="text-sm text-yellow-800">Mismatches</div>
        <div className="text-xs text-yellow-600 mt-1">Need Review</div>
      </div>
      
      <div className="bg-red-50 p-6 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {result.statistics.company1Unmatched + result.statistics.company2Unmatched}
        </div>
        <div className="text-sm text-red-800">Unmatched</div>
        <div className="text-xs text-red-600 mt-1">
          C1: {result.statistics.company1Unmatched} | C2: {result.statistics.company2Unmatched}
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {Math.round(result.statistics.matchRate * 100)}%
        </div>
        <div className="text-sm text-blue-800">Match Rate</div>
        <div className="text-xs text-blue-600 mt-1">Overall Success</div>
      </div>
    </div>
  );

  // Table component for matched pairs
  const MatchedPairsTable = ({ pairs, type }: { pairs: MatchedPair[], type: 'perfect' | 'mismatches' }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {result.company1Name}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {result.company2Name}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            {type === 'mismatches' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pairs.map((pair, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    {pair.company1Transaction.transaction_number || 
                     pair.company1Transaction.transactionNumber || 
                     pair.company1Transaction.invoice_number || 
                     pair.company1Transaction.id || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(pair.company1Transaction.amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {pair.company1Transaction.issue_date || 
                     pair.company1Transaction.date || 
                     pair.company1Transaction.invoiceDate || 'No date'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    {pair.company2Transaction.transaction_number || 
                     pair.company2Transaction.transactionNumber || 
                     pair.company2Transaction.invoice_number || 
                     pair.company2Transaction.id || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(pair.company2Transaction.amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {pair.company2Transaction.issue_date || 
                     pair.company2Transaction.date || 
                     pair.company2Transaction.invoiceDate || 'No date'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceBadgeColor(pair.confidence)}`}>
                  {Math.round(pair.confidence * 100)}%
                </span>
              </td>
              {type === 'mismatches' && (
                <td className="px-6 py-4">
                  <div className="text-xs text-red-600 space-y-1">
                    {pair.reasons?.map((reason, idx) => (
                      <div key={idx}>{reason}</div>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Table component for unmatched transactions
  const UnmatchedTable = ({ transactions, companyName }: { transactions: MatchingTransaction[], companyName: string }) => (
    <div className="mb-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4">{companyName} Unmatched ({transactions.length})</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {transaction.transaction_number || 
                   transaction.transactionNumber || 
                   transaction.invoice_number || 
                   transaction.id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.issue_date || 
                   transaction.date || 
                   transaction.invoiceDate || 'No date'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {transaction.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.reference || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Matching Results</h2>
            <p className="text-gray-600">
              {result.company1Name} vs {result.company2Name}
            </p>
            <p className="text-sm text-gray-500">
              Created: {formatDate(result.createdAt)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>📊 Export CSV</>
              )}
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <StatsSummary />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('perfect')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'perfect'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Perfect Matches ({result.statistics.perfectMatches})
          </button>
          <button
            onClick={() => setActiveTab('mismatches')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mismatches'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mismatches ({result.statistics.mismatches})
          </button>
          <button
            onClick={() => setActiveTab('unmatched')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'unmatched'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Unmatched ({result.statistics.company1Unmatched + result.statistics.company2Unmatched})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'perfect' && (
          <div>
            <h3 className="text-lg font-medium text-green-800 mb-4">
              Perfect Matches ({result.perfectMatches.length})
            </h3>
            {result.perfectMatches.length > 0 ? (
              <MatchedPairsTable pairs={result.perfectMatches} type="perfect" />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No perfect matches found
              </div>
            )}
          </div>
        )}

        {activeTab === 'mismatches' && (
          <div>
            <h3 className="text-lg font-medium text-yellow-800 mb-4">
              Mismatches ({result.mismatches.length})
            </h3>
            {result.mismatches.length > 0 ? (
              <MatchedPairsTable pairs={result.mismatches} type="mismatches" />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No mismatches found
              </div>
            )}
          </div>
        )}

        {activeTab === 'unmatched' && (
          <div>
            <h3 className="text-lg font-medium text-red-800 mb-4">Unmatched Transactions</h3>
            {result.company1Unmatched.length > 0 && (
              <UnmatchedTable 
                transactions={result.company1Unmatched} 
                companyName={result.company1Name}
              />
            )}
            {result.company2Unmatched.length > 0 && (
              <UnmatchedTable 
                transactions={result.company2Unmatched} 
                companyName={result.company2Name}
              />
            )}
            {result.company1Unmatched.length === 0 && result.company2Unmatched.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                All transactions were matched!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};