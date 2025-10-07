/**
 * LedgerTypeSelector Component
 * 
 * Step 1: Allows users to select between Accounts Receivable (AR) or Accounts Payable (AP)
 * This determines which type of invoices they're matching
 */

import React from 'react';

interface LedgerTypeSelectorProps {
  selectedType: 'AR' | 'AP' | null;
  onSelect: (type: 'AR' | 'AP') => void;
}

export const LedgerTypeSelector: React.FC<LedgerTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-h3 text-neutral-900 mb-2">Step 1: Select Ledger Type</h3>
        <p className="text-small text-neutral-600 mb-4">
          Choose the type of invoices you want to match
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accounts Receivable Option */}
        <button
          type="button"
          onClick={() => onSelect('AR')}
          className={`
            relative p-6 rounded-md border-2 text-left transition-all duration-short
            ${
              selectedType === 'AR'
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors
              ${
                selectedType === 'AR'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-neutral-300 bg-white'
              }
            `}>
              {selectedType === 'AR' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-body font-medium text-neutral-900 mb-1">
                Accounts Receivable (AR)
              </div>
              <div className="text-small text-neutral-600">
                Customer invoices you issued - money owed to you
              </div>
            </div>
          </div>
        </button>

        {/* Accounts Payable Option */}
        <button
          type="button"
          onClick={() => onSelect('AP')}
          className={`
            relative p-6 rounded-md border-2 text-left transition-all duration-short
            ${
              selectedType === 'AP'
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm'
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors
              ${
                selectedType === 'AP'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-neutral-300 bg-white'
              }
            `}>
              {selectedType === 'AP' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-body font-medium text-neutral-900 mb-1">
                Accounts Payable (AP)
              </div>
              <div className="text-small text-neutral-600">
                Supplier invoices you received - money you owe
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LedgerTypeSelector;
