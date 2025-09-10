/**
 * Complete LedgerLink Multi-Source Dashboard
 * 
 * This is the main dashboard that integrates:
 * - CSV File Upload
 * - Xero API Integration  
 * - Coupa API Integration
 * - Data Preview
 * - Reconciliation Engine
 */

import React, { useState, useEffect } from 'react';
import CSVUpload from './CSVUpload';
import XeroIntegration from './XeroIntegration';
import CoupaConnection from './CoupaConnection';
import CoupaDataPreview from './CoupaDataPreview';
import DataPreview from './DataPreview';
import ReconciliationDashboard from './ReconciliationDashboard';
import './LedgerLinkDashboard.css';

const LedgerLinkDashboard = () => {
  // Main application state
  const [currentView, setCurrentView] = useState('home'); // 'home', 'csv', 'xero', 'coupa', 'data', 'reconciliation'
  const [importedData, setImportedData] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);
  
  // Coupa-specific state
  const [coupaData, setCoupaData] = useState(null);
  const [showCoupaPreview, setShowCoupaPreview] = useState(false);
  
  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('ledgerlink-imported-data');
    const savedHistory = localStorage.getItem('ledgerlink-data-history');
    
    if (savedData) {
      try {
        setImportedData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
    
    if (savedHistory) {
      try {
        setDataHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading saved history:', error);
      }
    }
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ledgerlink-imported-data', JSON.stringify(importedData));
  }, [importedData]);
  
  useEffect(() => {
    localStorage.setItem('ledgerlink-data-history', JSON.stringify(dataHistory));
  }, [dataHistory]);
  
  // Add imported data from any source
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
    const historyEntry = {
      id: Date.now(),
      source: sourceName,
      detail: sourceDetail,
      recordCount: data.length,
      timestamp: new Date().toISOString()
    };
    
    setDataHistory(prev => [...prev, historyEntry]);
    
    // Show success message
    alert(`Successfully imported ${data.length} records from ${sourceName}!`);
  };
  
  // Handle CSV upload
  const handleCSVUpload = (data, fileName) => {
    const processedData = data.map(item => ({
      ...item,
      source: 'csv-upload',
      fileName: fileName,
      uploadedAt: new Date().toISOString()
    }));
    
    addImportedData(processedData, 'CSV Upload', fileName);
  };
  
  // Handle Xero data fetch
  const handleXeroDataFetch = (data, dataType) => {
    const processedData = data.map(item => ({
      ...item,
      source: 'xero-api',
      dataType: dataType,
      fetchedAt: new Date().toISOString()
    }));
    
    addImportedData(processedData, 'Xero API', dataType);
  };
  
  // Handle Coupa data fetch
  const handleCoupaDataFetched = (data, dataType) => {
    setCoupaData({ data, dataType });
    setShowCoupaPreview(true);
  };
  
  // Handle Coupa data acceptance
  const handleCoupaDataAccepted = (selectedData, dataType) => {
    const processedData = selectedData.map(item => ({
      ...item,
      source: 'coupa-api',
      dataType: dataType,
      importedAt: new Date().toISOString()
    }));
    
    addImportedData(processedData, 'Coupa API', dataType);
    setShowCoupaPreview(false);
    setCoupaData(null);
    setCurrentView('data');
  };
  
  // Handle Coupa data rejection
  const handleCoupaDataRejected = () => {
    setShowCoupaPreview(false);
    setCoupaData(null);
  };
  
  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all imported data? This cannot be undone.')) {
      setImportedData([]);
      setDataHistory([]);
      localStorage.removeItem('ledgerlink-imported-data');
      localStorage.removeItem('ledgerlink-data-history');
    }
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
  
  // Render navigation
  const renderNavigation = () => (
    <nav className="main-navigation">
      <div className="nav-brand">
        <h1>📊 LedgerLink</h1>
        <span className="nav-subtitle">Account Reconciliation System</span>
      </div>
      
      <div className="nav-menu">
        <button 
          className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          🏠 Home
        </button>
        
        <div className="nav-divider"></div>
        
        <button 
          className={`nav-item ${currentView === 'csv' ? 'active' : ''}`}
          onClick={() => setCurrentView('csv')}
        >
          📄 CSV Upload
        </button>
        
        <button 
          className={`nav-item ${currentView === 'xero' ? 'active' : ''}`}
          onClick={() => setCurrentView('xero')}
        >
          🔗 Xero
        </button>
        
        <button 
          className={`nav-item ${currentView === 'coupa' ? 'active' : ''}`}
          onClick={() => setCurrentView('coupa')}
        >
          🏢 Coupa
        </button>
        
        {stats.totalRecords > 0 && (
          <>
            <div className="nav-divider"></div>
            
            <button 
              className={`nav-item ${currentView === 'data' ? 'active' : ''}`}
              onClick={() => setCurrentView('data')}
            >
              📁 Data ({stats.totalRecords})
            </button>
            
            <button 
              className={`nav-item ${currentView === 'reconciliation' ? 'active' : ''}`}
              onClick={() => setCurrentView('reconciliation')}
            >
              🔄 Reconciliation
            </button>
          </>
        )}
      </div>
      
      {stats.totalRecords > 0 && (
        <div className="nav-actions">
          <button 
            className="btn btn-sm btn-secondary"
            onClick={clearAllData}
          >
            🗑️ Clear All
          </button>
        </div>
      )}
    </nav>
  );
  
  // Render home page
  const renderHomePage = () => (
    <div className="home-page">
      <div className="home-header">
        <h2>Welcome to LedgerLink</h2>
        <p>Choose your data source to get started with account reconciliation</p>
      </div>
      
      {/* Statistics Overview */}
      {stats.totalRecords > 0 && (
        <div className="stats-overview">
          <h3>📈 Current Data Summary</h3>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-number">{stats.totalRecords}</div>
                <div className="stat-label">Total Records</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <div className="stat-number">{stats.csvRecords}</div>
                <div className="stat-label">CSV Records</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔗</div>
              <div className="stat-content">
                <div className="stat-number">{stats.xeroRecords}</div>
                <div className="stat-label">Xero Records</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-number">{stats.coupaRecords}</div>
                <div className="stat-label">Coupa Records</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Source Options */}
      <div className="data-sources">
        <h3>📈 Choose Your Data Source</h3>
        <div className="source-grid">
          
          {/* CSV Upload */}
          <div className="source-option" onClick={() => setCurrentView('csv')}>
            <div className="source-header">
              <div className="source-icon csv">📄</div>
              <h4>Upload CSV Files</h4>
            </div>
            <p>Upload your ledger data from CSV files</p>
            <ul>
              <li>Accounts Receivable (AR) data</li>
              <li>Accounts Payable (AP) data</li>
              <li>Custom transaction formats</li>
            </ul>
            {stats.csvRecords > 0 && (
              <div className="source-status">
                ✓ {stats.csvRecords} records imported
              </div>
            )}
          </div>
          
          {/* Xero Integration */}
          <div className="source-option" onClick={() => setCurrentView('xero')}>
            <div className="source-header">
              <div className="source-icon xero">🔗</div>
              <h4>Connect to Xero</h4>
            </div>
            <p>Direct API integration with Xero accounting</p>
            <ul>
              <li>Invoices and credit notes</li>
              <li>Bills and purchase orders</li>
              <li>Real-time data synchronization</li>
            </ul>
            {stats.xeroRecords > 0 && (
              <div className="source-status">
                ✓ {stats.xeroRecords} records imported
              </div>
            )}
          </div>
          
          {/* Coupa Integration */}
          <div className="source-option" onClick={() => setCurrentView('coupa')}>
            <div className="source-header">
              <div className="source-icon coupa">🏢</div>
              <h4>Connect to Coupa</h4>
            </div>
            <p>Direct API integration with Coupa procurement</p>
            <ul>
              <li>Invoice approvals and workflows</li>
              <li>Supplier and vendor data</li>
              <li>Purchase order matching</li>
            </ul>
            {stats.coupaRecords > 0 && (
              <div className="source-status">
                ✓ {stats.coupaRecords} records imported
              </div>
            )}
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
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentView('reconciliation')}
            >
              🔄 Start Reconciliation
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentView('data')}
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
            {dataHistory.slice(-5).reverse().map(item => (
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
  );
  
  // Render page content based on current view
  const renderPageContent = () => {
    switch (currentView) {
      case 'home':
        return renderHomePage();
        
      case 'csv':
        return (
          <div className="page-content">
            <CSVUpload onDataProcessed={handleCSVUpload} />
          </div>
        );
        
      case 'xero':
        return (
          <div className="page-content">
            <XeroIntegration onDataFetched={handleXeroDataFetch} />
          </div>
        );
        
      case 'coupa':
        return (
          <div className="page-content">
            {!showCoupaPreview ? (
              <CoupaConnection onDataFetched={handleCoupaDataFetched} />
            ) : (
              <CoupaDataPreview
                data={coupaData.data}
                dataType={coupaData.dataType}
                onDataAccept={handleCoupaDataAccepted}
                onDataReject={handleCoupaDataRejected}
              />
            )}
          </div>
        );
        
      case 'data':
        return (
          <div className="page-content">
            <DataPreview importedData={importedData} />
          </div>
        );
        
      case 'reconciliation':
        return (
          <div className="page-content">
            <ReconciliationDashboard importedData={importedData} />
          </div>
        );
        
      default:
        return renderHomePage();
    }
  };
  
  return (
    <div className="ledgerlink-dashboard">
      {renderNavigation()}
      <main className="main-content">
        {renderPageContent()}
      </main>
    </div>
  );
};

export default LedgerLinkDashboard;