/**
 * Reconciliation Dashboard Component
 * 
 * Main reconciliation interface for LedgerLink
 */

import React, { useState, useEffect } from 'react';
import './ReconciliationDashboard.css';

const ReconciliationDashboard = ({ importedData }) => {
  const [reconciliationState, setReconciliationState] = useState({
    isProcessing: false,
    matches: [],
    discrepancies: [],
    summary: null
  });
  
  const [filterOptions, setFilterOptions] = useState({
    showMatches: true,
    showDiscrepancies: true,
    sourceFilter: 'all',
    amountThreshold: 0.01
  });
  
  // Combine all imported data into a single list
  const allRecords = importedData.reduce((acc, dataSet) => {
    const recordsWithSource = dataSet.data.map(record => ({
      ...record,
      sourceInfo: {
        source: dataSet.source,
        sourceDetail: dataSet.sourceDetail,
        importedAt: dataSet.importedAt
      }
    }));
    return [...acc, ...recordsWithSource];
  }, []);
  
  // Process reconciliation when data changes
  useEffect(() => {
    if (allRecords.length > 0) {
      processReconciliation();
    }
  }, [importedData]);
  
  // Simple reconciliation logic
  const processReconciliation = () => {
    setReconciliationState(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      const matches = [];
      const discrepancies = [];
      const processed = new Set();
      
      // Find matches and discrepancies
      for (let i = 0; i < allRecords.length; i++) {
        if (processed.has(i)) continue;
        
        const record1 = allRecords[i];
        let foundMatch = false;
        
        for (let j = i + 1; j < allRecords.length; j++) {
          if (processed.has(j)) continue;
          
          const record2 = allRecords[j];
          
          // Simple matching logic - you would implement more sophisticated logic here
          if (isMatch(record1, record2)) {
            matches.push({
              id: `match-${matches.length}`,
              record1,
              record2,
              matchType: 'exact',
              confidence: 100
            });
            
            processed.add(i);
            processed.add(j);
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch && !processed.has(i)) {
          discrepancies.push({
            id: `disc-${discrepancies.length}`,
            record: record1,
            type: 'unmatched',
            reason: 'No matching record found'
          });
          processed.add(i);
        }
      }
      
      const summary = {
        totalRecords: allRecords.length,
        matchedRecords: matches.length * 2,
        unmatchedRecords: discrepancies.length,
        matchRate: allRecords.length > 0 ? ((matches.length * 2) / allRecords.length * 100).toFixed(1) : 0
      };
      
      setReconciliationState({
        isProcessing: false,
        matches,
        discrepancies,
        summary
      });
    }, 2000);
  };
  
  // Simple matching logic - customize based on your needs
  const isMatch = (record1, record2) => {
    // Don't match records from the same source
    if (record1.sourceInfo?.source === record2.sourceInfo?.source) {
      return false;
    }
    
    // Match by invoice number
    if (record1.invoiceNumber && record2.invoiceNumber && 
        record1.invoiceNumber === record2.invoiceNumber) {
      return true;
    }
    
    // Match by amount (within threshold)
    if (record1.amount && record2.amount) {
      const amountDiff = Math.abs(record1.amount - record2.amount);
      if (amountDiff <= filterOptions.amountThreshold) {
        return true;
      }
    }
    
    return false;
  };
  
  // Filter data based on current filters
  const getFilteredData = () => {
    let data = [];
    
    if (filterOptions.showMatches) {
      data = [...data, ...reconciliationState.matches];
    }
    
    if (filterOptions.showDiscrepancies) {
      data = [...data, ...reconciliationState.discrepancies];
    }
    
    if (filterOptions.sourceFilter !== 'all') {
      data = data.filter(item => {
        if (item.record1) {
          return item.record1.sourceInfo?.source === filterOptions.sourceFilter ||
                 item.record2.sourceInfo?.source === filterOptions.sourceFilter;
        }
        return item.record.sourceInfo?.source === filterOptions.sourceFilter;
      });
    }
    
    return data;
  };
  
  const filteredData = getFilteredData();
  
  if (allRecords.length === 0) {
    return (
      <div className="reconciliation-dashboard empty-state">
        <div className="empty-content">
          <h3>🔄 No Data to Reconcile</h3>
          <p>Import data from CSV, Xero, or Coupa to start reconciliation.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="reconciliation-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h3>🔄 Reconciliation Dashboard</h3>
        <p>Automatically match and reconcile your imported ledger data</p>
      </div>
      
      {/* Summary Cards */}
      {reconciliationState.summary && (
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="card-icon">📁</div>
            <div className="card-content">
              <div className="card-number">{reconciliationState.summary.totalRecords}</div>
              <div className="card-label">Total Records</div>
            </div>
          </div>
          
          <div className="summary-card matches">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <div className="card-number">{reconciliationState.summary.matchedRecords}</div>
              <div className="card-label">Matched Records</div>
            </div>
          </div>
          
          <div className="summary-card discrepancies">
            <div className="card-icon">⚠️</div>
            <div className="card-content">
              <div className="card-number">{reconciliationState.summary.unmatchedRecords}</div>
              <div className="card-label">Discrepancies</div>
            </div>
          </div>
          
          <div className="summary-card rate">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <div className="card-number">{reconciliationState.summary.matchRate}%</div>
              <div className="card-label">Match Rate</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Processing Status */}
      {reconciliationState.isProcessing && (
        <div className="processing-status">
          <div className="processing-spinner"></div>
          <h4>Processing Reconciliation...</h4>
          <p>Analyzing {allRecords.length} records for matches and discrepancies</p>
        </div>
      )}
      
      {/* Filters */}
      {!reconciliationState.isProcessing && reconciliationState.summary && (
        <div className="reconciliation-filters">
          <h4>🔍 Filters</h4>
          <div className="filter-controls">
            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filterOptions.showMatches}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, showMatches: e.target.checked }))}
                />
                Show Matches ({reconciliationState.matches.length})
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={filterOptions.showDiscrepancies}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, showDiscrepancies: e.target.checked }))}
                />
                Show Discrepancies ({reconciliationState.discrepancies.length})
              </label>
            </div>
            
            <div className="filter-group">
              <label>Source Filter:</label>
              <select
                value={filterOptions.sourceFilter}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, sourceFilter: e.target.value }))}
              >
                <option value="all">All Sources</option>
                <option value="CSV Upload">CSV Upload</option>
                <option value="Xero API">Xero API</option>
                <option value="Coupa API">Coupa API</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      {!reconciliationState.isProcessing && filteredData.length > 0 && (
        <div className="reconciliation-results">
          <h4>📄 Reconciliation Results</h4>
          <div className="results-list">
            {filteredData.map(item => (
              <div key={item.id} className={`result-item ${item.record1 ? 'match' : 'discrepancy'}`}>
                {item.record1 ? (
                  // Match
                  <div className="match-item">
                    <div className="match-header">
                      <span className="match-icon">✅</span>
                      <h5>Match Found</h5>
                      <span className="confidence">Confidence: {item.confidence}%</span>
                    </div>
                    
                    <div className="match-content">
                      <div className="record-card">
                        <div className="record-header">
                          <span className="source-badge">{item.record1.sourceInfo?.source}</span>
                          <span className="record-id">{item.record1.invoiceNumber || 'No Invoice #'}</span>
                        </div>
                        <div className="record-details">
                          <div><strong>Amount:</strong> ${item.record1.amount?.toFixed(2) || 'N/A'}</div>
                          <div><strong>Vendor:</strong> {item.record1.vendor || item.record1.contact || 'N/A'}</div>
                          <div><strong>Date:</strong> {item.record1.date || item.record1.issueDate || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="match-arrow">↔️</div>
                      
                      <div className="record-card">
                        <div className="record-header">
                          <span className="source-badge">{item.record2.sourceInfo?.source}</span>
                          <span className="record-id">{item.record2.invoiceNumber || 'No Invoice #'}</span>
                        </div>
                        <div className="record-details">
                          <div><strong>Amount:</strong> ${item.record2.amount?.toFixed(2) || 'N/A'}</div>
                          <div><strong>Vendor:</strong> {item.record2.vendor || item.record2.contact || 'N/A'}</div>
                          <div><strong>Date:</strong> {item.record2.date || item.record2.issueDate || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Discrepancy
                  <div className="discrepancy-item">
                    <div className="discrepancy-header">
                      <span className="discrepancy-icon">⚠️</span>
                      <h5>Unmatched Record</h5>
                      <span className="reason">{item.reason}</span>
                    </div>
                    
                    <div className="record-card">
                      <div className="record-header">
                        <span className="source-badge">{item.record.sourceInfo?.source}</span>
                        <span className="record-id">{item.record.invoiceNumber || 'No Invoice #'}</span>
                      </div>
                      <div className="record-details">
                        <div><strong>Amount:</strong> ${item.record.amount?.toFixed(2) || 'N/A'}</div>
                        <div><strong>Vendor:</strong> {item.record.vendor || item.record.contact || 'N/A'}</div>
                        <div><strong>Date:</strong> {item.record.date || item.record.issueDate || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      {!reconciliationState.isProcessing && reconciliationState.summary && (
        <div className="reconciliation-actions">
          <h4>🚀 Actions</h4>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={processReconciliation}>
              🔄 Re-run Reconciliation
            </button>
            <button className="btn btn-secondary">
              📄 Export Results
            </button>
            <button className="btn btn-success">
              ✅ Approve Matches
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationDashboard;