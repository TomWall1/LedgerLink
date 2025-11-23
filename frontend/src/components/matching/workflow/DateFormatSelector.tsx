/**
 * Date Format Selector Component
 * 
 * Allows users to select the date format used in their CSV files.
 * This is important because different regions use different date formats:
 * - US typically uses MM/DD/YYYY
 * - Most other countries use DD/MM/YYYY
 */

import React from 'react';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY';

interface DateFormatSelectorProps {
  selectedFormat: DateFormat;
  onChange: (format: DateFormat) => void;
  label?: string;
  description?: string;
}

export const DateFormatSelector: React.FC<DateFormatSelectorProps> = ({
  selectedFormat,
  onChange,
  label = 'Date Format',
  description = 'Select the date format used in your CSV file'
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-900">
        {label}
      </label>
      {description && (
        <p className="text-xs text-neutral-600 mb-2">
          {description}
        </p>
      )}
      <select
        value={selectedFormat}
        onChange={(e) => onChange(e.target.value as DateFormat)}
        className="block w-full px-3 py-2 bg-white border border-neutral-300 rounded-md shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   text-sm text-neutral-900"
      >
        <option value="MM/DD/YYYY">MM/DD/YYYY (US format, e.g., 01/31/2024)</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY (International format, e.g., 31/01/2024)</option>
      </select>
      
      {/* Help text showing example */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs text-blue-900 font-medium">Example:</p>
            <p className="text-xs text-blue-800 mt-1">
              {selectedFormat === 'MM/DD/YYYY' ? (
                <>
                  January 31st, 2024 would be written as <span className="font-semibold">01/31/2024</span>
                </>
              ) : (
                <>
                  January 31st, 2024 would be written as <span className="font-semibold">31/01/2024</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFormatSelector;
