/**
 * LinkedCounterpartyCard Component
 * 
 * Shows linked counterparty information when a connection exists
 * between the selected customer/supplier and their counterparty
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface LinkedCounterpartyCardProps {
  counterpartyName: string;
  counterpartySource: string;
  onUseLinked: () => void;
  onChooseOther: () => void;
}

export const LinkedCounterpartyCard: React.FC<LinkedCounterpartyCardProps> = ({
  counterpartyName,
  counterpartySource,
  onUseLinked,
  onChooseOther
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="bg-success-50 border-2 border-success-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-success-900 mb-2">
                🔗 Linked Counterparty Found!
              </h4>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-success-200">
                  <p className="text-sm text-neutral-600 mb-1">Connected with:</p>
                  <p className="font-semibold text-neutral-900 text-lg">{counterpartyName}</p>
                  <p className="text-sm text-neutral-600">{counterpartySource}</p>
                </div>
                <p className="text-sm text-success-800">
                  This counterparty has granted you access to their ledger for automatic matching. 
                  Their invoice data will be loaded automatically.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="primary"
                    onClick={onUseLinked}
                    className="flex-1 min-w-[200px]"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Use Linked Account
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onChooseOther}
                  >
                    Choose Different Source
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkedCounterpartyCard;
