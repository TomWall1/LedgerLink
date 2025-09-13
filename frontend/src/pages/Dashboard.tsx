import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { mockDashboardMetrics } from '../data/mockData';

export interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const metrics = mockDashboardMetrics;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const matchedPercentage = Math.round((metrics.matchedInvoices / metrics.totalInvoices) * 100);
  const mismatchedPercentage = Math.round((metrics.mismatchedInvoices / metrics.totalInvoices) * 100);
  const unmatchedPercentage = Math.round((metrics.unmatchedInvoices / metrics.totalInvoices) * 100);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-body text-neutral-600">
            Overview of your reconciliation status and key metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge variant="success">
            Last sync: {formatDate(metrics.lastSyncDate)}
          </Badge>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onNavigate('matches')}
          >
            Start matching
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invoices */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Total Invoices
                </p>
                <p className="mt-2 text-h2 font-bold text-neutral-900">
                  {metrics.totalInvoices.toLocaleString()}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  {formatCurrency(metrics.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Matched */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Matched
                </p>
                <p className="mt-2 text-h2 font-bold text-success-600">
                  {metrics.matchedInvoices.toLocaleString()}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  {formatCurrency(metrics.matchedValue)} ({matchedPercentage}%)
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Mismatched */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Mismatched
                </p>
                <p className="mt-2 text-h2 font-bold text-warning-600">
                  {metrics.mismatchedInvoices.toLocaleString()}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  {formatCurrency(metrics.mismatchedValue)} ({mismatchedPercentage}%)
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Unmatched */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Unmatched
                </p>
                <p className="mt-2 text-h2 font-bold text-error-600">
                  {metrics.unmatchedInvoices.toLocaleString()}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  {formatCurrency(metrics.unmatchedValue)} ({unmatchedPercentage}%)
                </p>
              </div>
              <div className="p-3 bg-error-100 rounded-full">
                <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Match Status Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold text-neutral-900">
              Match Status Distribution
            </h3>
            <p className="text-body text-neutral-600">
              Breakdown of invoice matching results
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Matched */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-success-500 rounded-full"></div>
                  <span className="text-body font-medium text-neutral-900">Matched</span>
                </div>
                <div className="text-right">
                  <span className="text-body font-medium text-neutral-900">
                    {metrics.matchedInvoices}
                  </span>
                  <span className="text-small text-neutral-500 ml-2">
                    ({matchedPercentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-success-500 h-2 rounded-full transition-all duration-420" 
                  style={{ width: `${matchedPercentage}%` }}
                ></div>
              </div>
              
              {/* Mismatched */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-warning-500 rounded-full"></div>
                  <span className="text-body font-medium text-neutral-900">Mismatched</span>
                </div>
                <div className="text-right">
                  <span className="text-body font-medium text-neutral-900">
                    {metrics.mismatchedInvoices}
                  </span>
                  <span className="text-small text-neutral-500 ml-2">
                    ({mismatchedPercentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-warning-500 h-2 rounded-full transition-all duration-420" 
                  style={{ width: `${mismatchedPercentage}%` }}
                ></div>
              </div>
              
              {/* Unmatched */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-error-500 rounded-full"></div>
                  <span className="text-body font-medium text-neutral-900">Unmatched</span>
                </div>
                <div className="text-right">
                  <span className="text-body font-medium text-neutral-900">
                    {metrics.unmatchedInvoices}
                  </span>
                  <span className="text-small text-neutral-500 ml-2">
                    ({unmatchedPercentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-error-500 h-2 rounded-full transition-all duration-420" 
                  style={{ width: `${unmatchedPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* System Status */}
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold text-neutral-900">
              System Status
            </h3>
            <p className="text-body text-neutral-600">
              Connected systems and network health
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Average Confidence */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body font-medium text-neutral-900">
                    Average Match Confidence
                  </span>
                  <Badge variant="confidence" score={metrics.averageMatchConfidence}>
                    {metrics.averageMatchConfidence}%
                  </Badge>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-420" 
                    style={{ width: `${metrics.averageMatchConfidence}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Connected Systems */}
              <div className="flex items-center justify-between py-3 border-t border-neutral-200">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-body text-neutral-900">Connected Systems</span>
                </div>
                <span className="text-body font-medium text-neutral-900">
                  {metrics.connectedSystems}
                </span>
              </div>
              
              {/* Active Counterparties */}
              <div className="flex items-center justify-between py-3 border-t border-neutral-200">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-body text-neutral-900">Active Counterparties</span>
                </div>
                <span className="text-body font-medium text-neutral-900">
                  {metrics.activeCounterparties}
                </span>
              </div>
              
              {/* Actions */}
              <div className="pt-4 space-y-2">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onNavigate('connections')}
                >
                  Manage connections
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onNavigate('counterparties')}
                >
                  Invite counterparties
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h3 font-semibold text-neutral-900">
                Recent Activity
              </h3>
              <p className="text-body text-neutral-600">
                Latest reconciliation events and system updates
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('reports')}
            >
              View all reports
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-success-50 rounded-md">
              <div className="w-2 h-2 bg-success-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-body font-medium text-neutral-900">
                  Xero synchronization completed
                </p>
                <p className="text-small text-neutral-600">
                  1,247 records updated • 2 hours ago
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-md">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-body font-medium text-neutral-900">
                  New counterparty invitation sent
                </p>
                <p className="text-small text-neutral-600">
                  Acme Corporation invited to connect • 5 hours ago
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-warning-50 rounded-md">
              <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-body font-medium text-neutral-900">
                  23 mismatched invoices detected
                </p>
                <p className="text-small text-neutral-600">
                  Requires manual review • 1 day ago
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { Dashboard };