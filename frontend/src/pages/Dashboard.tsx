/**
 * Enhanced Dashboard Component
 *
 * This is the main dashboard that shows real statistics from your matching
 * operations. It pulls data from the backend and displays it in an easy-to-read
 * format, like a financial dashboard in your accounting software.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import matchingService from '../services/matchingService';
import { counterpartyService } from '../services/counterpartyService';
import { reportService, BackendReport } from '../services/reportService';
import { xeroService, XeroConnection } from '../services/xeroService';
import { formatCurrency, formatDate, formatPercentage } from '../utils/format';
import { MatchingHistoryResponse } from '../types/matching';

interface User {
  name: string;
  email: string;
}

interface DashboardProps {
  user: User | null;
}

interface ActivityItem {
  id: string;
  type: 'match' | 'report';
  title: string;
  subtitle: string;
  date: string;
  badge: { label: string; variant: 'success' | 'warning' | 'error' | 'default' };
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<MatchingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pending invitations
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  // State for new dashboard sections
  const [xeroConnections, setXeroConnections] = useState<XeroConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<BackendReport[]>([]);
  const [counterpartyCount, setCounterpartyCount] = useState<{ linked: number; pending: number }>({ linked: 0, pending: 0 });

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

    const loadXeroConnections = async () => {
      try {
        setConnectionsLoading(true);
        const connections = await xeroService.getConnections();
        setXeroConnections(connections);
      } catch (err) {
        console.error('Failed to load Xero connections:', err);
        setXeroConnections([]);
      } finally {
        setConnectionsLoading(false);
      }
    };

    const loadRecentReports = async () => {
      try {
        const response = await reportService.getReports({ limit: 5 });
        setRecentReports(response.reports || []);
      } catch (err) {
        console.error('Failed to load recent reports:', err);
        setRecentReports([]);
      }
    };

    const loadCounterpartySummary = async () => {
      try {
        const response = await counterpartyService.getAllLinks();
        const links = response.links || [];
        const linked = links.filter(l => l.connectionStatus === 'LINKED').length;
        const pending = links.filter(l => l.connectionStatus === 'PENDING').length;
        setCounterpartyCount({ linked, pending });
      } catch (err) {
        console.error('Failed to load counterparty summary:', err);
        setCounterpartyCount({ linked: 0, pending: 0 });
      }
    };

    loadDashboardData();
    loadPendingInvitations();
    loadXeroConnections();
    loadRecentReports();
    loadCounterpartySummary();
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

  // Merge matching history + reports into a unified activity feed
  const activityFeed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Add matching history items
    for (const match of recentMatches) {
      const matchRate = match.statistics.matchRate || 0;
      let variant: ActivityItem['badge']['variant'] = 'success';
      if (matchRate < 50) variant = 'error';
      else if (matchRate < 80) variant = 'warning';

      items.push({
        id: match._id,
        type: 'match',
        title: `Matching run completed`,
        subtitle: `${match.statistics.matchedRecords} matched, ${match.statistics.unmatchedRecords} unmatched`,
        date: match.createdAt,
        badge: { label: `${matchRate.toFixed(0)}% match`, variant },
      });
    }

    // Add report items
    for (const report of recentReports) {
      let variant: ActivityItem['badge']['variant'] = 'default';
      if (report.status === 'ready') variant = 'success';
      else if (report.status === 'generating') variant = 'warning';
      else if (report.status === 'failed') variant = 'error';

      items.push({
        id: report._id,
        type: 'report',
        title: report.name,
        subtitle: `${report.type} report — ${report.format?.toUpperCase() || 'CSV'}`,
        date: report.createdAt,
        badge: { label: report.status === 'ready' ? 'Ready' : report.status === 'generating' ? 'Generating' : 'Failed', variant },
      });
    }

    // Sort by date descending, cap at 8
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 8);
  }, [recentMatches, recentReports]);

  /**
   * Handle navigation to different pages
   */
  const handleNavigate = (path: string) => {
    navigate(path);
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
  const activeConnections = xeroConnections.filter(c => c.status === 'active').length;

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

      {/* Counterparty Summary */}
      {(counterpartyCount.linked > 0 || counterpartyCount.pending > 0) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">Linked Counterparties</p>
                  <p className="text-h2 font-bold text-neutral-900 mt-1">{counterpartyCount.linked}</p>
                </div>
                <div className="w-px h-10 bg-neutral-200" />
                <div>
                  <p className="text-small text-neutral-600 font-medium uppercase tracking-wide">Pending Links</p>
                  <p className="text-h2 font-bold text-warning mt-1">{counterpartyCount.pending}</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/counterparties')}>
                Invite Counterparty
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Feed */}
        <div className="space-y-6">
          {activityFeed.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-neutral-900">Recent Activity</h2>
                <p className="text-body text-neutral-600 mt-1">
                  Latest matching runs and reports
                </p>
              </CardHeader>
              <CardContent className="space-y-1">
                {activityFeed.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    onClick={() => navigate(item.type === 'match' ? '/matches' : '/reports')}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'match' ? 'bg-primary-100' : 'bg-green-100'
                    }`}>
                      {item.type === 'match' ? (
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-neutral-900 truncate">{item.title}</p>
                        <span className="text-xs text-neutral-500 flex-shrink-0">
                          {formatDate(item.date, { format: 'relative' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{item.subtitle}</p>
                    </div>

                    {/* Badge */}
                    <Badge variant={item.badge.variant} className="flex-shrink-0">
                      {item.badge.label}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
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

      {/* ERP Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h3 text-neutral-900">ERP Connection Status</h2>
              <p className="text-body text-neutral-600 mt-1">
                Connected accounting systems
              </p>
            </div>
            {!connectionsLoading && xeroConnections.length > 0 && (
              <Badge variant={activeConnections === xeroConnections.length ? 'success' : 'warning'}>
                {activeConnections} of {xeroConnections.length} active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-3 bg-neutral-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : xeroConnections.length > 0 ? (
            <div className="space-y-4">
              {xeroConnections.map(conn => (
                <div key={conn._id} className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    conn.status === 'active' ? 'bg-success-100' : 'bg-warning-100'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      conn.status === 'active' ? 'text-success-600' : 'text-warning-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-neutral-900">{conn.tenantName}</p>
                      <Badge variant={xeroService.getStatusColor(conn.status)}>
                        {xeroService.getConnectionStatusText(conn.status)}
                      </Badge>
                    </div>
                    <p className="text-small text-neutral-600">
                      {conn.lastSyncAt
                        ? `Last synced ${formatDate(conn.lastSyncAt, { format: 'relative' })}`
                        : 'Never synced'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-neutral-600 mb-3">No ERP systems connected yet</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/connections')}>
                Connect ERP System
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
