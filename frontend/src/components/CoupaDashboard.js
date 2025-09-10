// frontend/src/components/CoupaDashboard.js
// Main dashboard for Coupa-NetSuite invoice comparison

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Settings, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';

const CoupaDashboard = () => {
  // State management
  const [coupaConfig, setCoupaConfig] = useState({
    apiUrl: '',
    apiKey: '',
    isConnected: false,
    isTesting: false
  });

  const [netsuiteFile, setNetsuiteFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fileInputRef = useRef(null);

  // API Base URL - adjust based on your backend deployment
  const API_BASE = process.env.REACT_APP_API_URL || 'https://ledgerlink.onrender.com/api';

  /**
   * Test connection to Coupa API
   */
  const testCoupaConnection = async () => {
    if (!coupaConfig.apiUrl || !coupaConfig.apiKey) {
      setError('Please enter both API URL and API Key');
      return;
    }

    setCoupaConfig(prev => ({ ...prev, isTesting: true }));
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/coupa/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: coupaConfig.apiUrl,
          apiKey: coupaConfig.apiKey
        })
      });

      const data = await response.json();

      if (data.success) {
        setCoupaConfig(prev => ({ ...prev, isConnected: true }));
        setSuccess('Successfully connected to Coupa API!');
      } else {
        setError(data.error || 'Failed to connect to Coupa API');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setCoupaConfig(prev => ({ ...prev, isTesting: false }));
    }
  };

  /**
   * Handle NetSuite file upload
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/coupa/upload-netsuite`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setNetsuiteFile(data);
        setSuccess(`NetSuite file processed successfully! Found ${data.invoices.length} invoices.`);
        setActiveTab('review');
      } else {
        setError(data.error || 'Failed to process NetSuite file');
      }
    } catch (err) {
      setError('Error uploading file: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Run the invoice comparison
   */
  const runComparison = async () => {
    if (!coupaConfig.isConnected) {
      setError('Please connect to Coupa API first');
      return;
    }

    if (!netsuiteFile) {
      setError('Please upload NetSuite file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/coupa/compare-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupaConfig: {
            apiUrl: coupaConfig.apiUrl,
            apiKey: coupaConfig.apiKey,
            filters: {
              // Add any filters here, e.g., date range
              limit: 1000
            }
          },
          netsuiteFile: netsuiteFile
        })
      });

      const data = await response.json();

      if (data.success) {
        setComparisonResults(data);
        setActiveTab('results');
        setSuccess('Invoice comparison completed successfully!');
      } else {
        setError(data.error || 'Comparison failed');
      }
    } catch (err) {
      setError('Error running comparison: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Download results as CSV
   */
  const downloadResults = (category) => {
    if (!comparisonResults) return;

    const data = comparisonResults.categories[category] || [];
    if (data.length === 0) {
      setError('No data to download for this category');
      return;
    }

    // Convert to CSV
    const headers = ['Invoice Number', 'Supplier', 'Amount', 'Coupa Status', 'NetSuite Status', 'Match Type'];
    const rows = data.map(item => {
      if (item.coupaInvoice && item.netsuiteInvoice) {
        // Matched invoice
        return [
          item.coupaInvoice.invoiceNumber || '',
          item.coupaInvoice.supplierName || '',
          item.coupaInvoice.amount || '',
          item.coupaInvoice.status || '',
          item.netsuiteInvoice.status || '',
          item.matchType || ''
        ];
      } else if (item.coupaInvoice) {
        // Coupa only
        return [
          item.coupaInvoice.invoiceNumber || '',
          item.coupaInvoice.supplierName || '',
          item.coupaInvoice.amount || '',
          item.coupaInvoice.status || '',
          'Not in NetSuite',
          'No Match'
        ];
      } else {
        // NetSuite only
        return [
          item.invoiceNumber || '',
          item.supplierName || '',
          item.amount || '',
          'Not in Coupa',
          item.status || '',
          'No Match'
        ];
      }
    });

    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupa_netsuite_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Coupa-NetSuite Invoice Comparison
          </h1>
          <p className="text-gray-600">
            Compare your Coupa invoice approvals against your NetSuite accounts receivable ledger
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'setup', label: 'Setup', icon: Settings },
                { id: 'review', label: 'Review Data', icon: FileText },
                { id: 'results', label: 'Comparison Results', icon: BarChart3 }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content - Setup Tab */}
          <div className="p-6">
            {activeTab === 'setup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Step 1: Configure Coupa API</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coupa API URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://yourcompany.coupahost.com"
                        value={coupaConfig.apiUrl}
                        onChange={(e) => setCoupaConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        placeholder="Your Coupa API Key"
                        value={coupaConfig.apiKey}
                        onChange={(e) => setCoupaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={testCoupaConnection}
                    disabled={coupaConfig.isTesting}
                    className={`mt-4 flex items-center px-4 py-2 rounded-md font-medium ${
                      coupaConfig.isConnected
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {coupaConfig.isTesting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : coupaConfig.isConnected ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Settings className="w-4 h-4 mr-2" />
                    )}
                    {coupaConfig.isTesting ? 'Testing...' : coupaConfig.isConnected ? 'Connected' : 'Test Connection'}
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Step 2: Upload NetSuite AR Ledger</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload your NetSuite Accounts Receivable export (CSV format)
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Choose File'}
                    </button>
                    {netsuiteFile && (
                      <p className="mt-2 text-green-600">
                        ✓ {netsuiteFile.fileName} ({netsuiteFile.invoices.length} invoices)
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Step 3: Run Comparison</h2>
                  <button
                    onClick={runComparison}
                    disabled={!coupaConfig.isConnected || !netsuiteFile || isProcessing}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Running Comparison...' : 'Compare Invoices'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupaDashboard;