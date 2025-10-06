/**
 * DataLoadedCard Component
 * 
 * Shows a summary of loaded data source with option to clear
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface DataLoadedCardProps {
  sourceNumber: 1 | 2;
  sourceName: string;
  details: string;
  invoiceCount: number;
  onClear: () => void;
}

export const DataLoadedCard: React.FC<DataLoadedCardProps> = ({
  sourceNumber,
  sourceName,
  details,
  invoiceCount,
  onClear
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-success-700">
                  Data Source {sourceNumber} Loaded
                </span>
              </div>
              <h4 className="font-semibold text-neutral-900">{sourceName}</h4>
              <p className="text-sm text-neutral-600">
                {details} • {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataLoadedCard;
