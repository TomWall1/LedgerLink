/**
 * Enhanced CSV Upload Component
 * 
 * This component provides a modern drag-and-drop interface for uploading
 * CSV files and running the matching algorithm. It's like a digital inbox
 * that's smart enough to validate and preview your files before processing.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import matchingService from '../../services/matchingService';
import { DateFormat, MatchingResults, UploadStatus } from '../../types/matching';

interface CSVUploadProps {
  onMatchingComplete: (results: MatchingResults) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface FileWithPreview {
  file: File;
  previewData?: {
    headers: string[];
    rows: string[][];
    totalRows: number;
  };
  error?: string;
}

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-31' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-12-2024' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY', example: '12-31-2024' },
];

export const CSVUpload: React.FC<CSVUploadProps> = ({
  onMatchingComplete,
  onError,
  disabled = false
}) => {
  // State management for the component
  const [company1File, setCompany1File] = useState<FileWithPreview | null>(null);
  const [company2File, setCompany2File] = useState<FileWithPreview | null>(null);
  const [dateFormat1, setDateFormat1] = useState<DateFormat>('DD/MM/YYYY');
  const [dateFormat2, setDateFormat2] = useState<DateFormat>('DD/MM/YYYY');
  const [notes, setNotes] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false
  });
  const [dragActive, setDragActive] = useState<'company1' | 'company2' | null>(null);

  // Refs for file inputs
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate and process a selected file
   */
  const processFile = useCallback(async (
    file: File,
    setFile: (file: FileWithPreview | null) => void
  ) => {
    // First, set the file without preview data
    setFile({ file });

    try {
      // Validate the file and get preview data
      const validation = await matchingService.validateCSVFile(file);
      
      if (validation.isValid && validation.previewData) {
        setFile({
          file,
          previewData: validation.previewData
        });
      } else {
        setFile({
          file,
          error: validation.error || 'Invalid file'
        });
      }
    } catch (error) {
      setFile({
        file,
        error: error instanceof Error ? error.message : 'Error processing file'
      });
    }
  }, []);

  /**
   * Handle drag and drop events
   */
  const handleDragEvents = useCallback((
    e: React.DragEvent,
    fileType: 'company1' | 'company2',
    eventType: 'enter' | 'leave' | 'over' | 'drop'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    switch (eventType) {
      case 'enter':
      case 'over':
        setDragActive(fileType);
        break;
      case 'leave':
        setDragActive(null);
        break;
      case 'drop':
        setDragActive(null);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          const setFile = fileType === 'company1' ? setCompany1File : setCompany2File;
          processFile(files[0], setFile);
        }
        break;
    }
  }, [disabled, processFile]);

  /**
   * Handle file input changes
   */
  const handleFileInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: FileWithPreview | null) => void
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFile(files[0], setFile);
    }
  }, [processFile]);

  /**
   * Remove a selected file
   */
  const removeFile = useCallback((fileType: 'company1' | 'company2') => {
    if (fileType === 'company1') {
      setCompany1File(null);
      if (file1InputRef.current) file1InputRef.current.value = '';
    } else {
      setCompany2File(null);
      if (file2InputRef.current) file2InputRef.current.value = '';
    }
  }, []);

  /**
   * Process the matching operation
   */
  const handleRunMatching = useCallback(async () => {
    if (!company1File?.file || !company2File?.file) {
      onError('Please select both CSV files');
      return;
    }

    if (company1File.error || company2File.error) {
      onError('Please fix file errors before proceeding');
      return;
    }

    setUploadStatus({ isUploading: true, message: 'Uploading files and running matching...' });

    try {
      const results = await matchingService.uploadAndMatch(
        company1File.file,
        company2File.file,
        dateFormat1,
        dateFormat2,
        notes || undefined
      );

      setUploadStatus({ isUploading: false });
      onMatchingComplete(results);
      
      // Reset form
      setCompany1File(null);
      setCompany2File(null);
      setNotes('');
      if (file1InputRef.current) file1InputRef.current.value = '';
      if (file2InputRef.current) file2InputRef.current.value = '';
      
    } catch (error) {
      setUploadStatus({ isUploading: false });
      onError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [company1File, company2File, dateFormat1, dateFormat2, notes, onMatchingComplete, onError]);

  /**
   * Render file upload area
   */
  const renderFileUploadArea = (
    fileType: 'company1' | 'company2',
    label: string,
    file: FileWithPreview | null,
    setFile: (file: FileWithPreview | null) => void,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    const isActive = dragActive === fileType;
    const hasFile = !!file;
    const hasError = file?.error;

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
            ${hasError ? 'border-red-300 bg-red-50' : 
              isActive ? 'border-primary-400 bg-primary-50' :
              hasFile ? 'border-green-300 bg-green-50' :
              'border-neutral-300 hover:border-neutral-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={(e) => handleDragEvents(e, fileType, 'enter')}
          onDragLeave={(e) => handleDragEvents(e, fileType, 'leave')}
          onDragOver={(e) => handleDragEvents(e, fileType, 'over')}
          onDrop={(e) => handleDragEvents(e, fileType, 'drop')}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFileInputChange(e, setFile)}
            disabled={disabled}
          />

          {hasFile ? (
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-neutral-900">{file.file.name}</p>
              <p className="text-xs text-neutral-500">{(file.file.size / 1024).toFixed(1)} KB</p>
              
              {hasError ? (
                <div className="mt-2">
                  <Badge variant="error">{file.error}</Badge>
                </div>
              ) : file.previewData ? (
                <div className="mt-2">
                  <Badge variant="success">
                    {file.previewData.totalRows} rows, {file.previewData.headers.length} columns
                  </Badge>
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant="default">Processing...</Badge>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(fileType);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-neutral-900">Drop CSV file here</p>
              <p className="text-xs text-neutral-500">or click to browse</p>
            </div>
          )}
        </div>

        {/* File preview */}
        {file?.previewData && !hasError && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-neutral-900 mb-2">Preview</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-neutral-100">
                    {file.previewData.headers.slice(0, 6).map((header, index) => (
                      <th key={index} className="px-2 py-1 text-left font-medium text-neutral-700">
                        {header}
                      </th>
                    ))}
                    {file.previewData.headers.length > 6 && (
                      <th className="px-2 py-1 text-left font-medium text-neutral-500">...</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {file.previewData.rows.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-neutral-200">
                      {row.slice(0, 6).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-2 py-1 text-neutral-600">
                          {cell}
                        </td>
                      ))}
                      {row.length > 6 && (
                        <td className="px-2 py-1 text-neutral-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {file.previewData.totalRows > 3 && (
              <p className="text-xs text-neutral-500 mt-2">
                Showing 3 of {file.previewData.totalRows} rows
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const canRunMatching = company1File?.file && company2File?.file && 
                        !company1File.error && !company2File.error && 
                        !uploadStatus.isUploading;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-neutral-900">CSV Upload & Matching</h2>
        <p className="text-neutral-600">
          Upload CSV files from both companies to find matches and discrepancies
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderFileUploadArea(
            'company1',
            'Company 1 CSV (Your Records)',
            company1File,
            setCompany1File,
            file1InputRef
          )}
          
          {renderFileUploadArea(
            'company2',
            'Company 2 CSV (Counterparty Records)',
            company2File,
            setCompany2File,
            file2InputRef
          )}
        </div>

        {/* Date Format Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Company 1 Date Format
            </label>
            <select
              value={dateFormat1}
              onChange={(e) => setDateFormat1(e.target.value as DateFormat)}
              className="input w-full"
              disabled={disabled || uploadStatus.isUploading}
            >
              {DATE_FORMAT_OPTIONS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label} (e.g., {format.example})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Company 2 Date Format
            </label>
            <select
              value={dateFormat2}
              onChange={(e) => setDateFormat2(e.target.value as DateFormat)}
              className="input w-full"
              disabled={disabled || uploadStatus.isUploading}
            >
              {DATE_FORMAT_OPTIONS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label} (e.g., {format.example})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this matching operation..."
            className="input w-full h-20 resize-none"
            disabled={disabled || uploadStatus.isUploading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="text-sm text-neutral-600">
            {uploadStatus.isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>{uploadStatus.message}</span>
              </div>
            ) : (
              <span>
                Files ready: {(company1File?.file && company2File?.file) ? '✓' : 
                            `${(company1File?.file ? 1 : 0) + (company2File?.file ? 1 : 0)}/2`}
              </span>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleRunMatching}
            disabled={!canRunMatching || disabled}
            leftIcon={
              uploadStatus.isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            }
          >
            {uploadStatus.isUploading ? 'Processing...' : 'Run Matching'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include headers in the first row</li>
            <li>• Required columns: transaction_number, amount, date</li>
            <li>• Optional columns: due_date, status, reference, vendor</li>
            <li>• Maximum file size: 10MB per file</li>
            <li>• Use consistent date formats within each file</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUpload;
