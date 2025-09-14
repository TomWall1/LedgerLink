import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { XeroConnection } from '../../services/xeroService';
import { formatNumber, formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface XeroDataSummaryProps {
  connections: XeroConnection[];
  className?: string;
}

const XeroDataSummary: React.FC<XeroDataSummaryProps> = ({ connections, className }) => {
  const activeConnections = connections.filter(conn => conn.status === 'active');
  
  const totals = activeConnections.reduce(
    (acc, connection) => {
      if (connection.dataCounts) {
        acc.invoices += connection.dataCounts.invoices || 0;
        acc.contacts += connection.dataCounts.contacts || 0;
      }
      return acc;
    },
    { invoices: 0, contacts: 0 }
  );
  
  const lastSyncTimes = activeConnections
    .map(conn => new Date(conn.lastSyncAt))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const mostRecentSync = lastSyncTimes[0];
  
  const healthyConnections = activeConnections.filter(
    conn => conn.lastSyncStatus === 'success'
  ).length;
  
  const stats = [
    {
      label: 'Active Connections',
      value: activeConnections.length,
      total: connections.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      color: activeConnections.length > 0 ? 'text-success-600' : 'text-neutral-400'
    },
    {
      label: 'Total Invoices',
      value: totals.invoices,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: totals.invoices > 0 ? 'text-primary-600' : 'text-neutral-400'
    },
    {
      label: 'Total Contacts',
      value: totals.contacts,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: totals.contacts > 0 ? 'text-primary-600' : 'text-neutral-400'
    },
    {
      label: 'Health Score',
      value: activeConnections.length > 0 ? Math.round((healthyConnections / activeConnections.length) * 100) : 0,
      suffix: '%',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: healthyConnections === activeConnections.length && activeConnections.length > 0 
        ? 'text-success-600' 
        : healthyConnections > 0 
          ? 'text-warning-600' 
          : 'text-error-600'
    }
  ];
  
  if (connections.length === 0) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-h3 font-semibold text-neutral-900">Xero Integration Summary</h3>
          {mostRecentSync && (
            <div className="text-right">
              <p className="text-small text-neutral-600">Last sync</p>
              <p className="text-small font-medium text-neutral-900">
                {formatRelativeTime(mostRecentSync)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={cn('flex items-center justify-center mb-2', stat.color)}>
                {stat.icon}
              </div>
              <div className="text-h2 font-bold text-neutral-900">
                {formatNumber(stat.value, 0)}
                {stat.suffix}
                {stat.total && (
                  <span className="text-body text-neutral-500 font-normal">/{stat.total}</span>
                )}
              </div>
              <div className="text-small text-neutral-600">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        {activeConnections.length > 0 && (
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-small text-neutral-600">
                {activeConnections.length} organization{activeConnections.length !== 1 ? 's' : ''} connected
              </div>
              <div className="flex items-center space-x-2">
                {healthyConnections < activeConnections.length && (
                  <div className="flex items-center space-x-1 text-warning-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">
                      {activeConnections.length - healthyConnections} need attention
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroDataSummary;