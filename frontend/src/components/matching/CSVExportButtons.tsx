/**
 * CSV Export Buttons Component
 * 
 * This component provides individual export buttons for different matching result categories.
 * Each button exports its specific data category to a separate CSV file.
 */

import React from 'react';
import { Button } from '../ui/Button';
import { MatchingResults, PerfectMatch, Mismatch, TransactionRecord } from '../../types/matching';
import {
  exportPerfectMatches,
  exportMismatches,
  exportUnmatchedReceivables,
  exportUnmatchedPayables,
  exportHistoricalInsights,
  exportAllData
} from '../../utils/exportUtils';

interface ExportButtonProps {
  data: any;
  disabled?: boolean;
  className?: string;
}

/**
 * Export Perfect Matches Button
 */
export const ExportPerfectMatchesButton: React.FC<ExportButtonProps> = ({ data, disabled, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No perfect matches to export');
      return;
    }
    exportPerfectMatches(data);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      Export Perfect Matches
    </Button>
  );
};

/**
 * Export Mismatches Button
 */
export const ExportMismatchesButton: React.FC<ExportButtonProps> = ({ data, disabled, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No mismatches to export');
      return;
    }
    exportMismatches(data);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      Export Mismatches
    </Button>
  );
};

/**
 * Export Unmatched Receivables Button
 */
export const ExportUnmatchedReceivablesButton: React.FC<ExportButtonProps> = ({ data, disabled, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No unmatched receivables to export');
      return;
    }
    exportUnmatchedReceivables(data);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      Export Unmatched AR
    </Button>
  );
};

/**
 * Export Unmatched Payables Button
 */
export const ExportUnmatchedPayablesButton: React.FC<ExportButtonProps> = ({ data, disabled, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No unmatched payables to export');
      return;
    }
    exportUnmatchedPayables(data);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      Export Unmatched AP
    </Button>
  );
};

/**
 * Export Historical Insights Button
 */
export const ExportHistoricalInsightsButton: React.FC<ExportButtonProps> = ({ data, disabled, className }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No historical insights to export');
      return;
    }
    exportHistoricalInsights(data);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
      leftIcon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
    >
      Export Historical Insights
    </Button>
  );
};

/**
 * Export All Data Button
 * Exports all matching data to separate CSV files with date prefix
 */
interface ExportAllDataButtonProps {
  results: MatchingResults;
  totals?: any;
  perfectMatchAmount?: number;
  mismatchAmount?: number;
  unmatchedAmount?: number;
  disabled?: boolean;
  className?: string;
}

export const ExportAllDataButton: React.FC<ExportAllDataButtonProps> = ({
  results,
  disabled,
  className
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportAll = async () => {
    if (!results) {
      alert('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      exportAllData(results);
      // Show success message
      setTimeout(() => {
        alert('All data exported successfully! Check your downloads folder for multiple CSV files.');
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleExportAll}
      disabled={disabled || isExporting}
      className={className}
      leftIcon={
        isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )
      }
    >
      {isExporting ? 'Exporting...' : 'Export All Data'}
    </Button>
  );
};

// Export all components
export default {
  ExportPerfectMatchesButton,
  ExportMismatchesButton,
  ExportUnmatchedReceivablesButton,
  ExportUnmatchedPayablesButton,
  ExportHistoricalInsightsButton,
  ExportAllDataButton
};
