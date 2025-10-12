/**
 * MatchReadyCard Component
 * 
 * Shows a summary when both data sources are loaded and ready to match
 * Includes a prominent "Start Matching" button
 */

import React from 'react';
import { Button } from '../../ui/Button';

interface DataSourceInfo {
  type: 'xero' | 'csv';
  name: string;
  invoiceCount: number;
}

interface MatchReadyCardProps {
  source1: DataSourceInfo;
  source2: DataSourceInfo;
  onStartMatching: () => void;
  isMatching?: boolean;
}

export const MatchReadyCard: React.FC<MatchReadyCardProps> = ({
  source1,
  source2,
  onStartMatching,
  isMatching = false,
}) => {
  // DIAGNOSTIC LOGGING
  console.log('🎨 [MatchReadyCard] Rendering with props:', {
    source1,
    source2,
    isMatching,
    propsReceived: {
      source1: {
        exists: !!source1,
        type: typeof source1,
        hasType: source1 ? typeof source1.type : 'N/A',
        hasName: source1 ? typeof source1.name : 'N/A',
        hasInvoiceCount: source1 ? typeof source1.invoiceCount : 'N/A',
      },
      source2: {
        exists: !!source2,
        type: typeof source2,
        hasType: source2 ? typeof source2.type : 'N/A',
        hasName: source2 ? typeof source2.name : 'N/A',
        hasInvoiceCount: source2 ? typeof source2.invoiceCount : 'N/A',
      },
      onStartMatching: typeof onStartMatching,
      isMatching: typeof isMatching
    }
  });

  return (
    <div className="p-6 bg-primary-50 border-2 border-primary-200 rounded-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-h3 text-primary-900">Ready to Match!</h3>
            <p className="text-small text-primary-700">
              Both data sources are loaded and ready for matching
            </p>
          </div>
        </div>

        {/* Data Sources Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source 1 */}
          <div className="p-4 bg-white rounded-md border border-primary-200">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="text-small font-medium text-neutral-700 mb-1">
                  Data Source 1
                </div>
                <div className="text-body text-neutral-900 font-medium">
                  {source1.name}
                </div>
                <div className="text-small text-neutral-600">
                  {source1.invoiceCount} invoice{source1.invoiceCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Source 2 */}
          <div className="p-4 bg-white rounded-md border border-primary-200">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <div className="text-small font-medium text-neutral-700 mb-1">
                  Data Source 2
                </div>
                <div className="text-body text-neutral-900 font-medium">
                  {source2.name}
                </div>
                <div className="text-small text-neutral-600">
                  {source2.invoiceCount} invoice{source2.invoiceCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Matching Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onStartMatching}
            disabled={isMatching}
            className="min-w-[200px]"
          >
            {isMatching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Matching...
              </>
            ) : (
              <>
                Start Matching
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchReadyCard;
