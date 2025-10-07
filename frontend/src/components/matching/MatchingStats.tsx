/**
 * Matching Statistics Component
 * 
 * This component displays summary statistics and recent matching history.
 * Think of it as your "dashboard widget" that gives you a quick overview
 * of your reconciliation performance.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import matchingService from '../../services/matchingService';
import { MatchingHistoryResponse, MatchingHistoryItem } from '../../types/matching';

interface MatchingStatsProps {
  onViewDetails?: (matchId: string) => void;
  className?: string;
}

export const MatchingStats: React.FC<MatchingStatsProps> = ({
  onViewDetails,
  className = ''
}) => {
  const [data, setData] = useState<MatchingHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEndpointAvailable, setIsEndpointAvailable] = useState(true);

  /**
   * Load matching statistics and history
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await matchingService.getMatchingHistory(5); // Get last 5 matches
        setData(response);
        setIsEndpointAvailable(true);
      } catch (err: any) {
        // If it's a 404 or "not found" error, the endpoint doesn't exist yet
        if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('endpoint not found')) {
          console.log('📊 History endpoint not available yet - showing placeholder');
          setIsEndpointAvailable(false);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load statistics');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Get match rate badge styling
   */
  const getMatchRateBadge = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  };

  /**
   * Get item ID safely
   */
  const getItemId = (item: any): string => {
    // Try multiple possible ID fields
    if (item?._id) return item._id;
    if (item?.id) return item.id;
    if (item?.matchId) return item.matchId;
    // Fallback to creating a unique ID from timestamp
    return `match-${item?.createdAt || Date.now()}`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If endpoint doesn't exist yet, show a placeholder
  if (!isEndpointAvailable) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Statistics Coming Soon</h3>
            <p className="text-neutral-600 mb-4">
              Upload your CSV files or connect to Xero to start matching invoices. Statistics and history will appear here once you've completed your first match.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Unable to load statistics</h3>
              <p className="text-neutral-600 mb-4">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.statistics;
  const history = data?.history || [];

  // Filter out any invalid items from history
  const validHistory = history.filter(item => item && (item._id || item.id || item.matchId || item.createdAt));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Matching Overview</h3>
          <p className="text-neutral-600">Your reconciliation performance summary</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalRuns || 0}</div>
              <div className="text-sm text-neutral-600">Total Runs</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{(stats?.avgMatchRate || 0).toFixed(1)}%</div>
              <div className="text-sm text-neutral-600">Avg Match Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{stats?.totalPerfectMatches || 0}</div>
              <div className="text-sm text-neutral-600">Perfect Matches</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.totalMismatches || 0}</div>
              <div className="text-sm text-neutral-600">Mismatches</div>
            </div>
          </div>

          {stats?.lastRun && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Last run: {formatDate(stats.lastRun)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      {validHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Recent Matches</h3>
                <p className="text-neutral-600">Your latest reconciliation runs</p>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-200">
              {validHistory.map((item) => {
                const itemId = getItemId(item);
                
                return (
                  <div key={itemId} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {item.metadata?.fileName1 && item.metadata?.fileName2 ? (
                                `${item.metadata.fileName1} vs ${item.metadata.fileName2}`
                              ) : (
                                `${item.metadata?.sourceType1 || 'Source 1'} vs ${item.metadata?.sourceType2 || 'Source 2'}`
                              )}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {item.createdAt ? formatDate(item.createdAt) : 'Unknown date'} • {((item.metadata?.processingTime || 0) / 1000).toFixed(1)}s
                            </p>
                          </div>
                          
                          <Badge variant={getMatchRateBadge(item.statistics?.matchRate || 0)}>
                            {(item.statistics?.matchRate || 0).toFixed(1)}% matched
                          </Badge>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-neutral-600">
                          <span>{item.statistics?.totalRecords || 0} records</span>
                          <span>{formatCurrency(item.statistics?.matchedAmount || 0)} matched</span>
                          {(item.statistics?.varianceAmount || 0) > 0 && (
                            <span className="text-orange-600">
                              {formatCurrency(item.statistics.varianceAmount)} variance
                            </span>
                          )}
                        </div>
                      </div>

                      {onViewDetails && itemId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(itemId)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No History State */}
      {validHistory.length === 0 && stats?.totalRuns === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No matches yet</h3>
            <p className="text-neutral-600 mb-4">
              Upload your first CSV files to start reconciling invoices and see statistics here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      {stats && stats.totalRuns > 0 && stats.avgMatchRate < 80 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-yellow-800">💡 Tips to Improve Match Rate</h3>
          </CardHeader>
          <CardContent className="bg-yellow-50">
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• Ensure transaction numbers are consistent between systems</li>
              <li>• Check date formats match the selected format</li>
              <li>• Verify amounts include the same currency and precision</li>
              <li>• Remove any duplicate or test transactions</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingStats;
