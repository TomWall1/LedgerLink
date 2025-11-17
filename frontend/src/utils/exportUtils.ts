/**
 * Enhanced Export Utilities for Matching Results
 * 
 * This file provides comprehensive CSV export functionality for matching results.
 * It generates properly formatted CSV files matching the Ledger-Match reference implementation.
 */

import { MatchingResults, PerfectMatch, Mismatch, TransactionRecord } from '../types/matching';

/**
 * Format currency for CSV export (without currency symbol)
 */
const formatCurrencyForExport = (amount: number): string => {
  return Math.abs(amount).toFixed(2);
};

/**
 * Format date for CSV export (DD/MM/YYYY format - Xero compatible)
 */
const formatDateForExport = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Calculate percentage of amount paid for partial payments
 */
const calculatePercentagePaid = (amountPaid: number | undefined, originalAmount: number | undefined): string => {
  if (!amountPaid || !originalAmount || originalAmount === 0) return '0%';
  const percentage = (amountPaid / originalAmount) * 100;
  return `${percentage.toFixed(1)}%`;
};

/**
 * Get partial payment display string
 */
const getPartialPaymentDisplay = (item: TransactionRecord): string => {
  if (!item.is_partially_paid) return 'No';
  const percentPaid = calculatePercentagePaid(item.amount_paid, item.original_amount);
  return `Yes (${percentPaid} paid)`;
};

/**
 * Core CSV conversion function
 * Converts array of objects to CSV format with proper escaping
 */
export const convertToCSV = (data: any[], headers: { key: string; label: string }[]): string => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }

  // Create CSV header row
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  
  // Create CSV data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key];
      // Handle different value types and ensure proper CSV formatting
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (typeof value === 'object') {
        // For objects (like dates), convert to string
        return `"${String(value).replace(/"/g, '""')}"`;
      } else {
        return `"${String(value)}"`;
      }
    }).join(',');
  }).join('\n');

  return `${headerRow}\n${rows}`;
};

/**
 * Trigger browser download of CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prepare perfect matches for CSV export
 */
export const preparePerfectMatchesForExport = (perfectMatches: PerfectMatch[]): any[] => {
  return perfectMatches.map(match => {
    const record = match.company1.transactionNumber ? match.company1 : match.company2;
    return {
      transactionNumber: record.transactionNumber || '',
      type: record.type || '',
      amount: formatCurrencyForExport(record.amount || 0),
      date: formatDateForExport(record.date),
      dueDate: formatDateForExport(record.dueDate),
      status: record.status || '',
      partiallyPaid: getPartialPaymentDisplay(record),
      paymentDate: formatDateForExport(record.payment_date),
      matchConfidence: `${match.confidence}%`,
      matchedOn: match.matchedOn.join(', ')
    };
  });
};

/**
 * Prepare mismatches for CSV export
 */
export const prepareMismatchesForExport = (mismatches: Mismatch[]): any[] => {
  return mismatches.map(mismatch => {
    const receivableAmount = Math.abs(parseFloat(String(mismatch.company1.amount || 0)));
    const payableAmount = Math.abs(parseFloat(String(mismatch.company2.amount || 0)));
    const difference = Math.abs(receivableAmount - payableAmount);
    
    return {
      transactionNumber: mismatch.company1.transactionNumber || mismatch.company2.transactionNumber || '',
      type: mismatch.company1.type || mismatch.company2.type || '',
      receivableAmount: formatCurrencyForExport(receivableAmount),
      payableAmount: formatCurrencyForExport(payableAmount),
      difference: formatCurrencyForExport(difference),
      date: formatDateForExport(mismatch.company1.date || mismatch.company2.date),
      status: mismatch.company1.status || mismatch.company2.status || '',
      partiallyPaid: getPartialPaymentDisplay(mismatch.company1.is_partially_paid ? mismatch.company1 : mismatch.company2),
      paymentDate: formatDateForExport(mismatch.company1.payment_date || mismatch.company2.payment_date),
      matchConfidence: `${mismatch.confidence}%`,
      issues: mismatch.differences.map(d => d.field).join(', ')
    };
  });
};

/**
 * Prepare unmatched items for CSV export
 */
export const prepareUnmatchedItemsForExport = (items: TransactionRecord[]): any[] => {
  return items.map(item => ({
    transactionNumber: item.transactionNumber || '',
    type: item.type || '',
    amount: formatCurrencyForExport(item.amount || 0),
    date: formatDateForExport(item.date),
    dueDate: formatDateForExport(item.dueDate),
    status: item.status || '',
    partiallyPaid: getPartialPaymentDisplay(item),
    amountPaid: item.is_partially_paid ? formatCurrencyForExport(item.amount_paid || 0) : '',
    originalAmount: item.is_partially_paid ? formatCurrencyForExport(item.original_amount || 0) : ''
  }));
};

/**
 * Prepare historical insights for CSV export
 */
export const prepareHistoricalInsightsForExport = (historicalInsights: any[]): any[] => {
  if (!historicalInsights || historicalInsights.length === 0) return [];
  
  return historicalInsights.map(insight => ({
    apTransactionNumber: insight.apItem?.transactionNumber || '',
    apAmount: formatCurrencyForExport(insight.apItem?.amount || 0),
    apDate: formatDateForExport(insight.apItem?.date),
    apStatus: insight.apItem?.status || '',
    arTransactionNumber: insight.historicalMatch?.transactionNumber || '',
    arOriginalAmount: formatCurrencyForExport(insight.historicalMatch?.original_amount || 0),
    arCurrentAmount: formatCurrencyForExport(insight.historicalMatch?.amount || 0),
    arAmountPaid: formatCurrencyForExport(insight.historicalMatch?.amount_paid || 0),
    arPercentPaid: calculatePercentagePaid(insight.historicalMatch?.amount_paid, insight.historicalMatch?.original_amount),
    arDate: formatDateForExport(insight.historicalMatch?.date),
    arStatus: insight.historicalMatch?.status || '',
    arPaymentDate: formatDateForExport(insight.historicalMatch?.payment_date),
    insightType: insight.insight?.type || '',
    insightMessage: insight.insight?.message || '',
    insightSeverity: insight.insight?.severity || ''
  }));
};

/**
 * Export perfect matches to CSV
 */
export const exportPerfectMatches = (perfectMatches: PerfectMatch[], filename?: string): void => {
  const data = preparePerfectMatchesForExport(perfectMatches);
  const headers = [
    { key: 'transactionNumber', label: 'Transaction #' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'partiallyPaid', label: 'Partially Paid' },
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'matchConfidence', label: 'Match Confidence' },
    { key: 'matchedOn', label: 'Matched On' }
  ];
  
  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `perfect_matches_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, finalFilename);
};

/**
 * Export mismatches to CSV
 */
export const exportMismatches = (mismatches: Mismatch[], filename?: string): void => {
  const data = prepareMismatchesForExport(mismatches);
  const headers = [
    { key: 'transactionNumber', label: 'Transaction #' },
    { key: 'type', label: 'Type' },
    { key: 'receivableAmount', label: 'Receivable Amount' },
    { key: 'payableAmount', label: 'Payable Amount' },
    { key: 'difference', label: 'Difference' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'partiallyPaid', label: 'Partially Paid' },
    { key: 'paymentDate', label: 'Payment Date' },
    { key: 'matchConfidence', label: 'Match Confidence' },
    { key: 'issues', label: 'Issues' }
  ];
  
  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `mismatches_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, finalFilename);
};

/**
 * Export unmatched receivables to CSV
 */
export const exportUnmatchedReceivables = (items: TransactionRecord[], filename?: string): void => {
  const data = prepareUnmatchedItemsForExport(items);
  const headers = [
    { key: 'transactionNumber', label: 'Transaction #' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'partiallyPaid', label: 'Partially Paid' },
    { key: 'amountPaid', label: 'Amount Paid' },
    { key: 'originalAmount', label: 'Original Amount' }
  ];
  
  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `unmatched_receivables_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, finalFilename);
};

/**
 * Export unmatched payables to CSV
 */
export const exportUnmatchedPayables = (items: TransactionRecord[], filename?: string): void => {
  const data = prepareUnmatchedItemsForExport(items);
  const headers = [
    { key: 'transactionNumber', label: 'Transaction #' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
    { key: 'partiallyPaid', label: 'Partially Paid' },
    { key: 'amountPaid', label: 'Amount Paid' },
    { key: 'originalAmount', label: 'Original Amount' }
  ];
  
  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `unmatched_payables_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, finalFilename);
};

/**
 * Export historical insights to CSV
 */
export const exportHistoricalInsights = (insights: any[], filename?: string): void => {
  const data = prepareHistoricalInsightsForExport(insights);
  const headers = [
    { key: 'apTransactionNumber', label: 'AP Transaction #' },
    { key: 'apAmount', label: 'AP Amount' },
    { key: 'apDate', label: 'AP Date' },
    { key: 'apStatus', label: 'AP Status' },
    { key: 'arTransactionNumber', label: 'AR Transaction #' },
    { key: 'arOriginalAmount', label: 'AR Original Amount' },
    { key: 'arCurrentAmount', label: 'AR Current Amount' },
    { key: 'arAmountPaid', label: 'AR Amount Paid' },
    { key: 'arPercentPaid', label: 'AR % Paid' },
    { key: 'arDate', label: 'AR Date' },
    { key: 'arStatus', label: 'AR Status' },
    { key: 'arPaymentDate', label: 'AR Payment Date' },
    { key: 'insightType', label: 'Insight Type' },
    { key: 'insightMessage', label: 'Insight Message' },
    { key: 'insightSeverity', label: 'Severity' }
  ];
  
  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `historical_insights_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, finalFilename);
};

/**
 * Export all data with date prefix
 */
export const exportAllData = (results: MatchingResults, filenamePrefix?: string): void => {
  const dateStr = new Date().toISOString().split('T')[0];
  const prefix = filenamePrefix || 'matching_results';
  
  // Export each category
  if (results.perfectMatches.length > 0) {
    exportPerfectMatches(results.perfectMatches, `${prefix}_perfect_matches_${dateStr}.csv`);
  }
  
  if (results.mismatches.length > 0) {
    exportMismatches(results.mismatches, `${prefix}_mismatches_${dateStr}.csv`);
  }
  
  if (results.unmatchedItems.company1.length > 0) {
    exportUnmatchedReceivables(results.unmatchedItems.company1, `${prefix}_unmatched_receivables_${dateStr}.csv`);
  }
  
  if (results.unmatchedItems.company2.length > 0) {
    exportUnmatchedPayables(results.unmatchedItems.company2, `${prefix}_unmatched_payables_${dateStr}.csv`);
  }
  
  // Export historical insights if they exist
  if (results.historicalInsights && results.historicalInsights.length > 0) {
    exportHistoricalInsights(results.historicalInsights, `${prefix}_historical_insights_${dateStr}.csv`);
  }
};

// Legacy exports for backward compatibility
export {
  preparePerfectMatchesForExport as preparePerfectMatchesForExport,
  prepareMismatchesForExport as prepareMismatchesForExport,
  prepareUnmatchedItemsForExport as prepareUnmatchedItemsForExport,
  prepareHistoricalInsightsForExport as prepareHistoricalInsightsForExport
};
