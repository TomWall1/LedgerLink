/**
 * DataSourceSelector Component
 * 
 * Allows users to select between connected ERP systems or CSV upload
 * for their data source.
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface DataSourceSelectorProps {
  stepNumber: number;
  title: string;
  selectedSource: 'erp' | 'csv' | null;
  onSourceChange: (source: 'erp' | 'csv') => void;
  isXeroConnected: boolean;
  onOpenXeroSelector?: () => void;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  stepNumber,
  title,
  selectedSource,
  onSourceChange,
  isXeroConnected,
  onOpenXeroSelector
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Step {stepNumber}: {title}
            </h3>
            <p className="text-sm text-neutral-600">
              Choose your data source
            </p>
          </div>

          <div className="space-y-3">
            {/* ERP Option */}
            <div
              className={`
                border-2 rounded-lg transition-all
                ${selectedSource === 'erp'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 bg-white'
                }
              `}
            >
              <button
                onClick={() => onSourceChange('erp')}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedSource === 'erp'
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-neutral-400'
                      }
                    `}>
                      {selectedSource === 'erp' && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900 flex items-center">
                        Connected ERP - Xero
                        {isXeroConnected && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Connected
                          </span>
                        )}
                        {!isXeroConnected && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600">
                            Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">
                        Import data directly from your accounting system
                      </p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Show customer selector when ERP selected */}
              {selectedSource === 'erp' && isXeroConnected && onOpenXeroSelector && (
                <div className="px-4 pb-4 pt-2 border-t border-neutral-200">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenXeroSelector}
                    className="w-full"
                  >
                    Select Customer/Supplier
                  </Button>
                </div>
              )}

              {/* Show connection prompt when ERP selected but not connected */}
              {selectedSource === 'erp' && !isXeroConnected && (
                <div className="px-4 pb-4 pt-2 border-t border-neutral-200">
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                    <p className="text-sm text-warning-800">
                      Please connect to Xero from the Connections page first
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Option */}
            <div
              className={`
                border-2 rounded-lg transition-all
                ${selectedSource === 'csv'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 bg-white'
                }
              `}
            >
              <button
                onClick={() => onSourceChange('csv')}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedSource === 'csv'
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-neutral-400'
                    }
                  `}>
                    {selectedSource === 'csv' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">
                      Upload CSV File
                    </div>
                    <p className="text-sm text-neutral-600">
                      Manually upload a CSV file with your transaction data
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceSelector;
