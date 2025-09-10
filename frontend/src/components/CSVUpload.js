/**
 * CSV Upload Component
 * 
 * Handles CSV file uploads for LedgerLink
 */

import React, { useState, useRef } from 'react';
import './CSVUpload.css';

const CSVUpload = ({ onDataProcessed }) => {
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    isDragOver: false,
    error: null,
    success: null
  });
  
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({
        ...uploadStatus,
        error: 'Please select a CSV file (.csv extension required)'
      });
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadStatus({
        ...uploadStatus,
        error: 'File too large. Maximum size is 10MB.'
      });
      return;
    }
    
    processCSVFile(file);
  };
  
  // Process CSV file
  const processCSVFile = (file) => {
    setUploadStatus({
      isUploading: true,
      isDragOver: false,
      error: null,
      success: null
    });
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header row and one data row');
        }
        
        // Parse CSV (simple implementation)
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length === headers.length) {
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index];
              });
              data.push(row);
            }
          }
        }
        
        if (data.length === 0) {
          throw new Error('No valid data rows found in CSV file');
        }
        
        // Show preview
        setPreviewData({
          fileName: file.name,
          headers: headers,
          data: data,
          totalRows: data.length
        });
        
        setUploadStatus({
          isUploading: false,
          isDragOver: false,
          error: null,
          success: `Successfully processed ${data.length} rows from ${file.name}`
        });
        
      } catch (error) {
        console.error('CSV processing error:', error);
        setUploadStatus({
          isUploading: false,
          isDragOver: false,
          error: `Error processing CSV: ${error.message}`,
          success: null
        });
      }
    };
    
    reader.onerror = () => {
      setUploadStatus({
        isUploading: false,
        isDragOver: false,
        error: 'Error reading file. Please try again.',
        success: null
      });
    };
    
    reader.readAsText(file);
  };
  
  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setUploadStatus(prev => ({ ...prev, isDragOver: true }));
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setUploadStatus(prev => ({ ...prev, isDragOver: false }));
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  // Import data
  const handleImportData = () => {
    if (previewData && onDataProcessed) {
      onDataProcessed(previewData.data, previewData.fileName);
      
      // Reset component
      setPreviewData(null);
      setUploadStatus({
        isUploading: false,
        isDragOver: false,
        error: null,
        success: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Reset upload
  const handleReset = () => {
    setPreviewData(null);
    setUploadStatus({
      isUploading: false,
      isDragOver: false,
      error: null,
      success: null
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="csv-upload">
      <div className="upload-header">
        <h3>📄 CSV File Upload</h3>
        <p>Upload your ledger data from CSV files for reconciliation</p>
      </div>
      
      {!previewData ? (
        <>
          {/* Upload Area */}
          <div 
            className={`upload-area ${
              uploadStatus.isDragOver ? 'drag-over' : ''
            } ${uploadStatus.isUploading ? 'uploading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-content">
              {uploadStatus.isUploading ? (
                <>
                  <div className="upload-spinner"></div>
                  <h4>Processing CSV file...</h4>
                  <p>Please wait while we parse your data</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📄</div>
                  <h4>Drop your CSV file here</h4>
                  <p>or click to browse and select a file</p>
                  <div className="upload-hint">
                    Supported format: .csv files (max 10MB)
                  </div>
                </>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
          
          {/* Status Messages */}
          {uploadStatus.error && (
            <div className="status-message error">
              ❌ {uploadStatus.error}
            </div>
          )}
          
          {uploadStatus.success && (
            <div className="status-message success">
              ✅ {uploadStatus.success}
            </div>
          )}
          
          {/* File Format Guide */}
          <div className="format-guide">
            <h4>📈 CSV Format Requirements</h4>
            <div className="format-example">
              <h5>Expected CSV format:</h5>
              <pre>
transaction_number,transaction_type,amount,issue_date,due_date,status,vendor
INV001,INVOICE,1000.00,2024-01-01,2024-01-31,open,"ABC Company"
CR001,CREDIT,500.00,2024-01-02,2024-01-31,paid,"XYZ Corp"
              </pre>
            </div>
            
            <div className="format-tips">
              <h5>💡 Tips for best results:</h5>
              <ul>
                <li>Include headers in the first row</li>
                <li>Use consistent date formats (YYYY-MM-DD recommended)</li>
                <li>Enclose text with commas in quotes</li>
                <li>Keep file size under 10MB for optimal performance</li>
                <li>Remove any empty rows at the end of the file</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // Preview Data
        <div className="data-preview">
          <div className="preview-header">
            <h4>👁️ Data Preview: {previewData.fileName}</h4>
            <p>{previewData.totalRows} rows found</p>
          </div>
          
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.data.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {previewData.headers.map((header, colIndex) => (
                      <td key={colIndex}>{row[header] || ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {previewData.totalRows > 5 && (
              <div className="preview-note">
                Showing first 5 rows of {previewData.totalRows} total rows
              </div>
            )}
          </div>
          
          <div className="preview-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleReset}
            >
              🔄 Upload Different File
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleImportData}
            >
              ✅ Import Data ({previewData.totalRows} rows)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVUpload;