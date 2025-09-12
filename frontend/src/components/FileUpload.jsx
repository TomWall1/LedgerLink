import React, { useRef, useState } from 'react';

const FileUpload = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  
  const handleFileSelect = (file) => {
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload CSV File
      </label>
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <svg className="mx-auto h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-green-700">
              {selectedFile.name}
            </p>
            <p className="text-xs text-green-600">
              {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports CSV files up to 10MB
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required CSV Columns:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Amount</strong> (or 'Value', 'Total')</li>
          <li>• <strong>Date</strong> (or 'Transaction Date', 'Invoice Date')</li>
          <li>• <strong>Reference</strong> (or 'Transaction Number', 'ID')</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;