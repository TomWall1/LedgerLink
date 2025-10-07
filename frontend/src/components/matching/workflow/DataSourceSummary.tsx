/**
 * DataSourceSummary Component
 * 
 * Shows a summary of loaded data source (Xero or CSV)
 * Includes a clear button to remove the data
 */

import React from 'react';
import { Button } from '../../ui/Button';

interface DataSourceSummaryProps {
  source: 'xero' | 'csv';
  customerName?: string;
  fileName?: string;
  invoiceCount: number;
  onClear: () => void;
  label: string;
}

export const DataSourceSummary: React.FC<DataSourceSummaryProps> = ({
  source,
  customerName,
  fileName,
  invoiceCount,
  onClear,
  label,
}) => {
  const getSourceDisplay = () => {
    if (source === 'xero' && customerName) {
      return `Xero - ${customerName}`;
    } else if (source === 'csv' && fileName) {
      return `CSV - ${fileName}`;
    } else if (source === 'csv') {
      return 'CSV Upload';
    } else {
      return 'Xero';
    }
  };

  return (
    <div className="p-4 bg-success-50 border-2 border-success-200 rounded-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-body font-medium text-success-900 mb-1">
              ✓ {label} Loaded
            </div>
            <div className="text-small text-success-700">
              <span className="font-medium">{getSourceDisplay()}</span>
              <span className="mx-2">•</span>
              <span>{invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="ml-2 text-neutral-600 hover:text-neutral-900"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default DataSourceSummary;
