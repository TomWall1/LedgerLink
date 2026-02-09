/**
 * Enhanced Dashboard Component
 * 
 * This is the main dashboard that shows real statistics from your matching
 * operations. It pulls data from the backend and displays it in an easy-to-read
 * format, like a financial dashboard in your accounting software.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import MatchingStats from '../components/matching/MatchingStats';
import matchingService from '../services/matchingService';
import { counterpartyService } from '../services/counterpartyService';
import { formatCurrency, formatDate, formatPercentage } from '../utils/format';
import { MatchingHistoryResponse } from '../types/matching';

interface User {
  name: string;
  email: string;
}

interface DashboardProps {
  user: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<MatchingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pending invitations
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  // Load dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch matching history and statistics
        const data = await matchingService.getMatchingHistory(10);
        setDashboardData(data);

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async () => {
    try {
      const response = await counterpartyService.getReceivedInvitations();
      const pending = (response.invitations || []).filter(
        (inv: any) => inv.connectionStatus === 'PENDING' && new Date(inv.linkExpiresAt) > new Date()
      );
      setPendingInvitations(pending);
    } catch (err) {
      console.error('Failed to load pending invitations:', err);
    }
  };

  // Calculate derived statistics
  const stats = dashboardData?.statistics;
  const recentMatches = dashboardData?.history || [];
  
  // Calculate additional metrics from recent matches
  const recentTotalAmount = recentMatches.reduce((sum, match) => 
    sum + (match.statistics.totalAmount || 0), 0
  );
  
  const recentVariance = recentMatches.reduce((sum, match) => 
    sum + (match.statistics.varianceAmount || 0), 0
  );

  /**
   * Handle navigation to different pages
   */
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  /**
   * View details of a specific match
   */
  const handleViewMatch = (matchId: string) => {
    navigate(`/matches?view=${matchId}`);
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                    <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="h-64 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="h-64 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error && !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Unable to load dashboard</h3>
            <p className="text-neutral-600 mb-6">{error}</p>
            <div className="space-x-3">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="primary" onClick={() => handleNavigate('/matches')}>
                Start Matching
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasData = stats && stats.totalRuns > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-neutral-900 mb-2">
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-body-lg text-neutral-600">
          {hasData 
            ? 'Here\'s an overview of your invoice reconciliation activity.'
            : 'Get started by uploading CSV files or connecting your accounting system.'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/matches')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Match Rate
                </p>
                <p className="text-h1 font-bold text-success mt-1">
                  {hasData ? formatPercentage(stats.avgMatchRate) : '-'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {hasData ? 'Average across all runs' : 'Start matching to see rate'}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/matches')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Total Runs
                </p>
                <p className="text-h1 font-bold text-neutral-900 mt-1">
                  {stats?.totalRuns?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Matching operations completed
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/matches')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Perfect Matches
                </p>
                <p className="text-h1 font-bold text-neutral-900 mt-1">
                  {stats?.totalPerfectMatches?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Exact transaction matches found
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/matches')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">
                  Discrepancies
                </p>
                <p className="text-h1 font-bold text-warning mt-1">
                  {stats?.totalMismatches?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Items requiring attention
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invitations Card */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-h3 text-neutral-900">Pending Invitations</h2>
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-primary-600 rounded-full">
                  {pendingInvitations.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/counterparties')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.slice(0, 3).map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                    {(inv.senderCompanyName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {inv.senderCompanyName || 'Unknown Company'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Received {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/counterparties')}
                >
                  Review
                </Button>
              </div>
            ))}
            {pendingInvitations.length > 3 && (
              <p className="text-sm text-neutral-500 text-center pt-1">
                and {pendingInvitations.length - 3} more
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity / Matching Stats */}
        <div className="space-y-6">
          {hasData ? (
            <MatchingStats onViewDetails={handleViewMatch} />
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-neutral-900">Getting Started</h2>
                <p className="text-body text-neutral-600 mt-1">
                  Choose how you'd like to begin reconciling your invoices
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => handleNavigate('/matches')}
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">Upload CSV Files</h3>
                    <p className="text-sm text-neutral-600">
                      Start with CSV exports from your accounting systems
                    </p>
                  </div>
                </div>

                <div 
                  className="p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
                  onClick={() => handleNavigate('/connections')}
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">Connect ERP System</h3>
                    <p className="text-sm text-neutral-600">
                      Link Xero, QuickBooks, or other accounting software
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-h3 text-neutral-900">Quick Actions</h2>
            <p className="text-body text-neutral-600 mt-1">
              Common tasks and shortcuts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              onClick={() => handleNavigate('/matches')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-medium text-neutral-900">New Match</h3>
                  <p className="text-small text-neutral-600 mt-1">Upload CSV files and run matching</p>
                </div>
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              onClick={() => handleNavigate('/connections')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-medium text-neutral-900">Connect System</h3>
                  <p className="text-small text-neutral-600 mt-1">Link your accounting software</p>
                </div>
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              onClick={() => handleNavigate('/reports')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-medium text-neutral-900">View Reports</h3>
                  <p className="text-small text-neutral-600 mt-1">Historical matching analytics</p>
                </div>
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              onClick={() => handleNavigate('/counterparties')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-medium text-neutral-900">Invite Counterparty</h3>
                  <p className="text-small text-neutral-600 mt-1">Connect with customers or vendors</p>
                </div>
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Show additional stats if we have data */}
            {hasData && recentMatches.length > 0 && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">
                      {formatCurrency(recentTotalAmount)}
                    </div>
                    <div className="text-xs text-neutral-500">Recent Volume</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(recentVariance)}
                    </div>
                    <div className="text-xs text-neutral-500">Total Variance</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-neutral-900">System Status</h2>
              <p className="text-body text-neutral-600 mt-1">
                Service health and connection status
              </p>
            </div>
            <Badge variant="success">All systems operational</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-body font-medium text-neutral-900">Matching Engine</p>
                <p className="text-small text-neutral-600">
                  {hasData ? `Last run: ${formatDate(stats.lastRun, { format: 'relative' })}` : 'Ready to use'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-body font-medium text-neutral-900">Database</p>
                <p className="text-small text-neutral-600">Healthy & responsive</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-body font-medium text-neutral-900">Security</p>
                <p className="text-small text-neutral-600">All connections encrypted</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
