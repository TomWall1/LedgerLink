/**
 * DataSourceDropdown Component
 * 
 * Step 2: Allows users to select their data source (Xero or CSV upload)
 * Shows different options based on Xero connection status
 * 
 * PHASE 1 FIX: Added isCounterpartySelection prop to prevent showing
 * YOUR Xero connection when selecting counterparty data source
 * 
 * PHASE 2: Added linkedCounterpartyErp prop to show linked counterparty
 * ERP system as an option, with appropriate messaging when not linked
 */

import React from 'react';

export type DataSourceType = 'xero' | 'csv' | 'counterparty_erp' | null;

interface DataSourceDropdownProps {
  value: DataSourceType;
  onChange: (value: DataSourceType) => void;
  isXeroConnected: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
  isCounterpartySelection?: boolean;
  linkedCounterpartyErp?: {
    id: string;
    companyName: string;
    erpType: string;
  } | null;
}

export const DataSourceDropdown: React.FC<DataSourceDropdownProps> = ({
  value,
  onChange,
  isXeroConnected,
  label,
  description,
  disabled = false,
  isCounterpartySelection = false,
  linkedCounterpartyErp = null,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-body font-medium text-neutral-900 mb-1 block">
          {label}
        </label>
        {description && (
          <p className="text-small text-neutral-600">{description}</p>
        )}
      </div>

      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as DataSourceType)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 rounded-md border border-neutral-200 
          bg-white text-body text-neutral-900
          focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-short
          ${!value ? 'text-neutral-400' : ''}
        `}
      >
        <option value="">Choose data source...</option>
        
        {/* PHASE 1 LOGIC: Only show Xero for YOUR ledger (Step 2), not for counterparty (Step 3) */}
        {!isCounterpartySelection && isXeroConnected && (
          <option value="xero">Connected ERP - Xero ✓</option>
        )}
        
        {/* PHASE 2: Show linked counterparty ERP if available in Step 3 */}
        {isCounterpartySelection && linkedCounterpartyErp && (
          <option value="counterparty_erp">
            {linkedCounterpartyErp.companyName} - {linkedCounterpartyErp.erpType} ✓
          </option>
        )}
        
        <option value="csv">Upload CSV File</option>
      </select>

      {/* PHASE 2: Show message if counterparty is not linked */}
      {isCounterpartySelection && !linkedCounterpartyErp && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-small text-blue-900">
            <p className="font-medium mb-1">No linked counterparty found</p>
            <p>This customer/vendor hasn't linked their accounting system yet. You can upload their CSV file, or invite them to link their account for automatic matching.</p>
          </div>
        </div>
      )}

      {/* Existing warning for when YOUR Xero isn't connected */}
      {!isXeroConnected && value === 'xero' && (
        <div className="flex items-start space-x-2 p-3 bg-warning-50 border border-warning-200 rounded-md">
          <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-small text-warning-900">
            Xero is not connected. Please connect Xero from the Connections page first.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataSourceDropdown;
