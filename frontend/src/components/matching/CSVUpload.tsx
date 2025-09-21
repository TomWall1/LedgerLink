// frontend/src/components/matching/CSVUpload.tsx
// This component creates the drag-and-drop file upload interface
// Think of it as a digital dropbox where users can drop their CSV files

import React, { useState, useRef, useCallback } from 'react';
import { matchingService } from '../../services/matchingService';
import { DATE_FORMATS } from '../../types/matching';

interface CSVPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface CSVUploadProps {
  onUploadSuccess: (matchId: string) => void;
  onUploadError: (error: string) => void;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  // State management - these are like variables that the component remembers
  const [company1File, setCompany1File] = useState<File | null>(null);
  const [company2File, setCompany2File] = useState<File | null>(null);
  const [company1Preview, setCompany1Preview] = useState<CSVPreview | null>(null);
  const [company2Preview, setCompany2Preview] = useState<CSVPreview | null>(null);
  const [dateFormat1, setDateFormat1] = useState<string>('DD/MM/YYYY');
  const [dateFormat2, setDateFormat2] = useState<string>('DD/MM/YYYY');
  const [company1Name, setCompany1Name] = useState<string>('Company 1');
  const [company2Name, setCompany2Name] = useState<string>('Company 2');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<{ company1: boolean; company2: boolean }>({
    company1: false,
    company2: false
  });

  // File input references - these let us programmatically click the file inputs
  const company1InputRef = useRef<HTMLInputElement>(null);
  const company2InputRef = useRef<HTMLInputElement>(null);

  // Handle file selection and preview generation
  const handleFileSelect = useCallback(async (file: File, company: 'company1' | 'company2') => {
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        onUploadError('Please select a CSV file');
        return;
      }

      // Generate preview
      const preview = await matchingService.parseCSVPreview(file);

      if (company === 'company1') {
        setCompany1File(file);
        setCompany1Preview(preview);
      } else {
        setCompany2File(file);
        setCompany2Preview(preview);
      }
    } catch (error) {
      onUploadError(`Error loading file: ${(error as Error).message}`);
    }
  }, [onUploadError]);

  // Handle drag and drop events
  const handleDrag = useCallback((e: React.DragEvent, company: 'company1' | 'company2') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [company]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [company]: false }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, company: 'company1' | 'company2') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [company]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0], company);
    }
  }, [handleFileSelect]);

  // Handle manual file input selection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, company: 'company1' | 'company2') => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0], company);
    }
  };

  // Handle the upload process
  const handleUpload = async () => {
    if (!company1File || !company2File) {
      onUploadError('Please select both CSV files');
      return;
    }

    setIsUploading(true);
    try {
      const result = await matchingService.uploadAndMatch(
        company1File,
        company2File,
        dateFormat1,
        dateFormat2,
        company1Name,
        company2Name
      );

      if (result.success && result.matchId) {
        onUploadSuccess(result.matchId);
      } else {
        onUploadError(result.message || 'Upload failed');
      }
    } catch (error) {
      onUploadError(`Upload failed: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Clear all files and start over
  const handleClear = () => {
    setCompany1File(null);
    setCompany2File(null);
    setCompany1Preview(null);
    setCompany2Preview(null);
    setCompany1Name('Company 1');
    setCompany2Name('Company 2');
    setDateFormat1('DD/MM/YYYY');
    setDateFormat2('DD/MM/YYYY');
  };

  // Component for rendering file upload area
  const FileUploadArea = ({ 
    company, 
    file, 
    preview, 
    companyName,
    setCompanyName,
    dateFormat,
    setDateFormat 
  }: {
    company: 'company1' | 'company2';
    file: File | null;
    preview: CSVPreview | null;
    companyName: string;
    setCompanyName: (name: string) => void;
    dateFormat: string;
    setDateFormat: (format: string) => void;
  }) => (
    <div className="space-y-4">
      {/* Company name input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${company === 'company1' ? 'first' : 'second'} company name`}
        />
      </div>

      {/* File upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive[company]
            ? 'border-blue-500 bg-blue-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={(e) => handleDrag(e, company)}
        onDragLeave={(e) => handleDrag(e, company)}
        onDragOver={(e) => handleDrag(e, company)}
        onDrop={(e) => handleDrop(e, company)}
        onClick={() => {
          if (company === 'company1') {
            company1InputRef.current?.click();
          } else {
            company2InputRef.current?.click();
          }
        }}
      >
        <input
          ref={company === 'company1' ? company1InputRef : company2InputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleInputChange(e, company)}
          className="hidden"
        />
        
        {file ? (
          <div className="space-y-2">
            <div className="text-green-600 font-medium">✓ {file.name}</div>
            <div className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400 text-2xl">📁</div>
            <div className="text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </div>
            <div className="text-sm text-gray-500">CSV files only</div>
          </div>
        )}
      </div>

      {/* Date format selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Format in CSV
        </label>
        <select
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DATE_FORMATS.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      {/* File preview */}
      {preview && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Preview ({preview.totalRows} total rows)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-200">
                  {preview.headers.map((header, index) => (
                    <th key={index} className="px-2 py-1 text-left font-medium text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-gray-200">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-2 py-1 text-gray-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload CSV Files for Matching</h2>
        <p className="text-gray-600">
          Upload two CSV files to compare and match transactions between companies.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-6">
        {/* Company 1 Upload */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">First Company</h3>
          <FileUploadArea
            company="company1"
            file={company1File}
            preview={company1Preview}
            companyName={company1Name}
            setCompanyName={setCompany1Name}
            dateFormat={dateFormat1}
            setDateFormat={setDateFormat1}
          />
        </div>

        {/* Company 2 Upload */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Second Company</h3>
          <FileUploadArea
            company="company2"
            file={company2File}
            preview={company2Preview}
            companyName={company2Name}
            setCompanyName={setCompany2Name}
            dateFormat={dateFormat2}
            setDateFormat={setDateFormat2}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={handleClear}
          disabled={isUploading}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>

        <button
          onClick={handleUpload}
          disabled={!company1File || !company2File || isUploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isUploading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{isUploading ? 'Processing...' : 'Start Matching'}</span>
        </button>
      </div>
    </div>
  );
};