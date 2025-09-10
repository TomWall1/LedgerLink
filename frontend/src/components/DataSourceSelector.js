/**
 * Data Source Selector Component
 * 
 * This is the main interface where users choose how to import their data:
 * - CSV File Upload
 * - Xero API Integration  
 * - Coupa API Integration
 */

import React, { useState } from 'react';
import CSVUpload from './CSVUpload';
import XeroIntegration from './XeroIntegration';
import CoupaConnection from './CoupaConnection';
import './DataSourceSelector.css';

const DataSourceSelector = ({ onDataImported }) => {
  const [selectedSource, setSelectedSource] = useState(null);
  const [importedData, setImportedData] = useState([]);
  const [importHistory, setImportHistory] = useState([]);

  // Handle data imported from any source
  const handleDataImported = (data, source, metadata = {}) => {
    const importRecord = {
      id: Date.now(),
      source: source,
      data: data,
      timestamp: new Date().toISOString(),
      recordCount: data.length,
      metadata: metadata
    };

    // Add to import history
    setImportHistory(prev => [importRecord, ...prev]);
    
    // Update current imported data
    setImportedData(data);
    
    // Notify parent component
    if (onDataImported) {
      onDataImported(data, source, metadata);
    }

    console.log(`✅ Imported ${data.length} records from ${source}`);
  };

  // Handle CSV upload
  const handleCSVUpload = (csvData) => {
    handleDataImported(csvData, 'csv-upload', {
      format: 'CSV',
      uploadedAt: new Date().toISOString()
    });
  };

  // Handle Xero data fetch
  const handleXeroData = (xeroData) => {
    handleDataImported(xeroData, 'xero-api', {
      format: 'Xero API',
      syncedAt: new Date().toISOString()
    });
  };

  // Handle Coupa data fetch
  const handleCoupaData = (coupaData, dataType) => {
    handleDataImported(coupaData, 'coupa-api', {
      format: 'Coupa API',
      dataType: dataType,
      syncedAt: new Date().toISOString()
    });
  };

  // Clear all imported data
  const clearImportedData = () => {
    if (window.confirm('Are you sure you want to clear all imported data?')) {
      setImportedData([]);
      setImportHistory([]);
    }
  };

  // Calculate statistics
  const totalRecords = importedData.length;
  const uniqueSources = new Set(importHistory.map(h => h.source)).size;
  const lastImport = importHistory[0];

  return (
    <div className="data-source-selector">
      {/* Header */}
      <div className="selector-header">
        <h2>📊 Data Source Selection</h2>
        <p>Choose how you want to import your ledger data for reconciliation</p>
      </div>

      {/* Source Selection Cards */}
      <div className="source-cards">
        
        {/* CSV Upload Card */}
        <div 
          className={`source-card ${selectedSource === 'csv' ? 'active' : ''}`}
          onClick={() => setSelectedSource('csv')}
        >
          <div className="card-icon">📁</div>
          <h3>CSV Upload</h3>
          <p>Upload your ledger data from a CSV file</p>
          <div className="card-features">
            <span>✓ Manual file upload</span>
            <span>✓ Standard CSV format</span>
            <span>✓ Quick import</span>
          </div>
          {selectedSource === 'csv' && (
            <div className="selected-indicator">Selected</div>
          )}
        </div>

        {/* Xero Integration Card */}
        <div 
          className={`source-card ${selectedSource === 'xero' ? 'active' : ''}`}
          onClick={() => setSelectedSource('xero')}
        >
          <div className="card-icon">🔗</div>
          <h3>Xero Integration</h3>
          <p>Connect directly to your Xero accounting system</p>
          <div className="card-features">
            <span>✓ Real-time sync</span>
            <span>✓ OAuth secure connection</span>
            <span>✓ Automatic updates</span>
          </div>
          {selectedSource === 'xero' && (
            <div className="selected-indicator">Selected</div>
          )}
        </div>

        {/* Coupa Integration Card */}
        <div 
          className={`source-card ${selectedSource === 'coupa' ? 'active' : ''}`}
          onClick={() => setSelectedSource('coupa')}
        >
          <div className="card-icon">🏢</div>
          <h3>Coupa Integration</h3>
          <p>Connect to your Coupa procurement system</p>
          <div className="card-features">
            <span>✓ Invoice approvals</span>
            <span>✓ Supplier data</span>
            <span>✓ API integration</span>
          </div>
          {selectedSource === 'coupa' && (
            <div className="selected-indicator">Selected</div>
          )}
        </div>
      </div>

      {/* Selected Source Component */}
      <div className="source-component">
        {selectedSource === 'csv' && (
          <CSVUpload onDataUploaded={handleCSVUpload} />
        )}
        
        {selectedSource === 'xero' && (
          <XeroIntegration onDataFetched={handleXeroData} />
        )}
        
        {selectedSource === 'coupa' && (
          <CoupaConnection onDataFetched={handleCoupaData} />
        )}
      </div>

      {/* Import Summary */}
      {importedData.length > 0 && (
        <div className="import-summary">
          <div className="summary-header">
            <h3>📈 Import Summary</h3>
            <button onClick={clearImportedData} className="btn btn-outline">
              🗑️ Clear Data
            </button>
          </div>
          
          <div className="summary-stats">
            <div className="stat">
              <div className="stat-number">{totalRecords}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat">
              <div className="stat-number">{uniqueSources}</div>
              <div className="stat-label">Data Sources</div>
            </div>
            <div className="stat">
              <div className="stat-number">
                {lastImport ? new Date(lastImport.timestamp).toLocaleDateString() : 'N/A'}
              </div>
              <div className="stat-label">Last Import</div>
            </div>
          </div>

          {/* Recent Imports */}
          <div className="recent-imports">
            <h4>Recent Imports</h4>
            <div className="import-list">
              {importHistory.slice(0, 5).map(import_ => (
                <div key={import_.id} className="import-item">
                  <div className="import-source">
                    {import_.source === 'csv-upload' && '📁'}
                    {import_.source === 'xero-api' && '🔗'}
                    {import_.source === 'coupa-api' && '🏢'}
                    <span className="source-name">
                      {import_.source === 'csv-upload' && 'CSV Upload'}
                      {import_.source === 'xero-api' && 'Xero API'}
                      {import_.source === 'coupa-api' && 'Coupa API'}
                    </span>
                  </div>
                  <div className="import-details">
                    <span className="record-count">{import_.recordCount} records</span>
                    <span className="import-time">
                      {new Date(import_.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="data-preview">
            <h4>Data Preview (First 5 Records)</h4>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    {importedData[0] && Object.keys(importedData[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importedData.slice(0, 5).map((row, index) => (
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

          {/* Next Steps */}
          <div className="next-steps">
            <h4>✨ Ready for Reconciliation</h4>
            <p>Your data has been imported and is ready for processing. You can now:</p>
            <div className="action-buttons">
              <button className="btn btn-primary">
                🔍 Start Reconciliation
              </button>
              <button className="btn btn-secondary">
                📊 View Analytics
              </button>
              <button className="btn btn-secondary">
                💾 Export Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceSelector;