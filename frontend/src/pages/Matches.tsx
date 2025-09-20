import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

interface MatchesProps {
  isLoggedIn: boolean;
}

interface MatchRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  customer: string;
  ourRef?: string;
  theirRef?: string;
  confidence: number;
  status: 'matched' | 'partial' | 'unmatched';
  reasonCodes?: string[];
}

export const Matches: React.FC<MatchesProps> = ({ isLoggedIn }) => {
  const [selectedERP, setSelectedERP] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Real matches will be loaded from backend
  const [matches, setMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    // TODO: Fetch real matching data when available
    // const fetchMatches = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await fetch('/api/matches');
    //     const data = await response.json();
    //     setMatches(data);
    //   } catch (error) {
    //     console.error('Failed to fetch matches:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchMatches();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortField('');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge variant="success">Matched</Badge>;
      case 'partial':
        return <Badge variant="warning">Partial Match</Badge>;
      case 'unmatched':
        return <Badge variant="error">No Match</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleCSVUpload = () => {
    if (!csvFile) return;
    // TODO: Implement CSV processing logic
    console.log('Processing CSV:', csvFile.name);
    setUploadModalOpen(false);
    setCsvFile(null);
  };

  const handleInviteCounterparty = () => {
    // TODO: Implement invite logic
    console.log('Sending invitation to counterparty');
    setInviteModalOpen(false);
  };

  const stats = {
    total: matches.length,
    matched: matches.filter(m => m.status === 'matched').length,
    partial: matches.filter(m => m.status === 'partial').length,
    unmatched: matches.filter(m => m.status === 'unmatched').length,
    totalAmount: matches.reduce((sum, m) => sum + m.amount, 0),
    matchedAmount: matches.filter(m => m.status === 'matched').reduce((sum, m) => sum + m.amount, 0),
  };

  const matchPercentage = stats.total > 0 ? ((stats.matched / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1 text-neutral-900 mb-2">Invoice Matching</h1>
        <p className="text-body-lg text-neutral-600">
          {isLoggedIn
            ? 'Compare and reconcile your ledgers with connected systems or CSV uploads.'
            : 'Try our matching engine with CSV uploads. Create an account to connect your ERP systems.'}
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-h3 text-neutral-900">Matching Controls</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ERP Selection - only for logged in users */}
            {isLoggedIn && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select ERP System
                </label>
                <select
                  value={selectedERP}
                  onChange={(e) => setSelectedERP(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose ERP system...</option>
                  <option value="xero">Xero</option>
                  <option value="quickbooks">QuickBooks (Coming Soon)</option>
                  <option value="sage">Sage (Coming Soon)</option>
                </select>
              </div>
            )}

            {/* Customer Selection - only if ERP selected */}
            {isLoggedIn && selectedERP && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Customer/Vendor
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input w-full"
                >
                  <option value="">No counterparties connected yet</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 md:justify-end">
              <Button
                variant="primary"
                onClick={() => setUploadModalOpen(true)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
              >
                Upload CSV
              </Button>
              {isLoggedIn && selectedCustomer && (
                <Button
                  variant="secondary"
                  onClick={() => setInviteModalOpen(true)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  }
                >
                  Invite Counterparty
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-h2 font-bold text-success">{matchPercentage}%</div>
              <div className="text-small text-neutral-600">Match Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-h2 font-bold text-primary-600">{stats.total}</div>
              <div className="text-small text-neutral-600">Total Invoices</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-h2 font-bold text-neutral-900">${stats.matchedAmount.toLocaleString()}</div>
              <div className="text-small text-neutral-600">Matched Amount</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-h2 font-bold text-warning">{stats.unmatched}</div>
              <div className="text-small text-neutral-600">Unmatched</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h3 text-neutral-900">Matching Results</h2>
              <p className="text-body text-neutral-600 mt-1">
                {matches.length > 0 
                  ? 'Click on rows to view detailed history and insights'
                  : 'Upload CSV files to start matching invoices'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" disabled={matches.length === 0}>
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" disabled={matches.length === 0}>
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading matches...</p>
            </div>
          ) : matches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'invoiceNumber' ? sortDirection : null}
                    onSort={() => handleSort('invoiceNumber')}
                  >
                    Invoice #
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'date' ? sortDirection : null}
                    onSort={() => handleSort('date')}
                  >
                    Date
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'amount' ? sortDirection : null}
                    onSort={() => handleSort('amount')}
                  >
                    Amount
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Our Ref</TableHead>
                  <TableHead>Their Ref</TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'confidence' ? sortDirection : null}
                    onSort={() => handleSort('confidence')}
                  >
                    Confidence
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <React.Fragment key={match.id}>
                    <TableRow 
                      expandable
                      expanded={expandedRows.has(match.id)}
                      onToggleExpand={() => toggleRowExpand(match.id)}
                    >
                      <TableCell className="font-mono font-medium">{match.invoiceNumber}</TableCell>
                      <TableCell>{match.date}</TableCell>
                      <TableCell className="font-mono">${match.amount.toLocaleString()}</TableCell>
                      <TableCell>{match.customer}</TableCell>
                      <TableCell className="font-mono">{match.ourRef || '-'}</TableCell>
                      <TableCell className="font-mono">{match.theirRef || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="confidence" score={match.confidence}>
                          {match.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(match.status)}</TableCell>
                      <TableCell>
                        <button
                          className="p-1 hover:bg-neutral-100 rounded transition-colors duration-120"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('View details for', match.id);
                          }}
                          title="View details"
                        >
                          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-2">No matches yet</h3>
              <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
                Upload CSV files or connect your accounting system to start matching invoices automatically.
              </p>
              <Button
                variant="primary"
                onClick={() => setUploadModalOpen(true)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
              >
                Upload Your First CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Ledger Data"
        description="Upload your AR or AP ledger data in CSV format for matching"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Your Ledger CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="input w-full"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Required columns: transaction_number, amount, issue_date, due_date, status, reference
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              onClick={handleCSVUpload}
              disabled={!csvFile}
            >
              Process Upload
            </Button>
            <Button
              variant="ghost"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Counterparty"
        description="Invite a customer or vendor to link their system for automatic matching"
      >
        <div className="space-y-4">
          <Input
            label="Counterparty Email"
            type="email"
            placeholder="customer@company.com"
            helperText="They will receive an invitation to connect their accounting system"
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Access Level
            </label>
            <select className="input w-full">
              <option>View matching results only</option>
              <option>Full reconciliation access</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              onClick={handleInviteCounterparty}
            >
              Send Invitation
            </Button>
            <Button
              variant="ghost"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
