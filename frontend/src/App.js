/**
 * Main LedgerLink Application
 * 
 * This is your main application component that brings together
 * all the data source integrations (CSV, Xero, Coupa)
 */

import React from 'react';
import DataSourceDashboard from './components/DataSourceDashboard';
import CSVUpload from './components/CSVUpload';
import XeroIntegration from './components/XeroIntegration';
import CoupaConnection from './components/CoupaConnection';
import CoupaDataPreview from './components/CoupaDataPreview';
import DataPreview from './components/DataPreview';
import ReconciliationDashboard from './components/ReconciliationDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <DataSourceDashboard />
    </div>
  );
}

export default App;