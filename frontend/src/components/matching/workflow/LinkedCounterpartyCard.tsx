/**
 * LinkedCounterpartyCard Component
 * 
 * Shows when a linked counterparty is found for the selected customer
 * Offers to automatically load the counterparty's data
 */

import React from 'react';
import { Button } from '../../ui/Button';

interface LinkedCounterparty {
  id: string;
  name: string;
  organizationName?: string;
  connectionType?: 'xero' | 'quickbooks' | 'manual';
  email?: string;
}

interface LinkedCounterpartyCardProps {
  customerName: string;
  counterparty: LinkedCounterparty;
  onUseLinkedAccount: () => void;
  onChooseDifferent: () => void;
  isLoading?: boolean;
}

export const LinkedCounterpartyCard: React.FC<LinkedCounterpartyCardProps> = ({
  customerName,
  counterparty,
  onUseLinkedAccount,
  onChooseDifferent,
  isLoading = false,
}) => {
  const getConnectionIcon = () => {
    switch (counterparty.connectionType) {
      case 'xero':
        return (
          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getConnectionTypeLabel = () => {
    switch (counterparty.connectionType) {
      case 'xero':
        return 'Xero Account';
      case 'quickbooks':
        return 'QuickBooks Account';
      case 'manual':
        return 'Manual Entry';
      default:
        return 'Connection';
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg shadow-md">
      {/* Header with Link Icon */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h3 className="text-h3 text-primary-900 font-semibold">🔗 Linked Counterparty Found!</h3>
          <p className="text-small text-primary-700">Automatically detected relationship</p>
        </div>
      </div>

      {/* Counterparty Information */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-start space-x-3">
          {getConnectionIcon()}
          <div className="flex-1">
            <p className="text-body text-neutral-700 mb-2">
              <span className="font-medium text-neutral-900">{customerName}</span> is linked with:
            </p>
            <div className="bg-primary-50 rounded-md p-3 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-semibold text-primary-900">
                    {counterparty.name}
                  </p>
                  {counterparty.organizationName && (
                    <p className="text-small text-neutral-600">
                      {counterparty.organizationName}
                    </p>
                  )}
                  <p className="text-small text-primary-600 mt-1">
                    {getConnectionTypeLabel()}
                  </p>
                </div>
                {counterparty.connectionType === 'xero' && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-success-100 text-success-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Connected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <p className="text-small font-medium text-neutral-700 mb-2">Benefits of using linked account:</p>
        <ul className="space-y-1.5">
          <li className="flex items-start space-x-2 text-small text-neutral-600">
            <svg className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Automatic data loading from their system</span>
          </li>
          <li className="flex items-start space-x-2 text-small text-neutral-600">
            <svg className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real-time invoice matching</span>
          </li>
          <li className="flex items-start space-x-2 text-small text-neutral-600">
            <svg className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Saves time - no CSV upload needed</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          onClick={onUseLinkedAccount}
          disabled={isLoading}
          className="flex-1 sm:flex-initial"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Use Linked Account
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={onChooseDifferent}
          disabled={isLoading}
          className="flex-1 sm:flex-initial"
        >
          Choose Different Source
        </Button>
      </div>
    </div>
  );
};

export default LinkedCounterpartyCard;
