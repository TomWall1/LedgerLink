// frontend/src/pages/Matches.tsx
// This is the main page where users upload CSVs and view matching results
// Think of it as the "control center" for invoice matching

import React, { useState, useEffect } from 'react';
import { CSVUpload } from '../components/matching/CSVUpload';
import { MatchingResults } from '../components/matching/MatchingResults';
import { MatchingResult } from '../types/matching';
import { matchingService } from '../services/matchingService';

export const Matches: React.FC = () => {
  // Component state - these variables track what's happening
  const [currentResult, setCurrentResult] = useState<MatchingResult | null>(null);
  const [matchingHistory, setMatchingHistory] = useState<MatchingResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'results' | 'history'>('upload');

  // Load matching history when component first loads
  useEffect(() => {
    loadMatchingHistory();
  }, []);

  // Function to load all previous matching results
  const loadMatchingHistory = async () => {
    try {
      const history = await matchingService.getMatchingHistory();
      setMatchingHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
      // Don't show error for history loading as it's not critical
    }
  };

  // Handle successful upload
  const handleUploadSuccess = async (matchId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the full results
      const result = await matchingService.getMatchingResults(matchId);
      setCurrentResult(result);
      setView('results');
      setSuccess('Files uploaded and processed successfully!');
      
      // Refresh history
      await loadMatchingHistory();
    } catch (error) {
      setError(`Error loading results: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle upload errors
  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
  };

  // Handle viewing a result from history
  const handleViewResult = (result: MatchingResult) => {
    setCurrentResult(result);
    setView('results');
    setError(null);
    setSuccess(null);
  };

  // Handle result export
  const handleExport = () => {
    setSuccess('Results exported successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Handle result deletion
  const handleDelete = async () => {
    if (!currentResult) return;
    
    if (window.confirm('Are you sure you want to delete this matching result?')) {
      try {
        await matchingService.deleteResults(currentResult._id);
        setCurrentResult(null);
        setView('upload');
        setSuccess('Result deleted successfully!');
        await loadMatchingHistory();
      } catch (error) {
        setError(`Error deleting result: ${(error as Error).message}`);
      }
    }
  };

  // Handle starting a new match
  const handleNewMatch = () => {
    setCurrentResult(null);
    setView('upload');
    setError(null);
    setSuccess(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format match rate percentage
  const formatMatchRate = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  // History component
  const MatchingHistory = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Matching History</h2>
        <button
          onClick={() => setView('upload')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Match
        </button>
      </div>

      {matchingHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching history</h3>
          <p className="text-gray-500 mb-4">
            Upload your first CSV files to start matching transactions.
          </p>
          <button
            onClick={() => setView('upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload Files
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Companies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchingHistory.map((result) => (
                <tr key={result._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {result.company1Name}
                    </div>
                    <div className="text-sm text-gray-500">
                      vs {result.company2Name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(result.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      result.statistics.matchRate >= 0.8 
                        ? 'bg-green-100 text-green-800'
                        : result.statistics.matchRate >= 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatMatchRate(result.statistics.matchRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.statistics.totalCompany1 + result.statistics.totalCompany2}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewResult(result)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Matching</h1>
          <p className="mt-2 text-gray-600">
            Upload and compare CSV files to identify matching transactions between companies.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('upload')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            History ({matchingHistory.length})
          </button>
          {currentResult && (
            <button
              onClick={() => setView('results')}
              className={`px-4 py-2 rounded-md font-medium ${
                view === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Current Results
            </button>
          )}
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400 mr-3">⚠️</div>
              <div className="text-red-700">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="text-green-400 mr-3">✓</div>
              <div className="text-green-700">{success}</div>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">Loading results...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {view === 'upload' && (
            <CSVUpload 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          )}

          {view === 'history' && <MatchingHistory />}

          {view === 'results' && currentResult && (
            <div>
              <div className="mb-4">
                <button
                  onClick={handleNewMatch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Start New Match
                </button>
              </div>
              <MatchingResults
                result={currentResult}
                onExport={handleExport}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {/* Quick Stats (if there's history) */}
        {matchingHistory.length > 0 && view !== 'history' && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{matchingHistory.length}</div>
                <div className="text-sm text-gray-600">Total Matches Run</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatMatchRate(
                    matchingHistory.reduce((sum, result) => sum + result.statistics.matchRate, 0) / 
                    matchingHistory.length
                  )}
                </div>
                <div className="text-sm text-gray-600">Average Match Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {matchingHistory.reduce((sum, result) => 
                    sum + result.statistics.totalCompany1 + result.statistics.totalCompany2, 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Transactions Processed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};