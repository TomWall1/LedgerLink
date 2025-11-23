/**
 * Enhanced Export Utilities for Matching Results
 * 
 * UPDATED: Fixed to handle snake_case field names from backend/Xero API
 * - transaction_number (not transactionNumber)
 * - transaction_type (not type)
 * - issue_date (not date)
 * - due_date (not dueDate)
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
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
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
 * FIXED: Handle both camelCase and snake_case
 */
const getPartialPaymentDisplay = (item: any): string => {
  const isPartiallyPaid = item.is_partially_paid || item.isPartiallyPaid;
  if (!isPartiallyPaid) return 'No';
  
  const amountPaid = item.amount_paid || item.amountPaid;
  const originalAmount = item.original_amount || item.originalAmount;
  const percentPaid = calculatePercentagePaid(amountPaid, originalAmount);
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
 * FIXED: Handle snake_case field names
 */
export const preparePerfectMatchesForExport = (perfectMatches: PerfectMatch[]): any[] => {
  return perfectMatches.map(match => {
    // Try to find the record with data (handle both company1 and company2)
    const rec1 = match.company1 || {};
    const rec2 = match.company2 || {};
    const record = rec1.transaction_number || rec1.transactionNumber ? rec1 : rec2;
    
    return {
      transactionNumber: record.transaction_number || record.transactionNumber || '',
      type: record.transaction_type || record.type || '',
      amount: formatCurrencyForExport(record.amount || 0),
      date: formatDateForExport(record.issue_date || record.date),
      dueDate: formatDateForExport(record.due_date || record.dueDate),
      status: record.status || '',
      partiallyPaid: getPartialPaymentDisplay(record),
      paymentDate: formatDateForExport(record.payment_date || record.paymentDate),
      matchConfidence: `${match.confidence}%`,
      matchedOn: match.matchedOn ? match.matchedOn.join(', ') : ''
    };
  });
};

/**
 * Prepare mismatches for CSV export
 * FIXED: Handle snake_case field names
 */
export const prepareMismatchesForExport = (mismatches: Mismatch[]): any[] => {
  return mismatches.map(mismatch => {
    const rec1 = mismatch.company1 || {};
    const rec2 = mismatch.company2 || {};
    
    const receivableAmount = Math.abs(parseFloat(String(rec1.amount || 0)));
    const payableAmount = Math.abs(parseFloat(String(rec2.amount || 0)));
    const difference = Math.abs(receivableAmount - payableAmount);
    
    return {
      transactionNumber: rec1.transaction_number || rec1.transactionNumber || rec2.transaction_number || rec2.transactionNumber || '',
      type: rec1.transaction_type || rec1.type || rec2.transaction_type || rec2.type || '',
      receivableAmount: formatCurrencyForExport(receivableAmount),
      payableAmount: formatCurrencyForExport(payableAmount),
      difference: formatCurrencyForExport(difference),
      date: formatDateForExport(rec1.issue_date || rec1.date || rec2.issue_date || rec2.date),
      status: rec1.status || rec2.status || '',
      partiallyPaid: getPartialPaymentDisplay(rec1.is_partially_paid ? rec1 : rec2),
      paymentDate: formatDateForExport(rec1.payment_date || rec1.paymentDate || rec2.payment_date || rec2.paymentDate),
      matchConfidence: `${mismatch.confidence}%`,
      issues: mismatch.differences ? mismatch.differences.map(d => d.field).join(', ') : ''
    };
  });
};

/**
 * Prepare unmatched items for CSV export
 * FIXED: Handle snake_case field names
 */
export const prepareUnmatchedItemsForExport = (items: any[]): any[] => {
  return items.map(item => ({
    transactionNumber: item.transaction_number || item.transactionNumber || '',
    type: item.transaction_type || item.type || '',
    amount: formatCurrencyForExport(item.amount || 0),
    date: formatDateForExport(item.issue_date || item.date),
    dueDate: formatDateForExport(item.due_date || item.dueDate),
    status: item.status || '',
    partiallyPaid: getPartialPaymentDisplay(item),
    amountPaid: (item.is_partially_paid || item.isPartiallyPaid) ? formatCurrencyForExport(item.amount_paid || item.amountPaid || 0) : '',
    originalAmount: (item.is_partially_paid || item.isPartiallyPaid) ? formatCurrencyForExport(item.original_amount || item.originalAmount || 0) : ''
  }));
};

/**
 * Prepare historical insights for CSV export
 * FIXED: Handle snake_case field names
 */
export const prepareHistoricalInsightsForExport = (historicalInsights: any[]): any[] => {
  if (!historicalInsights || historicalInsights.length === 0) return [];
  
  return historicalInsights.map(insight => {
    const apItem = insight.apItem || {};
    const historicalMatch = insight.historicalMatch || {};
    const insightData = insight.insight || {};
    
    return {
      apTransactionNumber: apItem.transaction_number || apItem.transactionNumber || '',
      apAmount: formatCurrencyForExport(apItem.amount || 0),
      apDate: formatDateForExport(apItem.issue_date || apItem.date),
      apStatus: apItem.status || '',
      arTransactionNumber: historicalMatch.transaction_number || historicalMatch.transactionNumber || '',
      arOriginalAmount: formatCurrencyForExport(historicalMatch.original_amount || historicalMatch.originalAmount || 0),
      arCurrentAmount: formatCurrencyForExport(historicalMatch.amount || 0),
      arAmountPaid: formatCurrencyForExport(historicalMatch.amount_paid || historicalMatch.amountPaid || 0),
      arPercentPaid: calculatePercentagePaid(
        historicalMatch.amount_paid || historicalMatch.amountPaid, 
        historicalMatch.original_amount || historicalMatch.originalAmount
      ),
      arDate: formatDateForExport(historicalMatch.issue_date || historicalMatch.date),
      arStatus: historicalMatch.status || '',
      arPaymentDate: formatDateForExport(historicalMatch.payment_date || historicalMatch.paymentDate),
      insightType: insightData.type || '',
      insightMessage: insightData.message || '',
      insightSeverity: insightData.severity || ''
    };
  });
};

/**
 * Export perfect matches to CSV
 */
export const exportPerfectMatches = (perfectMatches: PerfectMatch[], filename?: string): void => {
  if (!perfectMatches || perfectMatches.length === 0) {
    console.warn('No perfect matches to export');
    return;
  }
  
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
  console.log(`✅ Exported ${perfectMatches.length} perfect matches to ${finalFilename}`);
};

/**
 * Export mismatches to CSV
 */
export const exportMismatches = (mismatches: Mismatch[], filename?: string): void => {
  if (!mismatches || mismatches.length === 0) {
    console.warn('No mismatches to export');
    return;
  }
  
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
  console.log(`✅ Exported ${mismatches.length} mismatches to ${finalFilename}`);
};

/**
 * Export unmatched receivables to CSV
 */
export const exportUnmatchedReceivables = (items: any[], filename?: string): void => {
  if (!items || items.length === 0) {
    console.warn('No unmatched receivables to export');
    return;
  }
  
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
  console.log(`✅ Exported ${items.length} unmatched receivables to ${finalFilename}`);
};

/**
 * Export unmatched payables to CSV
 */
export const exportUnmatchedPayables = (items: any[], filename?: string): void => {
  if (!items || items.length === 0) {
    console.warn('No unmatched payables to export');
    return;
  }
  
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
  console.log(`✅ Exported ${items.length} unmatched payables to ${finalFilename}`);
};

/**
 * Export historical insights to CSV
 */
export const exportHistoricalInsights = (insights: any[], filename?: string): void => {
  if (!insights || insights.length === 0) {
    console.warn('No historical insights to export');
    return;
  }
  
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
  console.log(`✅ Exported ${insights.length} historical insights to ${finalFilename}`);
};

/**
 * Export all data with date prefix
 */
export const exportAllData = (results: MatchingResults, filenamePrefix?: string): void => {
  const dateStr = new Date().toISOString().split('T')[0];
  const prefix = filenamePrefix || 'matching_results';
  
  let exportCount = 0;
  
  // Export each category
  if (results.perfectMatches && results.perfectMatches.length > 0) {
    exportPerfectMatches(results.perfectMatches, `${prefix}_perfect_matches_${dateStr}.csv`);
    exportCount++;
  }
  
  if (results.mismatches && results.mismatches.length > 0) {
    exportMismatches(results.mismatches, `${prefix}_mismatches_${dateStr}.csv`);
    exportCount++;
  }
  
  if (results.unmatchedItems && results.unmatchedItems.company1 && results.unmatchedItems.company1.length > 0) {
    exportUnmatchedReceivables(results.unmatchedItems.company1, `${prefix}_unmatched_receivables_${dateStr}.csv`);
    exportCount++;
  }
  
  if (results.unmatchedItems && results.unmatchedItems.company2 && results.unmatchedItems.company2.length > 0) {
    exportUnmatchedPayables(results.unmatchedItems.company2, `${prefix}_unmatched_payables_${dateStr}.csv`);
    exportCount++;
  }
  
  // Export historical insights if they exist
  if (results.historicalInsights && results.historicalInsights.length > 0) {
    exportHistoricalInsights(results.historicalInsights, `${prefix}_historical_insights_${dateStr}.csv`);
    exportCount++;
  }
  
  console.log(`✅ Exported ${exportCount} CSV files`);
};
