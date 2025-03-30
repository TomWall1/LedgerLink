import React from 'react';

const DateFormatSelect = ({ selectedFormat, onChange, label }) => {
  const formats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY'
  ];

  return (
    <div className="space-y-1">
      <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
        {label || 'Date Format'}
      </label>
      <select
        id="dateFormat"
        value={selectedFormat}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {formats.map(format => (
          <option key={format} value={format}>
            {format}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateFormatSelect;