/**
 * Data Preview Component
 * 
 * Shows all imported data from different sources
 */

import React, { useState } from 'react';
import './DataPreview.css';

const DataPreview = ({ importedData }) => {
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all records from all sources
  const allRecords = importedData.reduce((acc, dataSet) => {
    const recordsWithSource = dataSet.data.map(record => ({
      ...record,
      sourceInfo: {
        source: dataSet.source,
        sourceDetail: dataSet.sourceDetail,
        importedAt: dataSet.importedAt,
        recordCount: dataSet.recordCount
      }
    }));
    return [...acc, ...recordsWithSource];
  }, []);
  
  // Filter records based on selections
  const filteredRecords = allRecords.filter(record => {
    const sourceMatch = selectedSource === 'all' || record.sourceInfo.source === selectedSource;
    const searchMatch = !searchTerm || 
      (record.invoiceNumber && record.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.vendor && record.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.contact && record.contact.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return sourceMatch && searchMatch;
  });
  
  // Get source statistics
  const getSourceStats = () => {
    const stats = {};
    importedData.forEach(dataSet => {
      if (!stats[dataSet.source]) {
        stats[dataSet.source] = {
          totalRecords: 0,
          dataSets: 0,
          lastImport: null
        };
      }
      stats[dataSet.source].totalRecords += dataSet.recordCount;
      stats[dataSet.source].dataSets += 1;
      
      const importDate = new Date(dataSet.importedAt);
      if (!stats[dataSet.source].lastImport || importDate > new Date(stats[dataSet.source].lastImport)) {
        stats[dataSet.source].lastImport = dataSet.importedAt;
      }
    });
    return stats;
  };
  
  const sourceStats = getSourceStats();
  
  // Export data to CSV
  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Get all unique keys from the records
    const allKeys = new Set();
    filteredRecords.forEach(record => {
      Object.keys(record).forEach(key => {
        if (key !== 'sourceInfo') {
          allKeys.add(key);
        }
      });
      // Add source info keys with prefix
      Object.keys(record.sourceInfo || {}).forEach(key => {
        allKeys.add(`source_${key}`);
      });
    });
    
    const headers = Array.from(allKeys);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => 
        headers.map(header => {
          let value = '';
          if (header.startsWith('source_')) {
            const sourceKey = header.replace('source_', '');
            value = record.sourceInfo?.[sourceKey] || '';
          } else {
            value = record[header] || '';
          }
          return JSON.stringify(value);
        }).join(',')
      )
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledgerlink-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  
  if (importedData.length === 0) {
    return (
      <div className="data-preview empty-state">
        <div className="empty-content">
          <h3>📁 No Data Imported</h3>
          <p>Import data from CSV, Xero, or Coupa to view it here.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="data-preview">
      {/* Header */}
      <div className="preview-header">
        <div className="header-left">
          <h3>📁 Imported Data Overview</h3>
          <p>{allRecords.length} total records from {Object.keys(sourceStats).length} sources</p>
        </div>
        
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              📈 Summary
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              📋 Details
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="summary-view">
          <div className="source-stats">
            <h4>📈 Data Sources Summary</h4>
            <div className="stats-grid">
              {Object.entries(sourceStats).map(([source, stats]) => (
                <div key={source} className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">
                      {source === 'CSV Upload' && '📄'}
                      {source === 'Xero API' && '🔗'}
                      {source === 'Coupa API' && '🏢'}
                    </div>
                    <h5>{source}</h5>
                  </div>
                  
                  <div className="stat-content">
                    <div className="stat-row">
                      <span className="stat-label">Records:</span>
                      <span className="stat-value">{stats.totalRecords}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Imports:</span>
                      <span className="stat-value">{stats.dataSets}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Last Import:</span>
                      <span className="stat-value">
                        {new Date(stats.lastImport).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Import History */}
          <div className="import-history">
            <h4>🕰️ Import History</h4>
            <div className="history-list">
              {importedData.slice().reverse().map((dataSet, index) => (
                <div key={index} className="history-item">
                  <div className="history-icon">
                    {dataSet.source === 'CSV Upload' && '📄'}
                    {dataSet.source === 'Xero API' && '🔗'}
                    {dataSet.source === 'Coupa API' && '🏢'}
                  </div>
                  
                  <div className="history-content">
                    <div className="history-title">
                      {dataSet.source} - {dataSet.sourceDetail}
                    </div>
                    <div className="history-meta">
                      {dataSet.recordCount} records • {new Date(dataSet.importedAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="history-actions">
                    <button 
                      className="btn btn-sm"
                      onClick={() => {
                        setSelectedSource(dataSet.source);
                        setViewMode('detailed');
                      }}
                    >
                      View Data
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="detailed-view">
          {/* Filters */}
          <div className="data-filters">
            <div className="filter-group">
              <label>Source:</label>
              <select 
                value={selectedSource} 
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                <option value="all">All Sources</option>
                {Object.keys(sourceStats).map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search invoices, vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={exportToCSV}>
                📄 Export CSV
              </button>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="data-table-container">
            <div className="table-info">
              Showing {filteredRecords.length} of {allRecords.length} records
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Invoice #</th>
                  <th>Vendor/Contact</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Imported</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 100).map((record, index) => (
                  <tr key={index}>
                    <td>
                      <span className="source-tag">
                        {record.sourceInfo.source}
                      </span>
                    </td>
                    <td>{record.invoiceNumber || record.invoiceID || 'N/A'}</td>
                    <td>{record.vendor || record.contact || record.name || 'N/A'}</td>
                    <td>
                      {record.amount || record.total ? 
                        `$${(record.amount || record.total).toFixed(2)}` : 'N/A'
                      }
                    </td>
                    <td>
                      {record.issueDate || record.date || record.invoice_date || 'N/A'}
                    </td>
                    <td>
                      {record.status && (
                        <span className={`status-tag ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      )}
                    </td>
                    <td>
                      {new Date(record.sourceInfo.importedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRecords.length > 100 && (
              <div className="table-footer">
                Showing first 100 records. Export to CSV to see all data.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPreview;