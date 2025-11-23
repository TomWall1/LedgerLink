/**
 * MatchingReadyButton Component
 * 
 * Centered button that appears when both AR and AP data sources are loaded.
 * Shows a summary of what will be matched and provides the Start Matching action.
 */

import React from 'react';
import { Button } from '../../ui/Button';

interface LoadedDataSource {
  type: 'xero' | 'csv';
  invoices: any[];
  customerName?: string;
  fileName?: string;
  invoiceCount: number;
}

interface MatchingReadyButtonProps {
  arData: LoadedDataSource | null;
  apData: LoadedDataSource | null;
  onStartMatching: () => void;
  isLoading?: boolean;
}

export const MatchingReadyButton: React.FC<MatchingReadyButtonProps> = ({
  arData,
  apData,
  onStartMatching,
  isLoading = false,
}) => {
  // Only show if both data sources are loaded
  if (!arData || !apData) {
    return null;
  }

  const arName = arData.customerName || arData.fileName || 'AR Data';
  const apName = apData.customerName || apData.fileName || 'AP Data';

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-success-100 rounded-full mb-3">
              <svg 
                className="w-6 h-6 text-success-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-h3 text-neutral-900 mb-2">Ready to Match</h3>
            <p className="text-small text-neutral-600">
              Both data sources loaded successfully
            </p>
          </div>

          {/* Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* AR Summary */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 text-primary-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Accounts Receivable
                  </p>
                  <p className="text-sm font-medium text-neutral-900 truncate" title={arName}>
                    {arName}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-xs text-neutral-600">Invoices</span>
                <span className="text-lg font-bold text-primary-700">
                  {arData.invoiceCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* AP Summary */}
            <div className="bg-white rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="w-5 h-5 text-secondary-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Accounts Payable
                  </p>
                  <p className="text-sm font-medium text-neutral-900 truncate" title={apName}>
                    {apName}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <span className="text-xs text-neutral-600">Invoices</span>
                <span className="text-lg font-bold text-secondary-700">
                  {apData.invoiceCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={onStartMatching}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing Matching...
              </>
            ) : (
              <>
                <svg 
                  className="w-5 h-5 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" 
                  />
                </svg>
                Start Matching
                <svg 
                  className="w-5 h-5 ml-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </>
            )}
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-center text-xs text-neutral-500">
          This will compare your AR and AP records to find matches and discrepancies
        </p>
      </div>
    </div>
  );
};

export default MatchingReadyButton;
