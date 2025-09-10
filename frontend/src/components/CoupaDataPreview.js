/**
 * Coupa Data Preview Component
 * 
 * This component displays the data fetched from Coupa in a user-friendly format.
 * Users can preview the data before processing it in LedgerLink.
 */

import React, { useState } from 'react';
import './CoupaDataPreview.css';

const CoupaDataPreview = ({ data, dataType, onDataAccept, onDataReject }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortField, setSortField] = useState('invoiceNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterText, setFilterText] = useState('');

  // If no data, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="coupa-data-preview empty-state">
        <div className="empty-content">
          <h3>📊 No Data Available</h3>
          <p>Connect to Coupa and fetch data to see a preview here.</p>
        </div>
      </div>
    );
  }

  // Filter data based on search text
  const filteredData = data.filter(item => {
    const searchText = filterText.toLowerCase();
    return (
      (item.invoiceNumber || '').toLowerCase().includes(searchText) ||
      (item.vendor || '').toLowerCase().includes(searchText) ||
      (item.amount || '').toString().includes(searchText) ||
      (item.status || '').toLowerCase().includes(searchText)
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = aValue.toString().toLowerCase();
    const bStr = bValue.toString().toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Handle item selection
  const toggleItemSelection = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  // Select all items
  const selectAll = () => {
    if (selectedItems.size === sortedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(Array.from({ length: sortedData.length }, (_, i) => i)));
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Accept selected data
  const acceptData = () => {
    const selectedData = sortedData.filter((_, index) => selectedItems.has(index));
    if (onDataAccept) {
      onDataAccept(selectedData, dataType);
    }
  };

  // Reject data
  const rejectData = () => {
    if (onDataReject) {
      onDataReject();
    }
  };

  // Get data type display name
  const getDataTypeDisplayName = () => {
    switch (dataType) {
      case 'invoices': return 'Invoices';
      case 'approvals': return 'Invoice Approvals';
      case 'suppliers': return 'Suppliers';
      case 'all': return 'All Data';
      default: return 'Data';
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (typeof amount !== 'number') return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-badge approved';
      case 'pending': return 'status-badge pending';
      case 'rejected': return 'status-badge rejected';
      case 'paid': return 'status-badge paid';
      case 'cancelled': return 'status-badge cancelled';
      default: return 'status-badge default';
    }
  };

  // Render table view
  const renderTableView = () => {
    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedItems.size === sortedData.length && sortedData.length > 0}
                  onChange={selectAll}
                  className="select-checkbox"
                />
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('invoiceNumber')}
              >
                Invoice # 
                {sortField === 'invoiceNumber' && (
                  <span className={`sort-arrow ${sortDirection}`}>↕</span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('vendor')}
              >
                Vendor
                {sortField === 'vendor' && (
                  <span className={`sort-arrow ${sortDirection}`}>↕</span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('amount')}
              >
                Amount
                {sortField === 'amount' && (
                  <span className={`sort-arrow ${sortDirection}`}>↕</span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('issueDate')}
              >
                Issue Date
                {sortField === 'issueDate' && (
                  <span className={`sort-arrow ${sortDirection}`}>↕</span>
                )}
              </th>
              <th 
                className="sortable-header" 
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  <span className={`sort-arrow ${sortDirection}`}>↕</span>
                )}
              </th>
              {dataType === 'approvals' && (
                <th>
                  Approver
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr 
                key={index} 
                className={selectedItems.has(index) ? 'selected-row' : ''}
                onClick={() => toggleItemSelection(index)}
              >
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={() => toggleItemSelection(index)}
                    className="select-checkbox"
                  />
                </td>
                <td className="invoice-number">
                  {item.invoiceNumber || 'N/A'}
                </td>
                <td className="vendor-name">
                  {item.vendor || item.name || 'N/A'}
                </td>
                <td className="amount">
                  {item.amount ? formatCurrency(item.amount, item.currency) : 'N/A'}
                </td>
                <td className="issue-date">
                  {formatDate(item.issueDate || item.createdAt)}
                </td>
                <td className="status">
                  <span className={getStatusBadgeClass(item.status)}>
                    {item.status || 'Unknown'}
                  </span>
                </td>
                {dataType === 'approvals' && (
                  <td className="approver">
                    {item.approver || 'N/A'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render card view
  const renderCardView = () => {
    return (
      <div className="cards-container">
        {sortedData.map((item, index) => (
          <div 
            key={index} 
            className={`data-card ${selectedItems.has(index) ? 'selected' : ''}`}
            onClick={() => toggleItemSelection(index)}
          >
            <div className="card-header">
              <input
                type="checkbox"
                checked={selectedItems.has(index)}
                onChange={() => toggleItemSelection(index)}
                className="card-checkbox"
              />
              <div className="card-title">
                {item.invoiceNumber || item.name || 'N/A'}
              </div>
              <span className={getStatusBadgeClass(item.status)}>
                {item.status || 'Unknown'}
              </span>
            </div>
            
            <div className="card-content">
              <div className="card-field">
                <label>Vendor:</label>
                <span>{item.vendor || item.name || 'N/A'}</span>
              </div>
              
              {item.amount && (
                <div className="card-field">
                  <label>Amount:</label>
                  <span className="amount-value">
                    {formatCurrency(item.amount, item.currency)}
                  </span>
                </div>
              )}
              
              <div className="card-field">
                <label>Date:</label>
                <span>{formatDate(item.issueDate || item.createdAt)}</span>
              </div>
              
              {dataType === 'approvals' && item.approver && (
                <div className="card-field">
                  <label>Approver:</label>
                  <span>{item.approver}</span>
                </div>
              )}
              
              {item.reference && (
                <div className="card-field">
                  <label>Reference:</label>
                  <span>{item.reference}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="coupa-data-preview">
      {/* Header */}
      <div className="preview-header">
        <div className="header-left">
          <h3>📊 {getDataTypeDisplayName()} Preview</h3>
          <p>
            Showing {filteredData.length} of {data.length} records
            {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
          </p>
        </div>
        
        <div className="header-controls">
          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search invoices, vendors, amounts..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              📋
            </button>
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card View"
            >
              🗂️
            </button>
          </div>
        </div>
      </div>

      {/* Data Display */}
      <div className="preview-content">
        {viewMode === 'table' ? renderTableView() : renderCardView()}
      </div>

      {/* Footer Actions */}
      <div className="preview-footer">
        <div className="footer-info">
          <p>
            <strong>Selected:</strong> {selectedItems.size} of {sortedData.length} items
          </p>
          {selectedItems.size > 0 && (
            <p className="selection-info">
              These items will be imported into LedgerLink for reconciliation.
            </p>
          )}
        </div>
        
        <div className="footer-actions">
          <button
            onClick={rejectData}
            className="btn btn-secondary"
          >
            ❌ Cancel
          </button>
          
          <button
            onClick={acceptData}
            disabled={selectedItems.size === 0}
            className="btn btn-primary"
          >
            ✅ Import Selected Data ({selectedItems.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoupaDataPreview;