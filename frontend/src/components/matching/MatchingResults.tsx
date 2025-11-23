/**
 * Enhanced Matching Results Display Component with Pagination
 * 
 * This component provides a comprehensive, professional display of matching results
 * with pagination/scrolling to handle large datasets efficiently.
 * 
 * UPDATED: Fixed table layout to use full width with properly sized columns
 * FIXED: Removed cramped horizontal scrolling, tables now expand to fill container
 */

import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { MatchingResults, PerfectMatch, Mismatch, TransactionRecord, DateMismatch, HistoricalInsight } from '../../types/matching';
import {
  ExportAllDataButton,
  ExportPerfectMatchesButton,
  ExportMismatchesButton,
  ExportUnmatchedReceivablesButton,
  ExportUnmatchedPayablesButton,
  ExportHistoricalInsightsButton
} from './CSVExportButtons';

interface MatchingResultsDisplayProps {
  results: MatchingResults;
  onStartNew?: () => void;
}

const INITIAL_DISPLAY_COUNT = 5; // Show first 5 results by default

export const MatchingResultsDisplay: React.FC<MatchingResultsDisplayProps> = ({
  results,
  onStartNew
}) => {
  // Refs for scrolling to sections
  const perfectMatchesRef = useRef<HTMLDivElement>(null);
  const mismatchesRef = useRef<HTMLDivElement>(null);
  const unmatchedRef = useRef<HTMLDivElement>(null);
  const dateDiscrepanciesRef = useRef<HTMLDivElement>(null);

  // State for expandable sections
  const [showAllPerfectMatches, setShowAllPerfectMatches] = useState(false);
  const [showAllMismatches, setShowAllMismatches] = useState(false);
  const [showAllUnmatchedReceivables, setShowAllUnmatchedReceivables] = useState(false);
  const [showAllUnmatchedPayables, setShowAllUnmatchedPayables] = useState(false);
  const [showAllDateMismatches, setShowAllDateMismatches] = useState(false);
  const [showAllHistoricalInsights, setShowAllHistoricalInsights] = useState(false);

  /**
   * Safe number conversion - handles undefined/null
   */
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  /**
   * Format currency for display (USD)
   */
  const formatCurrency = (amount: any): string => {
    const num = safeNumber(amount, 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(num));
  };

  /**
   * Format date for display (DD/MM/YYYY)
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  /**
   * Format percentage for display
   */
  const formatPercentage = (amount: any, total: any): string => {
    const amountNum = safeNumber(amount, 0);
    const totalNum = safeNumber(total, 0);
    if (totalNum === 0) return '0%';
    return `${((amountNum / totalNum) * 100).toFixed(1)}%`;
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
   * Get partial payment badge
   */
  const getPartialPaymentBadge = (item: TransactionRecord) => {
    if (!item.is_partially_paid) return null;
    
    const amountPaid = safeNumber(item.amount_paid, 0);
    const originalAmount = safeNumber(item.original_amount, 0);
    
    const percentPaid = originalAmount > 0
      ? ((amountPaid / originalAmount) * 100).toFixed(1)
      : '0';
    
    return (
      <Badge variant="warning" className="text-xs ml-2">
        {percentPaid}% Paid
      </Badge>
    );
  };

  /**
   * Get insight badge class based on severity
   */
  const getInsightBadgeClass = (severity: 'error' | 'warning' | 'info'): 'error' | 'warning' | 'default' => {
    if (severity === 'error') return 'error';
    if (severity === 'warning') return 'warning';
    return 'default';
  };

  /**
   * Scroll to section
   */
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Get display array with optional limiting
   */
  const getDisplayArray = <T,>(array: T[], showAll: boolean): T[] => {
    if (showAll || array.length <= INITIAL_DISPLAY_COUNT) {
      return array;
    }
    return array.slice(0, INITIAL_DISPLAY_COUNT);
  };

  /**
   * Render "Show More" button if needed
   */
  const renderShowMoreButton = (
    totalCount: number,
    showAll: boolean,
    onToggle: () => void,
    label: string = 'results'
  ) => {
    if (totalCount <= INITIAL_DISPLAY_COUNT) return null;

    return (
      <div className="flex justify-center py-4 border-t border-neutral-200">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="text-sm"
        >
          {showAll ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Show Less
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Show More ({totalCount - INITIAL_DISPLAY_COUNT} more {label})
            </>
          )}
        </Button>
      </div>
    );
  };

  /**
   * Calculate summary statistics with safe defaults
   */
  const totals = results.totals || {};
  const statistics = results.statistics || {};
  
  const company1Total = safeNumber(totals.company1Total, 0);
  const company2Total = safeNumber(totals.company2Total, 0);
  const variance = safeNumber(totals.variance, 0);
  const perfectMatchTotal = safeNumber(totals.perfectMatchTotal, 0);
  const mismatchTotal = safeNumber(totals.mismatchTotal, 0);
  const unmatchedTotal = safeNumber(totals.unmatchedTotal, 0);
  
  const totalAmount = company1Total + company2Total;
  const matchedAmount = perfectMatchTotal + mismatchTotal;
  const unmatchedAmount = unmatchedTotal;
  const perfectMatchAmount = perfectMatchTotal;
  const mismatchAmount = mismatchTotal;

  const perfectMatches = results.perfectMatches || [];
  const mismatches = results.mismatches || [];
  const unmatchedCompany1 = results.unmatchedItems?.company1 || [];
  const unmatchedCompany2 = results.unmatchedItems?.company2 || [];
  
  const totalRecords = perfectMatches.length + mismatches.length + unmatchedCompany1.length + unmatchedCompany2.length;
  
  const perfectMatchPercentage = totalRecords > 0
    ? ((perfectMatches.length / totalRecords) * 100).toFixed(1)
    : '0';
  
  const mismatchPercentage = totalRecords > 0
    ? ((mismatches.length / totalRecords) * 100).toFixed(1)
    : '0';
  
  const unmatchedPercentage = totalRecords > 0
    ? (((unmatchedCompany1.length + unmatchedCompany2.length) / totalRecords) * 100).toFixed(1)
    : '0';

  const processingTime = safeNumber(results.processingTime, 0);
  const avgConfidence = safeNumber(statistics.avgConfidence, 0);

  // Get display arrays
  const displayedPerfectMatches = getDisplayArray(perfectMatches, showAllPerfectMatches);
  const displayedMismatches = getDisplayArray(mismatches, showAllMismatches);
  const displayedUnmatchedCompany1 = getDisplayArray(unmatchedCompany1, showAllUnmatchedReceivables);
  const displayedUnmatchedCompany2 = getDisplayArray(unmatchedCompany2, showAllUnmatchedPayables);
  const displayedDateMismatches = getDisplayArray(results.dateMismatches || [], showAllDateMismatches);
  const displayedHistoricalInsights = getDisplayArray(results.historicalInsights || [], showAllHistoricalInsights);

  return (
    <div className="space-y-6">
      {/* Header with Export All Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B365D]">Matching Results</h2>
          <p className="text-neutral-600">
            Processing completed in {(processingTime / 1000).toFixed(2)} seconds
          </p>
        </div>
        
        <div className="flex space-x-3">
          {onStartNew && (
            <Button variant="ghost" onClick={onStartNew}>
              Start New Match
            </Button>
          )}
          <ExportAllDataButton results={results} />
        </div>
      </div>

      {/* Summary Cards: AR Total, AP Total, Variance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-[#00A4B4]">
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600 mb-1">AR Total (Accounts Receivable)</div>
            <div className="text-3xl font-bold text-[#00A4B4]">
              {formatCurrency(company1Total)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-[#00A4B4]">
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600 mb-1">AP Total (Accounts Payable)</div>
            <div className="text-3xl font-bold text-[#00A4B4]">
              {formatCurrency(company2Total)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${Math.abs(variance) < 1 ? 'border-green-500' : 'border-red-500'}`}>
          <CardContent className="p-6">
            <div className="text-sm text-neutral-600 mb-1">Variance</div>
            <div className={`text-3xl font-bold ${Math.abs(variance) < 1 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(variance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Summary Cards (4 clickable cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Perfect Matches */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2 border-green-500"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {perfectMatches.length}
            </div>
            <div className="text-sm font-medium text-neutral-900 mb-1">Perfect Matches</div>
            <div className="text-xs text-neutral-600 mb-2">{formatCurrency(perfectMatchAmount)}</div>
            <Badge variant="success" className="text-xs">{perfectMatchPercentage}%</Badge>
          </CardContent>
        </Card>

        {/* Mismatches */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2 border-yellow-500"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {mismatches.length}
            </div>
            <div className="text-sm font-medium text-neutral-900 mb-1">Mismatches</div>
            <div className="text-xs text-neutral-600 mb-2">{formatCurrency(mismatchAmount)}</div>
            <Badge variant="warning" className="text-xs">{mismatchPercentage}%</Badge>
          </CardContent>
        </Card>

        {/* Unmatched Items */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2 border-red-500"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {unmatchedCompany1.length + unmatchedCompany2.length}
            </div>
            <div className="text-sm font-medium text-neutral-900 mb-1">Unmatched Items</div>
            <div className="text-xs text-neutral-600 mb-2">{formatCurrency(unmatchedAmount)}</div>
            <Badge variant="error" className="text-xs">{unmatchedPercentage}%</Badge>
          </CardContent>
        </Card>

        {/* Date Discrepancies */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg border-2 border-purple-500"
          onClick={() => scrollToSection(dateDiscrepanciesRef)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {results.dateMismatches?.length || 0}
            </div>
            <div className="text-sm font-medium text-neutral-900 mb-1">Date Discrepancies</div>
            <div className="text-xs text-neutral-600">
              Matched with different dates
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef}>
        <Card className="border-l-4 border-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1B365D]">
                  Perfect Matches ({perfectMatches.length})
                </h3>
                {perfectMatches.length > INITIAL_DISPLAY_COUNT && (
                  <p className="text-sm text-neutral-600 mt-1">
                    Showing {displayedPerfectMatches.length} of {perfectMatches.length} matches
                  </p>
                )}
              </div>
              <ExportPerfectMatchesButton data={perfectMatches} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={showAllPerfectMatches && perfectMatches.length > INITIAL_DISPLAY_COUNT ? "max-h-96 overflow-y-auto" : ""}>
              {perfectMatches.length > 0 ? (
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">Transaction #</TableHead>
                        <TableHead className="w-32">Type</TableHead>
                        <TableHead className="w-40">Amount</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead className="w-32">Due Date</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedPerfectMatches.map((match, index) => {
                        const record = match.company1?.transactionNumber ? match.company1 : match.company2;
                        if (!record) return null;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{record.transactionNumber || '-'}</TableCell>
                            <TableCell>{record.type || '-'}</TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(record.amount)}
                              {getPartialPaymentBadge(record)}
                            </TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{formatDate(record.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  No perfect matches found
                </div>
              )}
            </div>
            {renderShowMoreButton(perfectMatches.length, showAllPerfectMatches, () => setShowAllPerfectMatches(!showAllPerfectMatches), 'matches')}
          </CardContent>
        </Card>
      </div>

      {/* Mismatches Section */}
      <div ref={mismatchesRef}>
        <Card className="border-l-4 border-yellow-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1B365D]">
                  Mismatches ({mismatches.length})
                </h3>
                {mismatches.length > INITIAL_DISPLAY_COUNT && (
                  <p className="text-sm text-neutral-600 mt-1">
                    Showing {displayedMismatches.length} of {mismatches.length} mismatches
                  </p>
                )}
              </div>
              <ExportMismatchesButton data={mismatches} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={showAllMismatches && mismatches.length > INITIAL_DISPLAY_COUNT ? "max-h-96 overflow-y-auto" : ""}>
              {mismatches.length > 0 ? (
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-44">Transaction #</TableHead>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead className="w-40">Receivable Amount</TableHead>
                        <TableHead className="w-40">Payable Amount</TableHead>
                        <TableHead className="w-32">Difference</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedMismatches.map((mismatch, index) => {
                        const amount1 = safeNumber(mismatch.company1?.amount, 0);
                        const amount2 = safeNumber(mismatch.company2?.amount, 0);
                        const difference = Math.abs(amount1 - amount2);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono">
                              {mismatch.company1?.transactionNumber || mismatch.company2?.transactionNumber || '-'}
                            </TableCell>
                            <TableCell>{mismatch.company1?.type || mismatch.company2?.type || '-'}</TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(amount1)}
                              {mismatch.company1 && getPartialPaymentBadge(mismatch.company1)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(amount2)}
                              {mismatch.company2 && getPartialPaymentBadge(mismatch.company2)}
                            </TableCell>
                            <TableCell className="font-mono text-orange-600">
                              {formatCurrency(difference)}
                            </TableCell>
                            <TableCell>
                              {formatDate(mismatch.company1?.date || mismatch.company2?.date)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(mismatch.company1?.status || mismatch.company2?.status)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  No mismatches found
                </div>
              )}
            </div>
            {renderShowMoreButton(mismatches.length, showAllMismatches, () => setShowAllMismatches(!showAllMismatches), 'mismatches')}
          </CardContent>
        </Card>
      </div>

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef}>
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <h3 className="text-lg font-semibold text-[#1B365D]">
              Unmatched Items ({unmatchedCompany1.length + unmatchedCompany2.length})
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Unmatched Receivables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-md font-medium text-neutral-900">
                    Unmatched Receivables ({unmatchedCompany1.length})
                  </h4>
                  {unmatchedCompany1.length > INITIAL_DISPLAY_COUNT && (
                    <p className="text-sm text-neutral-600 mt-1">
                      Showing {displayedUnmatchedCompany1.length} of {unmatchedCompany1.length} items
                    </p>
                  )}
                </div>
                <ExportUnmatchedReceivablesButton data={unmatchedCompany1} />
              </div>
              <div className={showAllUnmatchedReceivables && unmatchedCompany1.length > INITIAL_DISPLAY_COUNT ? "max-h-96 overflow-y-auto" : ""}>
                {unmatchedCompany1.length > 0 ? (
                  <div className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/5">Transaction #</TableHead>
                          <TableHead className="w-1/5">Amount</TableHead>
                          <TableHead className="w-1/5">Date</TableHead>
                          <TableHead className="w-1/5">Due Date</TableHead>
                          <TableHead className="w-1/5">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedUnmatchedCompany1.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{item.transactionNumber || '-'}</TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(item.amount)}
                              {getPartialPaymentBadge(item)}
                            </TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    All receivables were matched
                  </div>
                )}
              </div>
              {renderShowMoreButton(unmatchedCompany1.length, showAllUnmatchedReceivables, () => setShowAllUnmatchedReceivables(!showAllUnmatchedReceivables), 'items')}
            </div>

            {/* Unmatched Payables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-md font-medium text-neutral-900">
                    Unmatched Payables ({unmatchedCompany2.length})
                  </h4>
                  {unmatchedCompany2.length > INITIAL_DISPLAY_COUNT && (
                    <p className="text-sm text-neutral-600 mt-1">
                      Showing {displayedUnmatchedCompany2.length} of {unmatchedCompany2.length} items
                    </p>
                  )}
                </div>
                <ExportUnmatchedPayablesButton data={unmatchedCompany2} />
              </div>
              <div className={showAllUnmatchedPayables && unmatchedCompany2.length > INITIAL_DISPLAY_COUNT ? "max-h-96 overflow-y-auto" : ""}>
                {unmatchedCompany2.length > 0 ? (
                  <div className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/5">Transaction #</TableHead>
                          <TableHead className="w-1/5">Amount</TableHead>
                          <TableHead className="w-1/5">Date</TableHead>
                          <TableHead className="w-1/5">Due Date</TableHead>
                          <TableHead className="w-1/5">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedUnmatchedCompany2.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{item.transactionNumber || '-'}</TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(item.amount)}
                              {getPartialPaymentBadge(item)}
                            </TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-500">
                    All payables were matched
                  </div>
                )}
              </div>
              {renderShowMoreButton(unmatchedCompany2.length, showAllUnmatchedPayables, () => setShowAllUnmatchedPayables(!showAllUnmatchedPayables), 'items')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Discrepancies Section (only show if exists) */}
      {results.dateMismatches && results.dateMismatches.length > 0 && (
        <div ref={dateDiscrepanciesRef}>
          <Card className="border-l-4 border-purple-500">
            <CardHeader>
              <div>
                <h3 className="text-lg font-semibold text-[#1B365D]">
                  Date Discrepancies ({results.dateMismatches.length})
                </h3>
                {results.dateMismatches.length > INITIAL_DISPLAY_COUNT && (
                  <p className="text-sm text-neutral-600 mt-1">
                    Showing {displayedDateMismatches.length} of {results.dateMismatches.length} discrepancies
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={showAllDateMismatches && results.dateMismatches.length > INITIAL_DISPLAY_COUNT ? "max-h-96 overflow-y-auto" : ""}>
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">Transaction #</TableHead>
                        <TableHead className="w-28">Type</TableHead>
                        <TableHead className="w-32">Amount</TableHead>
                        <TableHead className="w-40">Discrepancy Type</TableHead>
                        <TableHead className="w-28">AR Date</TableHead>
                        <TableHead className="w-28">AP Date</TableHead>
                        <TableHead className="w-32">Days Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedDateMismatches.map((mismatch, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {mismatch.company1?.transactionNumber || '-'}
                          </TableCell>
                          <TableCell>{mismatch.company1?.type || '-'}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(mismatch.company1?.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="warning">{mismatch.mismatchType?.replace('_', ' ') || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(mismatch.company1Date)}</TableCell>
                          <TableCell>{formatDate(mismatch.company2Date)}</TableCell>
                          <TableCell>
                            <span className="font-medium text-purple-600">
                              {Math.abs(safeNumber(mismatch.daysDifference, 0))} days
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {renderShowMoreButton(results.dateMismatches.length, showAllDateMismatches, () => setShowAllDateMismatches(!showAllDateMismatches), 'discrepancies')}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical Insights Section (only show if exists) */}
      {results.historicalInsights && results.historicalInsights.length > 0 && (
        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1B365D]">
                  Historical Insights ({results.historicalInsights.length})
                </h3>
                {results.historicalInsights.length > INITIAL_DISPLAY_COUNT && (
                  <p className="text-sm text-neutral-600 mt-1">
                    Showing {displayedHistoricalInsights.length} of {results.historicalInsights.length} insights
                  </p>
                )}
              </div>
              <ExportHistoricalInsightsButton data={results.historicalInsights} />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className={showAllHistoricalInsights && results.historicalInsights.length > INITIAL_DISPLAY_COUNT ? "grid grid-cols-1 gap-4 max-h-96 overflow-y-auto" : "grid grid-cols-1 gap-4"}>
              {displayedHistoricalInsights.map((insight, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg">
                  {/* AP Item */}
                  <div className="border-r border-neutral-200 pr-4">
                    <div className="text-xs font-medium text-neutral-600 mb-2">AP Item</div>
                    <div className="space-y-1">
                      <div className="font-mono text-sm">{insight.apItem?.transactionNumber || '-'}</div>
                      <div className="text-sm font-medium">{formatCurrency(insight.apItem?.amount)}</div>
                      <div className="text-xs text-neutral-600">{formatDate(insight.apItem?.date)}</div>
                    </div>
                  </div>

                  {/* AR Historical Match */}
                  <div className="border-r border-neutral-200 pr-4">
                    <div className="text-xs font-medium text-neutral-600 mb-2">AR Historical Match</div>
                    <div className="space-y-1">
                      <div className="font-mono text-sm">{insight.historicalMatch?.transactionNumber || '-'}</div>
                      <div className="text-sm">
                        Original: {formatCurrency(insight.historicalMatch?.original_amount)}
                      </div>
                      <div className="text-sm text-green-600">
                        Paid: {formatCurrency(insight.historicalMatch?.amount_paid)}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {formatDate(insight.historicalMatch?.payment_date)}
                      </div>
                    </div>
                  </div>

                  {/* Insight */}
                  <div className="pl-4">
                    <div className="text-xs font-medium text-neutral-600 mb-2">Insight</div>
                    <Badge variant={getInsightBadgeClass(insight.insight?.severity || 'info')} className="mb-2">
                      {insight.insight?.type || 'Unknown'}
                    </Badge>
                    <div className="text-sm text-neutral-700">{insight.insight?.message || 'No details available'}</div>
                  </div>
                </div>
              ))}
            </div>
            {renderShowMoreButton(results.historicalInsights.length, showAllHistoricalInsights, () => setShowAllHistoricalInsights(!showAllHistoricalInsights), 'insights')}
          </CardContent>
        </Card>
      )}

      {/* Processing Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div>
              <span className="font-medium text-[#1B365D]">Processing Time:</span>{' '}
              {(processingTime / 1000).toFixed(2)}s
            </div>
            <div>
              <span className="font-medium text-[#1B365D]">Total Variance:</span>{' '}
              {formatCurrency(Math.abs(variance))}
            </div>
            <div>
              <span className="font-medium text-[#1B365D]">Average Confidence:</span>{' '}
              {avgConfidence.toFixed(1)}%
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchingResultsDisplay;
