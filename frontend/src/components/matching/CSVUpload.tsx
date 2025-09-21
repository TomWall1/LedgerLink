/**
 * Enhanced CSV Upload with Counterparty Selection
 * 
 * This component creates the drag-and-drop file upload interface with
 * counterparty relationship tracking. Users can optionally select which
 * counterparty they're matching against for better relationship management.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { matchingService } from '../../services/matchingService';
import counterpartyService, { Counterparty } from '../../services/counterpartyService';
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
  // File and preview state
  const [company1File, setCompany1File] = useState<File | null>(null);
  const [company2File, setCompany2File] = useState<File | null>(null);
  const [company1Preview, setCompany1Preview] = useState<CSVPreview | null>(null);
  const [company2Preview, setCompany2Preview] = useState<CSVPreview | null>(null);
  
  // Configuration state
  const [dateFormat1, setDateFormat1] = useState<string>('DD/MM/YYYY');
  const [dateFormat2, setDateFormat2] = useState<string>('DD/MM/YYYY');
  const [company1Name, setCompany1Name] = useState<string>('Company 1');
  const [company2Name, setCompany2Name] = useState<string>('Company 2');
  const [notes, setNotes] = useState<string>('');
  
  // Counterparty selection state
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [counterpartySearch, setCounterpartySearch] = useState<string>('');
  const [availableCounterparties, setAvailableCounterparties] = useState<Counterparty[]>([]);
  const [showCounterpartyDropdown, setShowCounterpartyDropdown] = useState<boolean>(false);
  const [loadingCounterparties, setLoadingCounterparties] = useState<boolean>(false);
  
  // UI state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<{ company1: boolean; company2: boolean }>({
    company1: false,
    company2: false
  });

  // File input references
  const company1InputRef = useRef<HTMLInputElement>(null);
  const company2InputRef = useRef<HTMLInputElement>(null);
  const counterpartyDropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Search for counterparties when user types
   */
  const searchCounterparties = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAvailableCounterparties([]);
      return;
    }

    try {
      setLoadingCounterparties(true);
      const results = await counterpartyService.searchCounterparties({
        q: query,
        status: 'linked'
      });
      setAvailableCounterparties(results);
    } catch (error) {
      console.error('Error searching counterparties:', error);
      setAvailableCounterparties([]);
    } finally {
      setLoadingCounterparties(false);
    }
  }, []);

  /**
   * Load initial counterparties on component mount
   */
  useEffect(() => {
    const loadInitialCounterparties = async () => {
      try {
        const results = await counterpartyService.searchCounterparties({
          status: 'linked'
        });
        setAvailableCounterparties(results.slice(0, 10)); // Show first 10
      } catch (error) {
        console.error('Error loading initial counterparties:', error);
      }
    };

    loadInitialCounterparties();
  }, []);

  /**
   * Handle counterparty search input changes
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (counterpartySearch) {
        searchCounterparties(counterpartySearch);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [counterpartySearch, searchCounterparties]);

  /**
   * Close counterparty dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (counterpartyDropdownRef.current && !counterpartyDropdownRef.current.contains(event.target as Node)) {
        setShowCounterpartyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle file selection and preview generation
   */
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

  /**
   * Handle drag and drop events
   */
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

  /**
   * Handle manual file input selection
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, company: 'company1' | 'company2') => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0], company);
    }
  };

  /**
   * Handle counterparty selection
   */
  const handleCounterpartySelect = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setCounterpartySearch(counterparty.name);
    setShowCounterpartyDropdown(false);
    
    // Auto-populate company name if not already set
    if (company2Name === 'Company 2') {
      setCompany2Name(counterparty.name);
    }
  };

  /**
   * Clear counterparty selection
   */
  const clearCounterpartySelection = () => {
    setSelectedCounterparty(null);
    setCounterpartySearch('');
  };

  /**
   * Handle the upload process
   */
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
        company2Name,
        selectedCounterparty?._id, // Pass counterparty ID if selected
        notes || undefined
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

  /**
   * Clear all files and start over
   */
  const handleClear = () => {
    setCompany1File(null);
    setCompany2File(null);
    setCompany1Preview(null);
    setCompany2Preview(null);
    setCompany1Name('Company 1');
    setCompany2Name('Company 2');
    setDateFormat1('DD/MM/YYYY');
    setDateFormat2('DD/MM/YYYY');
    setNotes('');
    clearCounterpartySelection();
  };

  /**
   * Component for rendering file upload area
   */
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
          Optionally select a counterparty to track this relationship.
        </p>
      </div>

      {/* Counterparty Selection Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          🤝 Select Counterparty (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Choose the counterparty you're matching against to track relationship history and statistics.
        </p>
        
        <div className="relative" ref={counterpartyDropdownRef}>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={counterpartySearch}
                onChange={(e) => {
                  setCounterpartySearch(e.target.value);
                  setShowCounterpartyDropdown(true);
                }}
                onFocus={() => setShowCounterpartyDropdown(true)}
                placeholder="Search for a counterparty or leave blank..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {selectedCounterparty && (
              <button
                onClick={clearCounterpartySelection}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                title="Clear selection"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selected counterparty display */}
          {selectedCounterparty && (
            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-md flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  selectedCounterparty.type === 'customer' 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedCounterparty.type === 'customer' ? 'C' : 'V'}
                </div>
                <div>
                  <div className="font-medium text-green-800">{selectedCounterparty.name}</div>
                  <div className="text-xs text-green-600 capitalize">{selectedCounterparty.type}</div>
                </div>
              </div>
              <div className="text-green-600">✓</div>
            </div>
          )}

          {/* Counterparty dropdown */}
          {showCounterpartyDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {loadingCounterparties ? (
                <div className="p-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  Searching...
                </div>
              ) : availableCounterparties.length > 0 ? (
                availableCounterparties.map((counterparty) => (
                  <div
                    key={counterparty._id}
                    onClick={() => handleCounterpartySelect(counterparty)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        counterparty.type === 'customer' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {counterparty.type === 'customer' ? 'C' : 'V'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{counterparty.name}</div>
                        <div className="text-sm text-gray-500">
                          {counterparty.email} • {counterparty.type}
                          {counterparty.statistics.totalTransactions > 0 && (
                            <span> • {counterparty.statistics.matchRate.toFixed(1)}% match rate</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : counterpartySearch.length >= 2 ? (
                <div className="p-3 text-center text-gray-500">
                  No counterparties found
                </div>
              ) : (
                <div className="p-3 text-center text-gray-500">
                  Type to search counterparties
                </div>
              )}
            </div>
          )}
        </div>
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

      {/* Notes section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this matching operation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
        />
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

      {/* Help text */}
      {selectedCounterparty && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> This match will be tracked as part of your relationship with{' '}
            <strong>{selectedCounterparty.name}</strong>. Their statistics will be automatically updated
            when the matching is complete.
          </div>
        </div>
      )}
    </div>
  );
};