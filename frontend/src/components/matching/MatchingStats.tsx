/**
 * Enhanced Matching Statistics Component with Counterparty Integration
 * 
 * This component displays summary statistics and recent matching history with
 * counterparty relationship information. Think of it as your "relationship dashboard"
 * that shows both reconciliation performance and business partnerships.
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

  /**
   * Load matching statistics and history
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await matchingService.getMatchingHistory(8); // Get last 8 matches for better view
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
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
   * Get counterparty type badge styling
   */
  const getCounterpartyBadge = (type: 'customer' | 'vendor') => {
    return type === 'customer' ? 'default' : 'warning';
  };

  /**
   * Extract company names from match item
   */
  const getCompanyNames = (item: MatchingHistoryItem) => {
    // Try to get from metadata first (Phase 4 format)
    if (item.metadata?.fileName1 && item.metadata?.fileName2) {
      return {
        company1: item.metadata.fileName1.replace('.csv', ''),
        company2: item.metadata.fileName2.replace('.csv', '')
      };
    }
    
    // Fallback to source types
    return {
      company1: item.metadata?.sourceType1 || 'Company 1',
      company2: item.metadata?.sourceType2 || 'Company 2'
    };
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

  // Calculate counterparty statistics
  const counterpartyMatches = history.filter(item => item.counterparty);
  const uniqueCounterparties = new Set(counterpartyMatches.map(item => item.counterparty?._id)).size;

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
              <div className="text-2xl font-bold text-purple-600">{uniqueCounterparties}</div>
              <div className="text-sm text-neutral-600">Active Partners</div>
            </div>
          </div>

          {stats?.lastRun && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-600">
                  Last run: {formatDate(stats.lastRun)}
                </p>
                {counterpartyMatches.length > 0 && (
                  <p className="text-sm text-neutral-600">
                    {((counterpartyMatches.length / history.length) * 100).toFixed(0)}% with counterparties
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Recent Matches</h3>
                <p className="text-neutral-600">Your latest reconciliation runs with business relationships</p>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-200">
              {history.map((item) => {
                const companies = getCompanyNames(item);
                return (
                  <div key={item._id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-neutral-900">
                                {companies.company1} ⟷ {companies.company2}
                              </p>
                              
                              {/* Counterparty Badge */}
                              {item.counterparty ? (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
                                    item.counterparty.type === 'customer' 
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {item.counterparty.type === 'customer' ? 'C' : 'V'}
                                  </div>
                                  <span className="text-xs text-neutral-600">{item.counterparty.name}</span>
                                </div>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Standalone
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3 text-sm text-neutral-600">
                              <span>{formatDate(item.createdAt)}</span>
                              <span>•</span>
                              <span>{(item.metadata.processingTime / 1000).toFixed(1)}s</span>
                              <span>•</span>
                              <Badge variant={getMatchRateBadge(item.statistics.matchRate)} className="text-xs">
                                {item.statistics.matchRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-neutral-600">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{item.statistics.totalRecords || 0} records</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>{formatCurrency(item.statistics.matchedAmount || 0)} matched</span>
                          </span>
                          
                          {item.statistics.varianceAmount && item.statistics.varianceAmount > 0 && (
                            <span className="flex items-center space-x-1 text-orange-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span>{formatCurrency(item.statistics.varianceAmount)} variance</span>
                            </span>
                          )}

                          {/* Notes indicator */}
                          {item.metadata?.notes && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              <span className="text-blue-600">Note</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {onViewDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(item._id)}
                          className="ml-4"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
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

      {/* Counterparty Insights */}
      {counterpartyMatches.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Business Relationships</h3>
            <p className="text-neutral-600">Your counterparty matching insights</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 text-xs font-medium">C</span>
                  </div>
                  <span className="font-medium text-blue-900">Customers</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {counterpartyMatches.filter(item => item.counterparty?.type === 'customer').length}
                </div>
                <div className="text-sm text-blue-600">Recent matches</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-700 text-xs font-medium">V</span>
                  </div>
                  <span className="font-medium text-orange-900">Vendors</span>
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {counterpartyMatches.filter(item => item.counterparty?.type === 'vendor').length}
                </div>
                <div className="text-sm text-orange-600">Recent matches</div>
              </div>
            </div>

            {/* Top Counterparties */}
            <div className="mt-4">
              <h4 className="font-medium text-neutral-900 mb-2">Most Active Partners</h4>
              <div className="space-y-2">
                {Object.entries(
                  counterpartyMatches.reduce((acc, item) => {
                    if (item.counterparty) {
                      const key = item.counterparty._id;
                      if (!acc[key]) {
                        acc[key] = {
                          name: item.counterparty.name,
                          type: item.counterparty.type,
                          count: 0
                        };
                      }
                      acc[key].count++;
                    }
                    return acc;
                  }, {} as Record<string, { name: string; type: string; count: number }>)
                )
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 3)
                .map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${
                        data.type === 'customer' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {data.type === 'customer' ? 'C' : 'V'}
                      </div>
                      <span className="font-medium">{data.name}</span>
                    </div>
                    <span className="text-neutral-600">{data.count} matches</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No History State */}
      {history.length === 0 && stats?.totalRuns === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No matches yet</h3>
            <p className="text-neutral-600 mb-4">
              Upload your first CSV files to start reconciling invoices and see statistics here.
            </p>
            <div className="space-x-3">
              <Button variant="primary">
                Start Your First Match
              </Button>
              <Button variant="secondary" onClick={() => onViewDetails && onViewDetails('counterparties')}>
                Invite Counterparties
              </Button>
            </div>
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
              <li>• Consider inviting counterparties for better relationship tracking</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingStats;