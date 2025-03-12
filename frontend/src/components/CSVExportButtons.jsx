import React from 'react';
import { 
  convertToCSV, 
  downloadCSV, 
  preparePerfectMatchesForExport,
  prepareMismatchesForExport,
  prepareUnmatchedItemsForExport,
  prepareHistoricalInsightsForExport
} from '../utils/exportUtils';

// Button component for CSV exports
const CSVExportButton = ({ onClick, text }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
  >
    {text}
  </button>
);

// Export functions for different data types
export const ExportPerfectMatchesButton = ({ data }) => {
  const exportPerfectMatchesCSV = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare data for export
    const exportData = preparePerfectMatchesForExport(data);
    
    // Define headers for the CSV
    const headers = [
      { key: 'transactionNumber', label: 'Transaction Number' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'originalAmount', label: 'Original Amount' }
    ];
    
    // Convert to CSV and download
    const csvContent = convertToCSV(exportData, headers);
    downloadCSV(csvContent, `ledgerlink-perfect-matches-${date}.csv`);
  };

  return <CSVExportButton onClick={exportPerfectMatchesCSV} text="Export to CSV" />;
};

export const ExportMismatchesButton = ({ data }) => {
  const exportMismatchesCSV = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare data for export
    const exportData = prepareMismatchesForExport(data);
    
    // Define headers for the CSV
    const headers = [
      { key: 'transactionNumber', label: 'Transaction Number' },
      { key: 'type', label: 'Type' },
      { key: 'receivableAmount', label: 'Receivable Amount' },
      { key: 'payableAmount', label: 'Payable Amount' },
      { key: 'difference', label: 'Difference' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'paymentDate', label: 'Payment Date' }
    ];
    
    // Convert to CSV and download
    const csvContent = convertToCSV(exportData, headers);
    downloadCSV(csvContent, `ledgerlink-mismatches-${date}.csv`);
  };

  return <CSVExportButton onClick={exportMismatchesCSV} text="Export to CSV" />;
};

export const ExportUnmatchedItemsButton = ({ data }) => {
  const exportUnmatchedItemsCSV = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare data for export
    const exportData = prepareUnmatchedItemsForExport(data);
    
    // Define headers for the CSV
    const headers = [
      { key: 'transactionNumber', label: 'Transaction Number' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'originalAmount', label: 'Original Amount' }
    ];
    
    // Convert to CSV and download company1 data (Receivables)
    if (exportData.company1.length > 0) {
      const csvContent = convertToCSV(exportData.company1, headers);
      downloadCSV(csvContent, `ledgerlink-unmatched-receivables-${date}.csv`);
    }
    
    // Convert to CSV and download company2 data (Payables)
    if (exportData.company2.length > 0) {
      const csvContent = convertToCSV(exportData.company2, headers);
      downloadCSV(csvContent, `ledgerlink-unmatched-payables-${date}.csv`);
    }
  };

  return <CSVExportButton onClick={exportUnmatchedItemsCSV} text="Export to CSV" />;
};

export const ExportHistoricalInsightsButton = ({ data }) => {
  const exportHistoricalInsightsCSV = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare data for export
    const exportData = prepareHistoricalInsightsForExport(data);
    
    // Define headers for the CSV
    const headers = [
      { key: 'apTransactionNumber', label: 'AP Transaction Number' },
      { key: 'apAmount', label: 'AP Amount' },
      { key: 'apDate', label: 'AP Date' },
      { key: 'apStatus', label: 'AP Status' },
      { key: 'arTransactionNumber', label: 'AR Transaction Number' },
      { key: 'arOriginalAmount', label: 'AR Original Amount' },
      { key: 'arCurrentAmount', label: 'AR Current Amount' },
      { key: 'arAmountPaid', label: 'AR Amount Paid' },
      { key: 'arDate', label: 'AR Date' },
      { key: 'arStatus', label: 'AR Status' },
      { key: 'arPaymentDate', label: 'AR Payment Date' },
      { key: 'insightType', label: 'Insight Type' },
      { key: 'insightMessage', label: 'Insight Message' },
      { key: 'insightSeverity', label: 'Insight Severity' }
    ];
    
    // Convert to CSV and download
    const csvContent = convertToCSV(exportData, headers);
    downloadCSV(csvContent, `ledgerlink-historical-insights-${date}.csv`);
  };

  return <CSVExportButton onClick={exportHistoricalInsightsCSV} text="Export to CSV" />;
};

export const ExportAllDataButton = ({ 
  totals, 
  perfectMatches, 
  mismatches, 
  unmatchedItems, 
  historicalInsights,
  perfectMatchAmount,
  mismatchAmount,
  unmatchedAmount 
}) => {
  const exportAllDataCSV = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Export a summary CSV
    const summaryData = [
      {
        'Category': 'Accounts Receivable Total',
        'Value': totals.company1Total
      },
      {
        'Category': 'Accounts Payable Total',
        'Value': totals.company2Total
      },
      {
        'Category': 'Variance',
        'Value': totals.variance
      },
      {
        'Category': 'Perfect Matches Count',
        'Value': perfectMatches.length
      },
      {
        'Category': 'Perfect Matches Amount',
        'Value': perfectMatchAmount
      },
      {
        'Category': 'Mismatches Count',
        'Value': mismatches.length
      },
      {
        'Category': 'Mismatches Amount',
        'Value': mismatchAmount
      },
      {
        'Category': 'Unmatched Items Count',
        'Value': (unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0)
      },
      {
        'Category': 'Unmatched Items Amount',
        'Value': unmatchedAmount
      },
      {
        'Category': 'Historical Insights Count',
        'Value': historicalInsights.length
      }
    ];
    
    const summaryHeaders = [
      { key: 'Category', label: 'Category' },
      { key: 'Value', label: 'Value' }
    ];
    
    const csvContent = convertToCSV(summaryData, summaryHeaders);
    downloadCSV(csvContent, `ledgerlink-reconciliation-summary-${date}.csv`);
    
    // Export perfect matches
    if (perfectMatches.length > 0) {
      const perfectMatchesExport = new ExportPerfectMatchesButton({ data: perfectMatches });
      perfectMatchesExport.props.onClick();
    }
    
    // Export mismatches
    if (mismatches.length > 0) {
      const mismatchesExport = new ExportMismatchesButton({ data: mismatches });
      mismatchesExport.props.onClick();
    }
    
    // Export unmatched items
    if ((unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0) > 0) {
      const unmatchedExport = new ExportUnmatchedItemsButton({ data: unmatchedItems });
      unmatchedExport.props.onClick();
    }
    
    // Export historical insights
    if (historicalInsights.length > 0) {
      const insightsExport = new ExportHistoricalInsightsButton({ data: historicalInsights });
      insightsExport.props.onClick();
    }
  };

  return <CSVExportButton onClick={exportAllDataCSV} text="Export All Data" />;
};

export default CSVExportButton;