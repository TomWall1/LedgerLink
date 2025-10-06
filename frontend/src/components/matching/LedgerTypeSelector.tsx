/**
 * LedgerTypeSelector Component
 * 
 * Allows users to choose between AR (Accounts Receivable) and AP (Accounts Payable)
 * matching workflows.
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';

interface LedgerTypeSelectorProps {
  selectedType: 'AR' | 'AP' | null;
  onTypeChange: (type: 'AR' | 'AP') => void;
}

export const LedgerTypeSelector: React.FC<LedgerTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Step 1: Select Ledger Type
            </h3>
            <p className="text-sm text-neutral-600">
              Choose whether you're matching customer invoices (AR) or supplier invoices (AP)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AR Option */}
            <button
              onClick={() => onTypeChange('AR')}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all
                ${selectedType === 'AR'
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-neutral-300 bg-white hover:border-primary-300 hover:bg-neutral-50'
                }
              `}
            >
              {selectedType === 'AR' && (
                <div className="absolute top-4 right-4">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-1">
                    Accounts Receivable (AR)
                  </h4>
                  <p className="text-sm text-neutral-600">
                    Match customer invoices you issued with their payment records
                  </p>
                </div>
              </div>
            </button>

            {/* AP Option */}
            <button
              onClick={() => onTypeChange('AP')}
              className={`
                relative p-6 rounded-lg border-2 text-left transition-all
                ${selectedType === 'AP'
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-neutral-300 bg-white hover:border-primary-300 hover:bg-neutral-50'
                }
              `}
            >
              {selectedType === 'AP' && (
                <div className="absolute top-4 right-4">
                  <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-1">
                    Accounts Payable (AP)
                  </h4>
                  <p className="text-sm text-neutral-600">
                    Match supplier invoices you received with your payment records
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LedgerTypeSelector;
