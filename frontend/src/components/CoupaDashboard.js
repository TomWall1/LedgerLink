/**
 * Coupa Dashboard Integration Example
 * 
 * This shows how to integrate the Coupa components into your existing LedgerLink dashboard.
 * Copy the relevant parts into your actual dashboard component.
 */

import React, { useState } from 'react';
import CoupaConnection from './CoupaConnection';
import CoupaDataPreview from './CoupaDataPreview';
import './CoupaDashboard.css';

const CoupaDashboard = () => {
  // State for managing Coupa integration
  const [coupaData, setCoupaData] = useState(null);
  const [showCoupaPreview, setShowCoupaPreview] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [activeTab, setActiveTab] = useState('connect'); // 'connect', 'preview', 'imported'

  // Handle successful Coupa connection
  const handleCoupaConnectionSuccess = (connectionResult) => {
    console.log('Coupa connection successful:', connectionResult);
    // You could save connection status to state or localStorage
  };

  // Handle data fetched from Coupa
  const handleCoupaDataFetched = (data, dataType) => {
    console.log(`Fetched ${data.length} ${dataType} records from Coupa`);
    
    setCoupaData({ 
      data, 
      dataType,
      fetchedAt: new Date().toISOString()
    });
    
    setShowCoupaPreview(true);
    setActiveTab('preview');
  };

  // Handle user accepting/importing Coupa data
  const handleCoupaDataAccepted = (selectedData, dataType) => {
    console.log(`Importing ${selectedData.length} ${dataType} records`);
    
    // Add metadata to the imported data
    const dataWithMetadata = selectedData.map(item => ({
      ...item,
      importedAt: new Date().toISOString(),
      importedFrom: 'coupa-api',
      dataType: dataType
    }));
    
    // Add to imported data list
    setImportedData(prev => [...prev, ...dataWithMetadata]);
    
    // Clear preview
    setShowCoupaPreview(false);
    setCoupaData(null);
    
    // Switch to imported data tab
    setActiveTab('imported');
    
    // Here you would integrate with your existing reconciliation logic
    // For example:
    // processReconciliationData(dataWithMetadata);
    
    alert(`Successfully imported ${selectedData.length} records from Coupa!`);
  };

  // Handle user rejecting Coupa data
  const handleCoupaDataRejected = () => {
    console.log('User rejected Coupa data');
    
    setShowCoupaPreview(false);
    setCoupaData(null);
    setActiveTab('connect');
  };

  // Clear all imported data
  const clearImportedData = () => {
    if (window.confirm('Are you sure you want to clear all imported Coupa data?')) {
      setImportedData([]);
    }
  };

  // Export imported data to CSV (example functionality)
  const exportToCSV = () => {
    if (importedData.length === 0) {
      alert('No data to export');
      return;
    }

    // Convert data to CSV format
    const headers = Object.keys(importedData[0]);
    const csvContent = [
      headers.join(','),
      ...importedData.map(item => 
        headers.map(header => 
          JSON.stringify(item[header] || '')
        ).join(',')
      )
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coupa-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="coupa-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h2>🔗 Coupa Integration Dashboard</h2>
        <p>Connect to Coupa and automatically sync your invoice and approval data</p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'connect' ? 'active' : ''}`}
          onClick={() => setActiveTab('connect')}
        >
          🔗 Connect
        </button>
        
        <button 
          className={`tab ${activeTab === 'preview' ? 'active' : ''} ${!showCoupaPreview ? 'disabled' : ''}`}
          onClick={() => showCoupaPreview && setActiveTab('preview')}
          disabled={!showCoupaPreview}
        >
          👁️ Preview {coupaData ? `(${coupaData.data.length})` : ''}
        </button>
        
        <button 
          className={`tab ${activeTab === 'imported' ? 'active' : ''}`}
          onClick={() => setActiveTab('imported')}
        >
          📊 Imported Data ({importedData.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        
        {/* Connect Tab */}
        {activeTab === 'connect' && (
          <div className="tab-content">
            <CoupaConnection 
              onConnectionSuccess={handleCoupaConnectionSuccess}
              onDataFetched={handleCoupaDataFetched}
            />
            
            {/* Quick Stats */}
            {importedData.length > 0 && (
              <div className="quick-stats">
                <h4>📈 Import Summary</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{importedData.length}</div>
                    <div className="stat-label">Total Records</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {new Set(importedData.map(item => item.dataType)).size}
                    </div>
                    <div className="stat-label">Data Types</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">
                      {importedData.filter(item => item.amount).reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                    <div className="stat-label">Total Amount</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Preview Tab */}
        {activeTab === 'preview' && showCoupaPreview && coupaData && (
          <div className="tab-content">
            <CoupaDataPreview
              data={coupaData.data}
              dataType={coupaData.dataType}
              onDataAccept={handleCoupaDataAccepted}
              onDataReject={handleCoupaDataRejected}
            />
          </div>
        )}
        
        {/* Imported Data Tab */}
        {activeTab === 'imported' && (
          <div className="tab-content">
            <div className="imported-data-section">
              <div className="section-header">
                <h3>📊 Imported Coupa Data</h3>
                <div className="section-actions">
                  {importedData.length > 0 && (
                    <>
                      <button 
                        onClick={exportToCSV}
                        className="btn btn-secondary"
                      >
                        📄 Export CSV
                      </button>
                      <button 
                        onClick={clearImportedData}
                        className="btn btn-danger"
                      >
                        🗑️ Clear All
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {importedData.length === 0 ? (
                <div className="empty-state">
                  <h4>No Data Imported Yet</h4>
                  <p>Connect to Coupa and import data to see it here.</p>
                  <button 
                    onClick={() => setActiveTab('connect')}
                    className="btn btn-primary"
                  >
                    🔗 Go to Connect Tab
                  </button>
                </div>
              ) : (
                <div className="imported-data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Vendor</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Imported</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedData.slice(0, 50).map((item, index) => (
                        <tr key={index}>
                          <td>{item.invoiceNumber || 'N/A'}</td>
                          <td>{item.vendor || item.name || 'N/A'}</td>
                          <td>
                            {item.amount 
                              ? item.amount.toLocaleString('en-US', { style: 'currency', currency: item.currency || 'USD' })
                              : 'N/A'
                            }
                          </td>
                          <td>
                            {item.issueDate 
                              ? new Date(item.issueDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <span className={`status-badge ${item.status?.toLowerCase()}`}>
                              {item.status || 'Unknown'}
                            </span>
                          </td>
                          <td>{item.dataType}</td>
                          <td>
                            {item.importedAt 
                              ? new Date(item.importedAt).toLocaleString()
                              : 'N/A'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {importedData.length > 50 && (
                    <div className="table-footer">
                      <p>Showing first 50 of {importedData.length} records. Export to CSV to see all data.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions Panel */}
      <div className="instructions-panel">
        <h4>💡 How to Use</h4>
        <ol>
          <li><strong>Connect:</strong> Enter your Coupa credentials and test the connection</li>
          <li><strong>Fetch:</strong> Choose data type (invoices, approvals, etc.) and date range</li>
          <li><strong>Preview:</strong> Review the fetched data and select what to import</li>
          <li><strong>Import:</strong> Selected data will be added to your imported data list</li>
          <li><strong>Process:</strong> Use the imported data for reconciliation in LedgerLink</li>
        </ol>
        
        <div className="tips">
          <h5>💡 Tips:</h5>
          <ul>
            <li>Start with a small date range to test the connection</li>
            <li>Use the preview to verify data accuracy before importing</li>
            <li>Export to CSV if you need to work with the data offline</li>
            <li>Clear imported data regularly to keep the interface clean</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoupaDashboard;