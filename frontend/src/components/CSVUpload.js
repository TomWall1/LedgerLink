/**
 * CSV Upload Component
 * 
 * Handles manual CSV file uploads for ledger data.
 * This restores the original CSV upload functionality.
 */

import React, { useState, useRef } from 'react';
import './CSVUpload.css';

const CSVUpload = ({ onDataUploaded }) => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    isDragOver: false,
    uploadedFile: null,
    error: null,
    preview: null
  });
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a CSV file (.csv extension required)'
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 10MB'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      uploadedFile: file,
      error: null,
      isUploading: true
    }));

    // Process the CSV file
    processCSVFile(file);
  };

  // Process CSV file
  const processCSVFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = parseCSV(csvText);
        
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          preview: parsedData.slice(0, 5) // Show first 5 rows
        }));

        // Notify parent component
        if (onDataUploaded) {
          onDataUploaded(parsedData);
        }

      } catch (error) {
        console.error('Error processing CSV:', error);
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: `Error processing CSV: ${error.message}`
        }));
      }
    };

    reader.onerror = () => {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: 'Error reading file'
      }));
    };

    reader.readAsText(file);
  };

  // Simple CSV parser
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      if (row.length === headers.length) {
        const rowObject = {};
        headers.forEach((header, index) => {
          rowObject[header] = row[index] || '';
        });
        data.push(rowObject);
      }
    }

    if (data.length === 0) {
      throw new Error('No valid data rows found in CSV');
    }

    return data;
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: true }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear upload
  const clearUpload = () => {
    setUploadState({
      isUploading: false,
      isDragOver: false,
      uploadedFile: null,
      error: null,
      preview: null
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="csv-upload">
      <div className="upload-header">
        <h3>📁 CSV File Upload</h3>
        <p>Upload your ledger data from a CSV file</p>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="error-message">
          ❌ {uploadState.error}
        </div>
      )}

      {/* Upload Area */}
      <div 
        className={`upload-area ${
          uploadState.isDragOver ? 'drag-over' : ''
        } ${uploadState.uploadedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {uploadState.isUploading ? (
          <div className="uploading-state">
            <div className="spinner"></div>
            <h4>Processing CSV...</h4>
            <p>Please wait while we process your file</p>
          </div>
        ) : uploadState.uploadedFile ? (
          <div className="file-uploaded">
            <div className="file-icon">✅</div>
            <h4>File Uploaded Successfully</h4>
            <p><strong>{uploadState.uploadedFile.name}</strong></p>
            <p>{(uploadState.uploadedFile.size / 1024).toFixed(1)} KB</p>
            <button onClick={clearUpload} className="btn btn-outline">
              🗑️ Remove File
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <h4>Drop your CSV file here</h4>
            <p>or <span className="click-text">click to browse</span></p>
            <div className="file-requirements">
              <small>Supported: .csv files up to 10MB</small>
            </div>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="format-guide">
        <h4>📋 Expected CSV Format</h4>
        <p>Your CSV should include the following columns:</p>
        <div className="format-example">
          <code>
            transaction_number,transaction_type,amount,issue_date,due_date,status,reference<br/>
            INV001,INVOICE,1000.00,2024-01-01,2024-01-31,open,PO12345<br/>
            CR001,CREDIT,500.00,2024-01-02,2024-01-32,paid,REF123
          </code>
        </div>
        <div className="format-tips">
          <h5>💡 Tips:</h5>
          <ul>
            <li>First row should contain column headers</li>
            <li>Use comma-separated values</li>
            <li>Dates should be in YYYY-MM-DD format</li>
            <li>Amounts should be numeric (no currency symbols)</li>
          </ul>
        </div>
      </div>

      {/* Data Preview */}
      {uploadState.preview && (
        <div className="data-preview">
          <h4>📊 Data Preview</h4>
          <p>Showing first 5 rows of uploaded data:</p>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {Object.keys(uploadState.preview[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadState.preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{String(value)}</td>
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
};

export default CSVUpload;