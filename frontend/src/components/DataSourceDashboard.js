/**
 * LedgerLink Multi-Source Data Dashboard
 * 
 * Main dashboard where users can choose between:
 * - CSV File Upload
 * - Xero API Integration
 * - Coupa API Integration
 */

import React, { useState } from 'react';
import './DataSourceDashboard.css';

const DataSourceDashboard = () => {
  const [activeSource, setActiveSource] = useState('selector');
  const [importedData, setImportedData] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);
  
  // Add data from any source
  const addImportedData = (data, sourceName, sourceDetail) => {
    const newDataSet = {
      id: Date.now(),
      source: sourceName,
      sourceDetail: sourceDetail,
      data: data,
      importedAt: new Date().toISOString(),
      recordCount: data.length
    };
    
    setImportedData(prev => [...prev, newDataSet]);
    
    // Add to history
    setDataHistory(prev => [...prev, {
      id: Date.now(),
      source: sourceName,
      detail: sourceDetail,
      recordCount: data.length,
      timestamp: new Date().toISOString()
    }]);
  };
  
  // Get statistics
  const getStats = () => {
    const totalRecords = importedData.reduce((sum, item) => sum + item.recordCount, 0);
    return {
      totalRecords,
      totalSources: new Set(importedData.map(item => item.source)).size,
      csvRecords: importedData.filter(item => item.source === 'CSV Upload').reduce((sum, item) => sum + item.recordCount, 0),
      xeroRecords: importedData.filter(item => item.source === 'Xero API').reduce((sum, item) => sum + item.recordCount, 0),
      coupaRecords: importedData.filter(item => item.source === 'Coupa API').reduce((sum, item) => sum + item.recordCount, 0)
    };
  };
  
  const stats = getStats();
  
  return (
    <div className="ledgerlink-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 LedgerLink</h1>
          <p>Account Reconciliation System</p>
        </div>
        
        {stats.totalRecords > 0 && (
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.totalRecords}</span>
              <span className="stat-label">Total Records</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.totalSources}</span>
              <span className="stat-label">Data Sources</span>
            </div>
          </div>
        )}
      </header>
      
      {/* Data Source Selection */}
      <main className="dashboard-main">
        <div className="source-selector">
          <h2>📈 Choose Your Data Source</h2>
          <p>Select how you want to import your ledger data for reconciliation</p>
          
          <div className="source-options">
            
            {/* CSV Upload Option */}
            <div className="source-card csv-card">
              <div className="card-header">
                <div className="card-icon">📄</div>
                <h3>Upload CSV Files</h3>
              </div>
              <div className="card-content">
                <p>Upload your ledger data from CSV files</p>
                <ul>
                  <li>Accounts Receivable (AR) data</li>
                  <li>Accounts Payable (AP) data</li>
                  <li>Custom transaction formats</li>
                  <li>Bulk data import</li>
                </ul>
                {stats.csvRecords > 0 && (
                  <div className="card-status success">
                    ✓ {stats.csvRecords} records imported
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveSource('csv')}
                >
                  📄 Upload CSV File
                </button>
              </div>
            </div>
            
            {/* Xero Integration Option */}
            <div className="source-card xero-card">
              <div className="card-header">
                <div className="card-icon">🔗</div>
                <h3>Connect to Xero</h3>
              </div>
              <div className="card-content">
                <p>Direct API integration with Xero accounting</p>
                <ul>
                  <li>Invoices and credit notes</li>
                  <li>Bills and purchase orders</li>
                  <li>Real-time data synchronization</li>
                  <li>Automatic updates</li>
                </ul>
                {stats.xeroRecords > 0 && (
                  <div className="card-status success">
                    ✓ {stats.xeroRecords} records imported
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveSource('xero')}
                >
                  🔗 Connect to Xero
                </button>
              </div>
            </div>
            
            {/* Coupa Integration Option */}
            <div className="source-card coupa-card">
              <div className="card-header">
                <div className="card-icon">🏢</div>
                <h3>Connect to Coupa</h3>
              </div>
              <div className="card-content">
                <p>Direct API integration with Coupa procurement</p>
                <ul>
                  <li>Invoice approvals and workflows</li>
                  <li>Supplier and vendor data</li>
                  <li>Purchase order matching</li>
                  <li>Procurement analytics</li>
                </ul>
                {stats.coupaRecords > 0 && (
                  <div className="card-status success">
                    ✓ {stats.coupaRecords} records imported
                  </div>
                )}
              </div>
              <div className="card-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveSource('coupa')}
                >
                  🏢 Connect to Coupa
                </button>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          {stats.totalRecords > 0 && (
            <div className="quick-actions">
              <h3>🚀 Ready to Reconcile?</h3>
              <p>You have {stats.totalRecords} records ready for reconciliation</p>
              <div className="action-buttons">
                <button 
                  className="btn btn-success btn-large"
                  onClick={() => setActiveSource('reconciliation')}
                >
                  🔄 Start Reconciliation
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveSource('data-view')}
                >
                  👁️ View All Data
                </button>
              </div>
            </div>
          )}
          
          {/* Recent Activity */}
          {dataHistory.length > 0 && (
            <div className="recent-activity">
              <h3>🕰️ Recent Activity</h3>
              <div className="activity-list">
                {dataHistory.slice(-3).reverse().map(item => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon">
                      {item.source === 'CSV Upload' && '📄'}
                      {item.source === 'Xero API' && '🔗'}
                      {item.source === 'Coupa API' && '🏢'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">
                        {item.source} - {item.detail}
                      </div>
                      <div className="activity-meta">
                        {item.recordCount} records • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Instructions */}
      <aside className="instructions-panel">
        <h3>💡 How It Works</h3>
        <div className="instruction-steps">
          <div className="step">
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Choose Data Source</strong>
              <p>Select CSV upload, Xero, or Coupa integration</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>Import Data</strong>
              <p>Upload files or connect to your accounting system</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>Reconcile</strong>
              <p>Automatically match and reconcile your accounts</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DataSourceDashboard;