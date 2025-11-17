/**
 * Matching Results Display Component
 * 
 * This component displays the results of invoice matching in a clear,
 * organized way. Think of it as a digital report that shows you
 * exactly what matches, what doesn't, and why.
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { MatchingResults, PerfectMatch, Mismatch, TransactionRecord } from '../../types/matching';
import matchingService from '../../services/matchingService';

interface MatchingResultsDisplayProps {
  results: MatchingResults;
  onExport?: () => void;
  onStartNew?: () => void;
}

export const MatchingResultsDisplay: React.FC<MatchingResultsDisplayProps> = ({
  results,
  onExport,
  onStartNew
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'mismatches' | 'unmatched'>('matches');
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    let variant: 'success' | 'warning' | 'error' | 'default' = 'default';
    
    if (statusLower === 'paid') {
      variant = 'success';
    } else if (statusLower.includes('open') || statusLower.includes('authorised')) {
      variant = 'warning';
    } else if (statusLower.includes('void')) {
      variant = 'error';
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  /**
   * Get confidence badge styling
   */
  const getConfidenceBadge = (confidence: number) => {
    let variant: 'success' | 'warning' | 'error' = 'success';
    
    if (confidence < 70) {
      variant = 'error';
    } else if (confidence < 90) {
      variant = 'warning';
    }

    return <Badge variant={variant}>{confidence}%</Badge>;
  };

  /**
   * Handle export functionality
   */
  const handleExport = async () => {
    if (!results.matchId) {
      alert('Cannot export: No match ID available');
      return;
    }

    setIsExporting(true);
    try {
      await matchingService.exportToCSV(results.matchId);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Calculate summary statistics
   */
  const stats = {
    total: results.perfectMatches.length + results.mismatches.length + 
           results.unmatchedItems.company1.length + results.unmatchedItems.company2.length,
    matched: results.perfectMatches.length + results.mismatches.length,
    matchRate: results.statistics.matchRate,
    totalAmount: results.totals.company1Total + results.totals.company2Total,
    matchedAmount: results.totals.perfectMatchTotal + results.totals.mismatchTotal,
    variance: Math.abs(results.totals.variance)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Matching Results</h2>
          <p className="text-neutral-600">
            Processing completed in {(results.processingTime / 1000).toFixed(2)} seconds
          </p>
        </div>
        
        <div className="flex space-x-3">
          {onStartNew && (
            <Button variant="ghost" onClick={onStartNew}>
              Start New Match
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onExport || handleExport}
            disabled={isExporting}
            leftIcon={
              isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            }
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{(stats.matchRate || 0).toFixed(1)}%</div>
            <div className="text-sm text-neutral-600">Match Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-neutral-600">Total Records</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.matchedAmount)}</div>
            <div className="text-sm text-neutral-600">Matched Amount</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.variance)}</div>
            <div className="text-sm text-neutral-600">Variance</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'matches' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('matches')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{results.perfectMatches.length}</div>
            <div className="text-sm text-neutral-600">Perfect Matches</div>
            <div className="text-xs text-neutral-500 mt-1">
              {formatCurrency(results.totals.perfectMatchTotal)}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'mismatches' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('mismatches')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{results.mismatches.length}</div>
            <div className="text-sm text-neutral-600">Mismatches</div>
            <div className="text-xs text-neutral-500 mt-1">
              {formatCurrency(results.totals.mismatchTotal)}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'unmatched' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
          onClick={() => setActiveTab('unmatched')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">
              {results.unmatchedItems.company1.length + results.unmatchedItems.company2.length}
            </div>
            <div className="text-sm text-neutral-600">Unmatched</div>
            <div className="text-xs text-neutral-500 mt-1">
              {formatCurrency(results.totals.unmatchedTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              {activeTab === 'matches' && 'Perfect Matches'}
              {activeTab === 'mismatches' && 'Mismatches & Discrepancies'}
              {activeTab === 'unmatched' && 'Unmatched Items'}
            </h3>
            
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'matches' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('matches')}
              >
                Matches ({results.perfectMatches.length})
              </Button>
              <Button
                variant={activeTab === 'mismatches' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('mismatches')}
              >
                Mismatches ({results.mismatches.length})
              </Button>
              <Button
                variant={activeTab === 'unmatched' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('unmatched')}
              >
                Unmatched ({results.unmatchedItems.company1.length + results.unmatchedItems.company2.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Perfect Matches */}
          {activeTab === 'matches' && (
            <div className="overflow-x-auto">
              {results.perfectMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Matched On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.perfectMatches.map((match, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {match.company1.transactionNumber || match.company2.transactionNumber}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(match.company1.amount || match.company2.amount || 0)}
                        </TableCell>
                        <TableCell>
                          {formatDate(match.company1.date || match.company2.date)}
                        </TableCell>
                        <TableCell>
                          {formatDate(match.company1.dueDate || match.company2.dueDate)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(match.company1.status || match.company2.status)}
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(match.confidence)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {match.matchedOn.map((field, i) => (
                              <Badge key={i} variant="default" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  No perfect matches found
                </div>
              )}
            </div>
          )}

          {/* Mismatches */}
          {activeTab === 'mismatches' && (
            <div className="overflow-x-auto">
              {results.mismatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Company 1 Amount</TableHead>
                      <TableHead>Company 2 Amount</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.mismatches.map((mismatch, index) => {
                      const difference = Math.abs(
                        (mismatch.company1.amount || 0) - (mismatch.company2.amount || 0)
                      );
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {mismatch.company1.transactionNumber || mismatch.company2.transactionNumber}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(mismatch.company1.amount || 0)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(mismatch.company2.amount || 0)}
                          </TableCell>
                          <TableCell className="font-mono text-orange-600">
                            {formatCurrency(difference)}
                          </TableCell>
                          <TableCell>
                            {formatDate(mismatch.company1.date || mismatch.company2.date)}
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(mismatch.confidence)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {mismatch.differences.map((diff, i) => (
                                <Badge key={i} variant="warning" className="text-xs">
                                  {diff.field}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  No mismatches found
                </div>
              )}
            </div>
          )}

          {/* Unmatched Items */}
          {activeTab === 'unmatched' && (
            <div className="space-y-6">
              {/* Company 1 Unmatched */}
              <div>
                <h4 className="text-md font-medium text-neutral-900 mb-3 px-6">
                  Company 1 Unmatched ({results.unmatchedItems.company1.length})
                </h4>
                <div className="overflow-x-auto">
                  {results.unmatchedItems.company1.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.unmatchedItems.company1.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{item.transactionNumber}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(item.amount)}</TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.type || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-4 text-center text-neutral-500">
                      All Company 1 records were matched
                    </div>
                  )}
                </div>
              </div>

              {/* Company 2 Unmatched */}
              <div>
                <h4 className="text-md font-medium text-neutral-900 mb-3 px-6">
                  Company 2 Unmatched ({results.unmatchedItems.company2.length})
                </h4>
                <div className="overflow-x-auto">
                  {results.unmatchedItems.company2.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.unmatchedItems.company2.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{item.transactionNumber}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(item.amount)}</TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell>{item.type || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-4 text-center text-neutral-500">
                      All Company 2 records were matched
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div>
              <span className="font-medium">Processing Time:</span> {(results.processingTime / 1000).toFixed(2)}s
            </div>
            <div>
              <span className="font-medium">Total Variance:</span> {formatCurrency(Math.abs(results.totals.variance))}
            </div>
            <div>
              <span className="font-medium">Average Confidence:</span> {(results.statistics.avgConfidence || 0).toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchingResultsDisplay;