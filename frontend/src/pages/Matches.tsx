import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockMatchingResults, mockERPConnections, mockCounterpartyLinks } from '../data/mockData';
import { calculateMatchConfidence, generateMatchInsights, InvoiceRecord } from '../utils/matchConfidence';
import { useToast } from '../hooks/useToast';
import { cn } from '../utils/cn';

export interface MatchesProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

type MatchMode = 'erp-to-counterparty' | 'csv-to-csv' | 'erp-to-csv';

const Matches: React.FC<MatchesProps> = ({ isLoggedIn, onLogin }) => {
  const [matchMode, setMatchMode] = useState<MatchMode>('csv-to-csv');
  const [selectedERP, setSelectedERP] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [csvFile1, setCsvFile1] = useState<File | null>(null);
  const [csvFile2, setCsvFile2] = useState<File | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState(mockMatchingResults);
  const [showResults, setShowResults] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { success, error, info } = useToast();
  
  // Show limited functionality for non-logged in users
  const availableModes = isLoggedIn 
    ? ['erp-to-counterparty', 'csv-to-csv', 'erp-to-csv'] 
    : ['csv-to-csv'];
  
  const handleFileUpload = (file: File, index: 1 | 2) => {
    if (!file.name.endsWith('.csv')) {
      error('Please upload a CSV file');
      return;
    }
    
    if (index === 1) {
      setCsvFile1(file);
    } else {
      setCsvFile2(file);
    }
    
    success(`${file.name} uploaded successfully`);
  };
  
  const handleStartMatching = async () => {
    if (!isLoggedIn && matchMode !== 'csv-to-csv') {
      info('Please create an account to access ERP connections', 'Account Required');
      return;
    }
    
    if (matchMode === 'csv-to-csv' && (!csvFile1 || !csvFile2)) {
      error('Please upload both CSV files to start matching');
      return;
    }
    
    if (matchMode === 'erp-to-counterparty' && (!selectedERP || !selectedCustomer)) {
      error('Please select both ERP system and customer');
      return;
    }
    
    setIsMatching(true);
    
    // Simulate matching process
    setTimeout(() => {
      setIsMatching(false);
      setShowResults(true);
      success(`Matching completed! Found ${matchResults.length} records to review`);
    }, 3000);
  };
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const filteredAndSortedResults = useMemo(() => {
    let filtered = matchResults;
    
    if (filterStatus !== 'all') {
      filtered = matchResults.filter(result => result.status === filterStatus);
    }
    
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a.confidence;
        let bVal: any = b.confidence;
        
        if (sortColumn === 'invoice') {
          aVal = a.ourRecord.invoiceNumber;
          bVal = b.ourRecord.invoiceNumber;
        } else if (sortColumn === 'amount') {
          aVal = a.ourRecord.amount;
          bVal = b.ourRecord.amount;
        } else if (sortColumn === 'date') {
          aVal = new Date(a.ourRecord.date);
          bVal = new Date(b.ourRecord.date);
        }
        
        if (typeof aVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }
    
    return filtered;
  }, [matchResults, sortColumn, sortDirection, filterStatus]);
  
  const getConfidenceBadge = (confidence: number, status: string) => {
    if (status === 'matched') {
      return <Badge variant="success">{confidence}%</Badge>;
    } else if (status === 'mismatched') {
      return <Badge variant="warning">{confidence}%</Badge>;
    } else {
      return <Badge variant="error">{confidence}%</Badge>;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const handleExport = (format: 'csv' | 'pdf') => {
    if (!isLoggedIn) {
      info('Please create an account to export results', 'Account Required');
      return;
    }
    
    success(`Exporting ${filteredAndSortedResults.length} records as ${format.toUpperCase()}`);
  };
  
  const handleSendToCounterparty = (resultId: string) => {
    if (!isLoggedIn) {
      info('Please create an account to share results with counterparties', 'Account Required');
      return;
    }
    
    success('Results shared with counterparty');
  };
  
  const summaryStats = useMemo(() => {
    const total = filteredAndSortedResults.length;
    const matched = filteredAndSortedResults.filter(r => r.status === 'matched').length;
    const mismatched = filteredAndSortedResults.filter(r => r.status === 'mismatched').length;
    const unmatched = filteredAndSortedResults.filter(r => r.status === 'no-match').length;
    
    const totalValue = filteredAndSortedResults.reduce((sum, r) => sum + r.ourRecord.amount, 0);
    const matchedValue = filteredAndSortedResults
      .filter(r => r.status === 'matched')
      .reduce((sum, r) => sum + r.ourRecord.amount, 0);
    
    return { total, matched, mismatched, unmatched, totalValue, matchedValue };
  }, [filteredAndSortedResults]);
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Matches</h1>
          <p className="mt-1 text-body text-neutral-600">
            {isLoggedIn 
              ? 'Match invoices between your systems and counterparties'
              : 'Try our matching with CSV uploads (create an account for full features)'
            }
          </p>
        </div>
        {!isLoggedIn && (
          <Button variant="primary" onClick={onLogin}>
            Unlock full features
          </Button>
        )}
      </div>
      
      {/* Matching Setup */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-neutral-900">
            Setup Matching
          </h2>
          <p className="text-body text-neutral-600">
            Choose your data sources and start the matching process
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Matching Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ERP to Counterparty */}
                <div 
                  className={cn(
                    'relative p-4 border rounded-lg cursor-pointer transition-all duration-120',
                    matchMode === 'erp-to-counterparty' && isLoggedIn
                      ? 'border-primary-500 bg-primary-50'
                      : !isLoggedIn
                      ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed'
                      : 'border-neutral-200 hover:border-primary-300'
                  )}
                  onClick={() => {
                    if (isLoggedIn) {
                      setMatchMode('erp-to-counterparty');
                    } else {
                      info('Please create an account to access ERP connections', 'Account Required');
                    }
                  }}
                >
                  {!isLoggedIn && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      matchMode === 'erp-to-counterparty' && isLoggedIn
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    )}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className={cn(
                      'text-body font-medium',
                      !isLoggedIn ? 'text-neutral-400' : 'text-neutral-900'
                    )}>
                      ERP to Counterparty
                    </h3>
                  </div>
                  <p className={cn(
                    'text-small',
                    !isLoggedIn ? 'text-neutral-400' : 'text-neutral-600'
                  )}>
                    Match your ERP data with a connected counterparty's system
                  </p>
                </div>
                
                {/* CSV to CSV */}
                <div 
                  className={cn(
                    'relative p-4 border rounded-lg cursor-pointer transition-all duration-120',
                    matchMode === 'csv-to-csv'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  )}
                  onClick={() => setMatchMode('csv-to-csv')}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      matchMode === 'csv-to-csv'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    )}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-body font-medium text-neutral-900">
                      CSV to CSV
                    </h3>
                  </div>
                  <p className="text-small text-neutral-600">
                    Upload two CSV files and match them against each other
                  </p>
                  <Badge variant="success" className="mt-2">
                    Free to try
                  </Badge>
                </div>
                
                {/* ERP to CSV */}
                <div 
                  className={cn(
                    'relative p-4 border rounded-lg cursor-pointer transition-all duration-120',
                    matchMode === 'erp-to-csv' && isLoggedIn
                      ? 'border-primary-500 bg-primary-50'
                      : !isLoggedIn
                      ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed'
                      : 'border-neutral-200 hover:border-primary-300'
                  )}
                  onClick={() => {
                    if (isLoggedIn) {
                      setMatchMode('erp-to-csv');
                    } else {
                      info('Please create an account to access ERP connections', 'Account Required');
                    }
                  }}
                >
                  {!isLoggedIn && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      matchMode === 'erp-to-csv' && isLoggedIn
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    )}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <h3 className={cn(
                      'text-body font-medium',
                      !isLoggedIn ? 'text-neutral-400' : 'text-neutral-900'
                    )}>
                      ERP to CSV
                    </h3>
                  </div>
                  <p className={cn(
                    'text-small',
                    !isLoggedIn ? 'text-neutral-400' : 'text-neutral-600'
                  )}>
                    Match your ERP data against an uploaded CSV file
                  </p>
                </div>
              </div>
            </div>
            
            {/* Configuration based on mode */}
            {matchMode === 'erp-to-counterparty' && isLoggedIn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select ERP System
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                    value={selectedERP}
                    onChange={(e) => setSelectedERP(e.target.value)}
                  >
                    <option value="">Choose your ERP system...</option>
                    {mockERPConnections
                      .filter(conn => conn.status === 'connected')
                      .map(conn => (
                        <option key={conn.id} value={conn.id}>
                          {conn.name} ({conn.recordCount} records)
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Customer/Vendor
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Choose customer/vendor...</option>
                    {mockCounterpartyLinks
                      .filter(cp => cp.connectionStatus === 'linked')
                      .map(cp => (
                        <option key={cp.id} value={cp.id}>
                          {cp.ourCustomer} (Connected via {cp.theirSystem})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )}
            
            {matchMode === 'csv-to-csv' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File 1 Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Your Ledger (CSV)
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-120">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 1)}
                      className="hidden"
                      id="csv-file-1"
                    />
                    <label htmlFor="csv-file-1" className="cursor-pointer">
                      <svg className="mx-auto h-8 w-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-neutral-600">
                        {csvFile1 ? csvFile1.name : 'Click to upload your AR/AP ledger'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        CSV format with invoice number, amount, date
                      </p>
                    </label>
                  </div>
                </div>
                
                {/* File 2 Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Counterparty Ledger (CSV)
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-120">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 2)}
                      className="hidden"
                      id="csv-file-2"
                    />
                    <label htmlFor="csv-file-2" className="cursor-pointer">
                      <svg className="mx-auto h-8 w-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-neutral-600">
                        {csvFile2 ? csvFile2.name : 'Click to upload counterparty ledger'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Their AP/AR ledger in CSV format
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {matchMode === 'erp-to-csv' && isLoggedIn && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select ERP System
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                    value={selectedERP}
                    onChange={(e) => setSelectedERP(e.target.value)}
                  >
                    <option value="">Choose your ERP system...</option>
                    {mockERPConnections
                      .filter(conn => conn.status === 'connected')
                      .map(conn => (
                        <option key={conn.id} value={conn.id}>
                          {conn.name} ({conn.recordCount} records)
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Upload CSV File
                  </label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-120">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 1)}
                      className="hidden"
                      id="csv-file-erp"
                    />
                    <label htmlFor="csv-file-erp" className="cursor-pointer">
                      <svg className="mx-auto h-6 w-6 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-neutral-600">
                        {csvFile1 ? csvFile1.name : 'Upload counterparty CSV'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Start Matching Button */}
            <div className="flex justify-center pt-4">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleStartMatching}
                isLoading={isMatching}
                className="min-w-[200px]"
              >
                {isMatching ? 'Matching in progress...' : 'Start matching'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      {showResults && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                    Total Records
                  </p>
                  <p className="mt-2 text-h2 font-bold text-neutral-900">
                    {summaryStats.total}
                  </p>
                  <p className="mt-1 text-small text-neutral-500">
                    {formatCurrency(summaryStats.totalValue)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                    Matched
                  </p>
                  <p className="mt-2 text-h2 font-bold text-success-600">
                    {summaryStats.matched}
                  </p>
                  <p className="mt-1 text-small text-neutral-500">
                    {formatCurrency(summaryStats.matchedValue)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                    Mismatched
                  </p>
                  <p className="mt-2 text-h2 font-bold text-warning-600">
                    {summaryStats.mismatched}
                  </p>
                  <p className="mt-1 text-small text-neutral-500">
                    Need review
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <div className="text-center">
                  <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                    Unmatched
                  </p>
                  <p className="mt-2 text-h2 font-bold text-error-600">
                    {summaryStats.unmatched}
                  </p>
                  <p className="mt-1 text-small text-neutral-500">
                    Missing records
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Results Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-h3 font-semibold text-neutral-900">
                    Matching Results
                  </h2>
                  <p className="text-body text-neutral-600">
                    Detailed breakdown of invoice matching results
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <select 
                    className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="matched">Matched</option>
                    <option value="mismatched">Mismatched</option>
                    <option value="no-match">Unmatched</option>
                  </select>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleExport('csv')}
                  >
                    Export CSV
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleExport('pdf')}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      sortable
                      sortDirection={sortColumn === 'invoice' ? sortDirection : null}
                      onSort={() => handleSort('invoice')}
                    >
                      Invoice #
                    </TableHead>
                    <TableHead 
                      sortable
                      sortDirection={sortColumn === 'date' ? sortDirection : null}
                      onSort={() => handleSort('date')}
                    >
                      Date
                    </TableHead>
                    <TableHead 
                      sortable
                      sortDirection={sortColumn === 'amount' ? sortDirection : null}
                      onSort={() => handleSort('amount')}
                    >
                      Amount
                    </TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead 
                      sortable
                      sortDirection={sortColumn === 'confidence' ? sortDirection : null}
                      onSort={() => handleSort('confidence')}
                    >
                      Confidence
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedResults.map((result) => (
                    <React.Fragment key={result.id}>
                      <TableRow 
                        expandable
                        expanded={expandedRow === result.id}
                        onToggleExpand={() => setExpandedRow(expandedRow === result.id ? null : result.id)}
                      >
                        <TableCell>
                          <div className="font-mono text-sm">
                            {result.ourRecord.invoiceNumber}
                          </div>
                          {result.theirRecord && (
                            <div className="text-xs text-neutral-500 font-mono">
                              Their: {result.theirRecord.invoiceNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(result.ourRecord.date)}
                          </div>
                          {result.theirRecord && (
                            <div className="text-xs text-neutral-500">
                              Their: {formatDate(result.theirRecord.date)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatCurrency(result.ourRecord.amount)}
                          </div>
                          {result.theirRecord && (
                            <div className="text-xs text-neutral-500">
                              Their: {formatCurrency(result.theirRecord.amount)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {result.ourRecord.counterparty}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(result.confidence, result.status)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={result.status === 'matched' ? 'success' : result.status === 'mismatched' ? 'warning' : 'error'}
                          >
                            {result.status === 'no-match' ? 'Unmatched' : result.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setExpandedRow(expandedRow === result.id ? null : result.id)}
                            >
                              {expandedRow === result.id ? 'Hide' : 'Details'}
                            </Button>
                            {result.status !== 'no-match' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSendToCounterparty(result.id)}
                              >
                                Share
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row Details */}
                      {expandedRow === result.id && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <div className="bg-neutral-50 p-4 rounded-md space-y-4">
                              {/* Reasons */}
                              {result.reasons.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-900 mb-2">
                                    Issues Detected:
                                  </h4>
                                  <ul className="list-disc list-inside space-y-1">
                                    {result.reasons.map((reason, index) => (
                                      <li key={index} className="text-sm text-neutral-600">
                                        {reason}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Insights */}
                              {result.insights.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-900 mb-2">
                                    AI Insights:
                                  </h4>
                                  <ul className="space-y-1">
                                    {result.insights.map((insight, index) => (
                                      <li key={index} className="text-sm text-primary-700 bg-primary-50 p-2 rounded">
                                        💡 {insight}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Full Record Details */}
                              {result.theirRecord && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-neutral-900 mb-2">
                                      Our Record:
                                    </h4>
                                    <div className="bg-white p-3 rounded border text-xs font-mono space-y-1">
                                      <div>Invoice: {result.ourRecord.invoiceNumber}</div>
                                      <div>Amount: {formatCurrency(result.ourRecord.amount)}</div>
                                      <div>Date: {result.ourRecord.date}</div>
                                      <div>Reference: {result.ourRecord.reference || 'N/A'}</div>
                                      <div>Status: {result.ourRecord.status}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium text-neutral-900 mb-2">
                                      Their Record:
                                    </h4>
                                    <div className="bg-white p-3 rounded border text-xs font-mono space-y-1">
                                      <div>Invoice: {result.theirRecord.invoiceNumber}</div>
                                      <div>Amount: {formatCurrency(result.theirRecord.amount)}</div>
                                      <div>Date: {result.theirRecord.date}</div>
                                      <div>Reference: {result.theirRecord.reference || 'N/A'}</div>
                                      <div>Status: {result.theirRecord.status}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Empty State for Free Users */}
      {!showResults && !isLoggedIn && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-4">
                Try our CSV matching for free
              </h3>
              <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
                Upload two CSV files to see how our AI-powered matching works. 
                Create an account to unlock ERP integrations and counterparty connections.
              </p>
              <div className="space-y-3">
                <Button variant="primary" onClick={onLogin}>
                  Create account for full features
                </Button>
                <p className="text-small text-neutral-500">
                  Free trial • No credit card required
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { Matches };