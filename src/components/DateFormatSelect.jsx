import React from 'react';

const DateFormatSelect = ({ value, onChange }) => {
  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Australian)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (American)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
    { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' }
  ];
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        CSV Date Format
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {dateFormats.map((format) => (
          <option key={format.value} value={format.value}>
            {format.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Select the format that matches your CSV file's date format
      </p>
    </div>
  );
};

export default DateFormatSelect;