// frontend/src/components/matching/MatchingStats.tsx
// This component shows summary statistics for the dashboard
// Think of it as a "dashboard widget" that shows key numbers

import React, { useEffect, useState } from 'react';
import { MatchingResult } from '../../types/matching';
import { matchingService } from '../../services/matchingService';

interface StatsData {
  totalMatches: number;
  averageMatchRate: number;
  totalTransactionsProcessed: number;
  totalAmountProcessed: number;
  recentActivity: MatchingResult[];
}

export const MatchingStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const history = await matchingService.getMatchingHistory();
      
      // Calculate statistics
      const totalMatches = history.length;
      const averageMatchRate = totalMatches > 0 
        ? history.reduce((sum, result) => sum + result.statistics.matchRate, 0) / totalMatches
        : 0;
      const totalTransactionsProcessed = history.reduce((sum, result) => 
        sum + result.statistics.totalCompany1 + result.statistics.totalCompany2, 0
      );
      const totalAmountProcessed = history.reduce((sum, result) => 
        sum + result.statistics.totalAmount1 + result.statistics.totalAmount2, 0
      );
      const recentActivity = history.slice(0, 5); // Last 5 matches

      setStats({
        totalMatches,
        averageMatchRate,
        totalTransactionsProcessed,
        totalAmountProcessed,
        recentActivity
      });
    } catch (error) {
      setError(`Error loading statistics: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalMatches === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Matching Statistics</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No data yet</h4>
          <p className="text-gray-500">
            Start by uploading CSV files to see your matching statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Matching Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalMatches}
            </div>
            <div className="text-sm text-gray-600">
              Total Matches
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatPercentage(stats.averageMatchRate)}
            </div>
            <div className="text-sm text-gray-600">
              Average Match Rate
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.totalTransactionsProcessed.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Transactions Processed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {formatCurrency(stats.totalAmountProcessed)}
            </div>
            <div className="text-sm text-gray-600">
              Total Amount
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">Last 5 matches</span>
        </div>
        
        {stats.recentActivity.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No recent activity
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((result) => (
              <div key={result._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {result.company1Name} vs {result.company2Name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(result.createdAt)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {result.statistics.perfectMatches + result.statistics.mismatches} matches
                    </div>
                    <div className="text-xs text-gray-500">
                      of {result.statistics.totalCompany1 + result.statistics.totalCompany2} total
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    result.statistics.matchRate >= 0.8 
                      ? 'bg-green-100 text-green-800'
                      : result.statistics.matchRate >= 0.6
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formatPercentage(result.statistics.matchRate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {stats.totalMatches >= 3 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
          <div className="space-y-3">
            {stats.averageMatchRate >= 0.8 && (
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="text-green-500 mr-3">✅</div>
                <div className="text-sm text-green-800">
                  Great work! Your average match rate is {formatPercentage(stats.averageMatchRate)}, 
                  which indicates high data quality.
                </div>
              </div>
            )}
            
            {stats.averageMatchRate < 0.6 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-500 mr-3">💡</div>
                <div className="text-sm text-yellow-800">
                  Consider reviewing your data formats and transaction numbering systems 
                  to improve match rates.
                </div>
              </div>
            )}
            
            {stats.totalMatches >= 10 && (
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-500 mr-3">📈</div>
                <div className="text-sm text-blue-800">
                  You've processed {stats.totalMatches} matches! Consider setting up automated 
                  reconciliation workflows.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};