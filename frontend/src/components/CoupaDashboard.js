import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import './CoupaDashboard.css';

const CoupaDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [coupaData, setCoupaData] = useState([]);
  const [netsuiteData, setNetsuiteData] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [unmatchedCoupa, setUnmatchedCoupa] = useState([]);
  const [unmatchedNetsuite, setUnmatchedNetsuite] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [reviewSubTab, setReviewSubTab] = useState('matched');

  // File upload handlers
  const handleCoupaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading Coupa data...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/coupa/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCoupaData(response.data.data);
      setUploadStatus(`Coupa data uploaded successfully. ${response.data.data.length} records processed.`);
    } catch (error) {
      setUploadStatus('Error uploading Coupa data: ' + error.message);
    }
    setIsUploading(false);
  };

  const handleNetsuiteUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading NetSuite data...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/netsuite/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNetsuiteData(response.data.data);
      setUploadStatus(`NetSuite data uploaded successfully. ${response.data.data.length} records processed.`);
    } catch (error) {
      setUploadStatus('Error uploading NetSuite data: ' + error.message);
    }
    setIsUploading(false);
  };

  // Matching function
  const handleMatching = async () => {
    if (coupaData.length === 0 || netsuiteData.length === 0) {
      setUploadStatus('Please upload both Coupa and NetSuite data before matching.');
      return;
    }

    setMatchingInProgress(true);
    setUploadStatus('Matching records...');

    try {
      const response = await axios.post('/api/match', {
        coupaData,
        netsuiteData
      });

      setMatchedData(response.data.matched);
      setUnmatchedCoupa(response.data.unmatchedCoupa);
      setUnmatchedNetsuite(response.data.unmatchedNetsuite);
      setUploadStatus(`Matching completed. ${response.data.matched.length} matches found.`);
      setActiveTab('review');
    } catch (error) {
      setUploadStatus('Error during matching: ' + error.message);
    }
    setMatchingInProgress(false);
  };

  // Export functions
  const exportToCSV = async () => {
    try {
      const response = await axios.post('/api/export/csv', {
        matched: matchedData,
        unmatchedCoupa,
        unmatchedNetsuite
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coupa-netsuite-reconciliation-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setUploadStatus('Error exporting to CSV: ' + error.message);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await axios.post('/api/export/excel', {
        matched: matchedData,
        unmatchedCoupa,
        unmatchedNetsuite
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coupa-netsuite-reconciliation-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setUploadStatus('Error exporting to Excel: ' + error.message);
    }
  };

  // Calculate statistics for charts
  const getMatchStats = () => {
    const totalRecords = coupaData.length;
    const matchedCount = matchedData.length;
    const unmatchedCount = unmatchedCoupa.length;
    const matchRate = totalRecords > 0 ? (matchedCount / totalRecords) * 100 : 0;
    
    const perfectMatches = matchedData.filter(m => Math.abs(m.difference || 0) < 0.01).length;
    const varianceMatches = matchedData.filter(m => Math.abs(m.difference || 0) >= 0.01).length;
    
    return {
      totalRecords,
      matchedCount,
      unmatchedCount,
      matchRate,
      perfectMatches,
      varianceMatches
    };
  };

  // Upload Tab Content
  const renderUploadTab = () => (
    <div className="upload-section">
      <div className="upload-instructions">
        <h3>Upload Your Files</h3>
        <p>Upload your Coupa invoice approvals and NetSuite AR ledger data to begin the reconciliation process.</p>
        <div className="file-requirements">
          <div className="requirement">
            <strong>Coupa File Requirements:</strong> CSV/Excel with columns: Invoice Number, Amount, Date, Vendor, Status
          </div>
          <div className="requirement">
            <strong>NetSuite File Requirements:</strong> CSV/Excel with columns: Invoice Number, Amount, Date, Vendor, AR Status
          </div>
        </div>
      </div>
      
      <div className="upload-containers">
        <div className="upload-container">
          <h4><FileText size={20} /> Coupa Invoice Approvals</h4>
          <div className="file-upload">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleCoupaUpload}
              disabled={isUploading}
              id="coupa-upload"
            />
            <label htmlFor="coupa-upload" className={`upload-label ${isUploading ? 'disabled' : ''}`}>
              Choose Coupa File
            </label>
          </div>
          {coupaData.length > 0 && (
            <div className="upload-success">
              <CheckCircle size={16} /> {coupaData.length} Coupa records loaded
            </div>
          )}
        </div>

        <div className="upload-container">
          <h4><BarChart3 size={20} /> NetSuite AR Ledger</h4>
          <div className="file-upload">
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleNetsuiteUpload}
              disabled={isUploading}
              id="netsuite-upload"
            />
            <label htmlFor="netsuite-upload" className={`upload-label ${isUploading ? 'disabled' : ''}`}>
              Choose NetSuite File
            </label>
          </div>
          {netsuiteData.length > 0 && (
            <div className="upload-success">
              <CheckCircle size={16} /> {netsuiteData.length} NetSuite records loaded
            </div>
          )}
        </div>
      </div>

      {uploadStatus && (
        <div className={`status-message ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
          {uploadStatus.includes('Error') ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {uploadStatus}
        </div>
      )}

      <div className="match-section">
        <button 
          className="match-button" 
          onClick={handleMatching}
          disabled={coupaData.length === 0 || netsuiteData.length === 0 || matchingInProgress}
        >
          {matchingInProgress ? 'Matching in Progress...' : 'Start Intelligent Matching'}
        </button>
        <p className="match-description">
          Our AI-powered matching algorithm compares invoice numbers, amounts, dates, and vendor information to find the best matches.
        </p>
      </div>
    </div>
  );

  // Review Tab Content
  const renderReviewTab = () => {
    const stats = getMatchStats();
    
    return (
      <div className="review-section">
        <div className="review-header">
          <h3>Review Matching Results</h3>
          <div className="summary-stats">
            <div className="stat-card matched">
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-number">{matchedData.length}</div>
              <div className="stat-label">Matched Records</div>
            </div>
            <div className="stat-card unmatched-coupa">
              <div className="stat-icon"><AlertCircle size={24} /></div>
              <div className="stat-number">{unmatchedCoupa.length}</div>
              <div className="stat-label">Unmatched Coupa</div>
            </div>
            <div className="stat-card unmatched-netsuite">
              <div className="stat-icon"><AlertCircle size={24} /></div>
              <div className="stat-number">{unmatchedNetsuite.length}</div>
              <div className="stat-label">Unmatched NetSuite</div>
            </div>
            <div className="stat-card match-rate">
              <div className="stat-icon"><TrendingUp size={24} /></div>
              <div className="stat-number">{stats.matchRate.toFixed(1)}%</div>
              <div className="stat-label">Match Rate</div>
            </div>
          </div>
        </div>

        <div className="review-tabs">
          <div className="review-tab-buttons">
            <button 
              className={`review-tab-btn ${reviewSubTab === 'matched' ? 'active' : ''}`}
              onClick={() => setReviewSubTab('matched')}
            >
              Matched Records ({matchedData.length})
            </button>
            <button 
              className={`review-tab-btn ${reviewSubTab === 'unmatched-coupa' ? 'active' : ''}`}
              onClick={() => setReviewSubTab('unmatched-coupa')}
            >
              Unmatched Coupa ({unmatchedCoupa.length})
            </button>
            <button 
              className={`review-tab-btn ${reviewSubTab === 'unmatched-netsuite' ? 'active' : ''}`}
              onClick={() => setReviewSubTab('unmatched-netsuite')}
            >
              Unmatched NetSuite ({unmatchedNetsuite.length})
            </button>
          </div>

          <div className="review-content">
            {reviewSubTab === 'matched' && (
              <div className="matched-records">
                <div className="section-header">
                  <h4>Matched Records Analysis</h4>
                  <div className="match-summary">
                    <span className="perfect-matches">{stats.perfectMatches} Perfect Matches</span>
                    <span className="variance-matches">{stats.varianceMatches} Amount Variances</span>
                  </div>
                </div>
                {matchedData.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice Number</th>
                          <th>Coupa Amount</th>
                          <th>NetSuite Amount</th>
                          <th>Difference</th>
                          <th>Match Confidence</th>
                          <th>Vendor</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedData.map((match, index) => (
                          <tr key={index} className={Math.abs(match.difference || 0) >= 0.01 ? 'amount-difference' : ''}>
                            <td>{match.invoiceNumber}</td>
                            <td>${match.coupaAmount?.toFixed(2)}</td>
                            <td>${match.netsuiteAmount?.toFixed(2)}</td>
                            <td className={Math.abs(match.difference || 0) >= 0.01 ? 'difference' : 'no-difference'}>
                              ${Math.abs(match.difference || 0).toFixed(2)}
                            </td>
                            <td>
                              <span className={`confidence ${match.confidence >= 0.9 ? 'high' : match.confidence >= 0.7 ? 'medium' : 'low'}`}>
                                {(match.confidence * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td>{match.vendor || 'N/A'}</td>
                            <td>
                              <span className={`status ${Math.abs(match.difference || 0) < 0.01 ? 'perfect' : 'variance'}`}>
                                {Math.abs(match.difference || 0) < 0.01 ? 'Perfect Match' : 'Amount Variance'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data">No matched records found.</div>
                )}
              </div>
            )}

            {reviewSubTab === 'unmatched-coupa' && (
              <div className="unmatched-records">
                <div className="section-header">
                  <h4>Unmatched Coupa Records</h4>
                  <p>These invoice approvals from Coupa could not be matched with NetSuite AR records.</p>
                </div>
                {unmatchedCoupa.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice Number</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Vendor</th>
                          <th>Coupa Status</th>
                          <th>Potential Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unmatchedCoupa.map((record, index) => (
                          <tr key={index}>
                            <td>{record.invoiceNumber}</td>
                            <td>${record.amount?.toFixed(2)}</td>
                            <td>{record.date}</td>
                            <td>{record.vendor}</td>
                            <td>{record.status}</td>
                            <td>
                              <span className="issue-tag">
                                {record.amount > 10000 ? 'High Value' : 'Not in NetSuite'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data success">All Coupa records were successfully matched!</div>
                )}
              </div>
            )}

            {reviewSubTab === 'unmatched-netsuite' && (
              <div className="unmatched-records">
                <div className="section-header">
                  <h4>Unmatched NetSuite Records</h4>
                  <p>These AR ledger entries from NetSuite could not be matched with Coupa approvals.</p>
                </div>
                {unmatchedNetsuite.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice Number</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Vendor</th>
                          <th>AR Status</th>
                          <th>Potential Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unmatchedNetsuite.map((record, index) => (
                          <tr key={index}>
                            <td>{record.invoiceNumber}</td>
                            <td>${record.amount?.toFixed(2)}</td>
                            <td>{record.date}</td>
                            <td>{record.vendor}</td>
                            <td>{record.arStatus}</td>
                            <td>
                              <span className="issue-tag">
                                {record.arStatus === 'Paid' ? 'Already Paid' : 'Missing Approval'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data success">All NetSuite records were successfully matched!</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Results Tab Content with Charts
  const renderResultsTab = () => {
    const stats = getMatchStats();
    const totalVariance = matchedData.reduce((sum, m) => sum + Math.abs(m.difference || 0), 0);
    const avgVariance = stats.varianceMatches > 0 ? totalVariance / stats.varianceMatches : 0;
    
    return (
      <div className="results-section">
        <div className="results-header">
          <h3><BarChart3 size={24} /> Reconciliation Results Dashboard</h3>
          <p>Comprehensive analysis and export options for your Coupa-NetSuite reconciliation</p>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="metrics-dashboard">
          <div className="metric-row">
            <div className="metric-card primary">
              <div className="metric-icon"><BarChart3 size={32} /></div>
              <div className="metric-content">
                <div className="metric-value">{stats.totalRecords}</div>
                <div className="metric-label">Total Records Processed</div>
              </div>
            </div>
            <div className="metric-card success">
              <div className="metric-icon"><CheckCircle size={32} /></div>
              <div className="metric-content">
                <div className="metric-value">{stats.perfectMatches}</div>
                <div className="metric-label">Perfect Matches</div>
              </div>
            </div>
            <div className="metric-card warning">
              <div className="metric-icon"><AlertCircle size={32} /></div>
              <div className="metric-content">
                <div className="metric-value">{stats.varianceMatches}</div>
                <div className="metric-label">Amount Variances</div>
              </div>
            </div>
            <div className="metric-card info">
              <div className="metric-icon"><TrendingUp size={32} /></div>
              <div className="metric-content">
                <div className="metric-value">{stats.matchRate.toFixed(1)}%</div>
                <div className="metric-label">Overall Match Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h4>Match Distribution</h4>
            <div className="pie-chart-simple">
              <div className="chart-legend">
                <div className="legend-item matched">
                  <span className="legend-color"></span>
                  <span>Matched ({stats.matchedCount})</span>
                </div>
                <div className="legend-item unmatched">
                  <span className="legend-color"></span>
                  <span>Unmatched ({stats.unmatchedCount})</span>
                </div>
              </div>
              <div className="simple-donut">
                <div className="donut-chart" style={{
                  background: `conic-gradient(
                    #22c55e 0deg ${(stats.matchedCount / stats.totalRecords) * 360}deg,
                    #ef4444 ${(stats.matchedCount / stats.totalRecords) * 360}deg 360deg
                  )`
                }}>
                  <div className="donut-center">
                    <div className="center-value">{stats.matchRate.toFixed(0)}%</div>
                    <div className="center-label">Matched</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h4>Quality Breakdown</h4>
            <div className="bar-chart-simple">
              <div className="bar-item">
                <div className="bar-label">Perfect Matches</div>
                <div className="bar-container">
                  <div className="bar bar-success" style={{width: `${(stats.perfectMatches / stats.totalRecords) * 100}%`}}></div>
                </div>
                <div className="bar-value">{stats.perfectMatches}</div>
              </div>
              <div className="bar-item">
                <div className="bar-label">Amount Variances</div>
                <div className="bar-container">
                  <div className="bar bar-warning" style={{width: `${(stats.varianceMatches / stats.totalRecords) * 100}%`}}></div>
                </div>
                <div className="bar-value">{stats.varianceMatches}</div>
              </div>
              <div className="bar-item">
                <div className="bar-label">Unmatched</div>
                <div className="bar-container">
                  <div className="bar bar-error" style={{width: `${(stats.unmatchedCount / stats.totalRecords) * 100}%`}}></div>
                </div>
                <div className="bar-value">{stats.unmatchedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Variance Analysis */}
        <div className="variance-analysis">
          <h4>Amount Variance Analysis</h4>
          {stats.varianceMatches > 0 ? (
            <div className="variance-grid">
              <div className="variance-card">
                <div className="variance-label">Total Variance Amount</div>
                <div className="variance-value">${totalVariance.toFixed(2)}</div>
              </div>
              <div className="variance-card">
                <div className="variance-label">Average Variance</div>
                <div className="variance-value">${avgVariance.toFixed(2)}</div>
              </div>
              <div className="variance-card">
                <div className="variance-label">Variance Rate</div>
                <div className="variance-value">{((stats.varianceMatches / stats.totalRecords) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ) : (
            <div className="no-variances">
              <CheckCircle size={48} className="success-icon" />
              <h5>Perfect Reconciliation!</h5>
              <p>No amount variances detected - all matched records have perfect amount alignment.</p>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="export-section">
          <h4><Download size={20} /> Export & Download Options</h4>
          <div className="export-grid">
            <div className="export-option">
              <button className="export-btn csv" onClick={exportToCSV}>
                <FileText size={20} />
                <span>Download CSV</span>
              </button>
              <p>Complete data export in CSV format</p>
            </div>
            <div className="export-option">
              <button className="export-btn excel" onClick={exportToExcel}>
                <BarChart3 size={20} />
                <span>Download Excel</span>
              </button>
              <p>Formatted Excel workbook with multiple sheets</p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="action-items">
          <h4>Recommended Next Steps</h4>
          <div className="steps-grid">
            <div className="step-card high-priority">
              <div className="step-priority">High Priority</div>
              <div className="step-title">Review Amount Variances</div>
              <div className="step-description">Investigate {stats.varianceMatches} records with amount differences</div>
            </div>
            <div className="step-card medium-priority">
              <div className="step-priority">Medium Priority</div>
              <div className="step-title">Research Unmatched Records</div>
              <div className="step-description">Analyze {stats.unmatchedCount} unmatched items for data quality issues</div>
            </div>
            <div className="step-card low-priority">
              <div className="step-priority">Low Priority</div>
              <div className="step-title">Document Results</div>
              <div className="step-description">Export and archive reconciliation results for audit trail</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="coupa-dashboard">
      <div className="dashboard-header">
        <h1>🔗 Coupa-NetSuite Reconciliation</h1>
        <p>Automated matching and reconciliation between Coupa invoice approvals and NetSuite AR ledger data</p>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <FileText size={16} /> Upload Data
        </button>
        <button 
          className={`nav-tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
          disabled={matchedData.length === 0}
        >
          <BarChart3 size={16} /> Review Data
        </button>
        <button 
          className={`nav-tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={matchedData.length === 0}
        >
          <TrendingUp size={16} /> Results & Export
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'review' && renderReviewTab()}
        {activeTab === 'results' && renderResultsTab()}
      </div>
    </div>
  );
};

export default CoupaDashboard;