/**
 * DataSourceDropdown Component
 * 
 * Step 2: Allows users to select their data source (Xero or CSV upload)
 * Shows different options based on Xero connection status
 */

import React from 'react';

export type DataSourceType = 'xero' | 'csv' | null;

interface DataSourceDropdownProps {
  value: DataSourceType;
  onChange: (value: DataSourceType) => void;
  isXeroConnected: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const DataSourceDropdown: React.FC<DataSourceDropdownProps> = ({
  value,
  onChange,
  isXeroConnected,
  label,
  description,
  disabled = false,
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
        
        {isXeroConnected && (
          <option value="xero">Connected ERP - Xero ✓</option>
        )}
        
        <option value="csv">Upload CSV File</option>
      </select>

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
