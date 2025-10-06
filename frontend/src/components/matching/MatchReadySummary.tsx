/**
 * MatchReadySummary Component
 * 
 * Shows summary of both data sources when ready to start matching
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface DataSourceSummary {
  name: string;
  details: string;
  invoiceCount: number;
}

interface MatchReadySummaryProps {
  ledgerType: 'AR' | 'AP';
  source1: DataSourceSummary;
  source2: DataSourceSummary;
  onStartMatching: () => void;
}

export const MatchReadySummary: React.FC<MatchReadySummaryProps> = ({
  ledgerType,
  source1,
  source2,
  onStartMatching
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                📊 Ready to Match!
              </h3>
              <p className="text-sm text-primary-700">
                Both data sources are loaded. Click below to start the matching process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">
                      Data Source 1 - Your {ledgerType} Ledger
                    </p>
                    <p className="font-semibold text-neutral-900">{source1.name}</p>
                    <p className="text-sm text-neutral-600">{source1.details}</p>
                    <p className="text-sm text-primary-600 font-medium mt-1">
                      {source1.invoiceCount} invoice{source1.invoiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">
                      Data Source 2 - Counterparty Ledger
                    </p>
                    <p className="font-semibold text-neutral-900">{source2.name}</p>
                    <p className="text-sm text-neutral-600">{source2.details}</p>
                    <p className="text-sm text-primary-600 font-medium mt-1">
                      {source2.invoiceCount} invoice{source2.invoiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={onStartMatching}
                className="w-full md:w-auto px-8"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Matching
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchReadySummary;
