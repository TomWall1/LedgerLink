/**
 * Counterparties Page - Connected to Backend API
 * 
 * This page manages business relationships with customers and vendors.
 * Now fully integrated with the Phase 4 backend counterparty system.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import counterpartyService, { 
  Counterparty, 
  CounterpartyListResponse,
  CreateCounterpartyRequest 
} from '../services/counterpartyService';

export const Counterparties: React.FC = () => {
  // State management
  const [data, setData] = useState<CounterpartyListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [inviteModal, setInviteModal] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  
  // Form states
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    type: 'customer' as 'customer' | 'vendor',
    phone: '',
    notes: ''
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  /**
   * Load counterparties from backend
   */
  const loadCounterparties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await counterpartyService.getCounterparties({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: 50
      });
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load counterparties');
      console.error('Error loading counterparties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadCounterparties();
  }, [searchTerm, statusFilter, typeFilter]);

  /**
   * Handle creating a new counterparty
   */
  const handleCreateCounterparty = async () => {
    if (!inviteForm.name || !inviteForm.email) {
      setError('Name and email are required');
      return;
    }

    try {
      setActionLoading({ create: true });
      
      const request: CreateCounterpartyRequest = {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        type: inviteForm.type,
        phone: inviteForm.phone.trim() || undefined,
        notes: inviteForm.notes.trim() || undefined,
        matchingEnabled: true
      };

      await counterpartyService.createCounterparty(request);
      
      // Reset form and close modal
      setInviteForm({ name: '', email: '', type: 'customer', phone: '', notes: '' });
      setInviteModal(false);
      
      // Reload data
      await loadCounterparties();
      
      console.log(`✅ Invitation sent to ${request.email} for ${request.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create counterparty');
      console.error('Error creating counterparty:', err);
    } finally {
      setActionLoading({ create: false });
    }
  };

  /**
   * Handle resending invitation
   */
  const handleResendInvitation = async (counterparty: Counterparty) => {
    try {
      setActionLoading({ [`resend_${counterparty._id}`]: true });
      
      await counterpartyService.resendInvitation(counterparty._id);
      
      // Reload data to get updated timestamps
      await loadCounterparties();
      
      console.log(`✅ Invitation resent to ${counterparty.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
      console.error('Error resending invitation:', err);
    } finally {
      setActionLoading({ [`resend_${counterparty._id}`]: false });
    }
  };

  /**
   * Handle removing counterparty
   */
  const handleRemoveCounterparty = async (id: string) => {
    if (!confirm('Are you sure you want to remove this counterparty? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading({ [`delete_${id}`]: true });
      
      await counterpartyService.deleteCounterparty(id);
      
      // Reload data
      await loadCounterparties();
      
      console.log(`✅ Counterparty removed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove counterparty');
      console.error('Error removing counterparty:', err);
    } finally {
      setActionLoading({ [`delete_${id}`]: false });
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status: Counterparty['status']) => {
    switch (status) {
      case 'linked':
        return <Badge variant="success">Linked</Badge>;
      case 'invited':
        return <Badge variant="warning">Invited</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'unlinked':
        return <Badge variant="error">Unlinked</Badge>;
      case 'suspended':
        return <Badge variant="error">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Get summary data
  const summary = data?.summary || { total: 0, linked: 0, invited: 0, pending: 0, unlinked: 0 };
  const counterparties = data?.counterparties || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-h1 text-neutral-900 mb-2">Counterparties</h1>
            <p className="text-body-lg text-neutral-600">
              Manage relationships with customers and vendors for automated reconciliation.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setInviteModal(true)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Invite Counterparty
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-error-200 bg-error-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-error">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto text-error hover:bg-error-100"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-primary-600">{summary.total}</div>
              <div className="text-small text-neutral-600">Total Counterparties</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-success">{summary.linked}</div>
              <div className="text-small text-neutral-600">Linked</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-warning">{summary.invited}</div>
              <div className="text-small text-neutral-600">Invited</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-neutral-600">{summary.pending}</div>
              <div className="text-small text-neutral-600">Pending</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="Search counterparties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Statuses</option>
              <option value="linked">Linked</option>
              <option value="invited">Invited</option>
              <option value="pending">Pending</option>
              <option value="unlinked">Unlinked</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Types</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setTypeFilter('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Counterparties Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h3 text-neutral-900">All Counterparties</h2>
              <p className="text-body text-neutral-600 mt-1">
                {counterparties.length > 0 
                  ? `Showing ${counterparties.length} counterparties`
                  : 'No counterparties found'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading counterparties...</p>
            </div>
          ) : counterparties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Match Rate</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counterparties.map((counterparty) => (
                  <TableRow key={counterparty._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          counterparty.type === 'customer' 
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-warning-100 text-warning-700'
                        }`}>
                          {counterparty.type === 'customer' ? 'C' : 'V'}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{counterparty.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-600">{counterparty.email}</TableCell>
                    <TableCell>
                      <span className="capitalize text-neutral-900">{counterparty.type}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(counterparty.status)}</TableCell>
                    <TableCell>
                      {counterparty.linkedSystem ? (
                        <span className="text-neutral-900 capitalize">{counterparty.linkedSystem}</span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-neutral-900">
                        {counterparty.statistics.totalTransactions.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {counterparty.statistics.totalTransactions > 0 ? (
                        <Badge variant="success">
                          {counterparty.statistics.matchRate.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-600">
                      {formatDate(counterparty.statistics.lastActivityAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {counterparty.status === 'invited' && (
                          <button
                            onClick={() => handleResendInvitation(counterparty)}
                            disabled={actionLoading[`resend_${counterparty._id}`]}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors duration-120 disabled:opacity-50"
                            title="Resend invitation"
                          >
                            {actionLoading[`resend_${counterparty._id}`] ? (
                              <div className="w-4 h-4 animate-spin border border-neutral-400 border-t-transparent rounded-full" />
                            ) : (
                              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => setSelectedCounterparty(counterparty)}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors duration-120"
                          title="View details"
                        >
                          <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleRemoveCounterparty(counterparty._id)}
                          disabled={actionLoading[`delete_${counterparty._id}`]}
                          className="p-1 hover:bg-error-100 rounded transition-colors duration-120 disabled:opacity-50"
                          title="Remove counterparty"
                        >
                          {actionLoading[`delete_${counterparty._id}`] ? (
                            <div className="w-4 h-4 animate-spin border border-error border-t-transparent rounded-full" />
                          ) : (
                            <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-h3 font-semibold text-neutral-900 mb-2">
                {searchTerm || statusFilter || typeFilter ? 'No matching counterparties' : 'No counterparties yet'}
              </h3>
              <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
                {searchTerm || statusFilter || typeFilter 
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Invite your customers and vendors to establish secure connections for automatic invoice reconciliation.'
                }
              </p>
              {!(searchTerm || statusFilter || typeFilter) && (
                <Button 
                  variant="primary" 
                  onClick={() => setInviteModal(true)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                >
                  Invite Your First Counterparty
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invite Modal */}
      <Modal
        isOpen={inviteModal}
        onClose={() => {
          setInviteModal(false);
          setInviteForm({ name: '', email: '', type: 'customer', phone: '', notes: '' });
        }}
        title="Invite Counterparty"
        description="Invite a customer or vendor to link their accounting system for automated reconciliation"
      >
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={inviteForm.name}
            onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Acme Corporation"
            required
          />
          
          <Input
            label="Email Address"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="finance@company.com"
            helperText="They will receive an invitation to connect their accounting system"
            required
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            value={inviteForm.phone}
            onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+61 2 9876 5432"
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Counterparty Type
            </label>
            <select
              value={inviteForm.type}
              onChange={(e) => setInviteForm(prev => ({ ...prev, type: e.target.value as 'customer' | 'vendor' }))}
              className="input w-full"
            >
              <option value="customer">Customer (they owe you money)</option>
              <option value="vendor">Vendor (you owe them money)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={inviteForm.notes}
              onChange={(e) => setInviteForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this relationship..."
              className="input w-full h-20 resize-none"
            />
          </div>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-2">What happens next?</h4>
            <ul className="text-small text-primary-700 space-y-1">
              <li>• {inviteForm.name || 'The counterparty'} receives a secure invitation email</li>
              <li>• They can connect their accounting system in read-only mode</li>
              <li>• Both parties can view reconciliation results</li>
              <li>• No sensitive data is shared between systems</li>
            </ul>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              onClick={handleCreateCounterparty}
              disabled={!inviteForm.email || !inviteForm.name || actionLoading.create}
              isLoading={actionLoading.create}
              className="flex-1"
            >
              Send Invitation
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInviteModal(false);
                setInviteForm({ name: '', email: '', type: 'customer', phone: '', notes: '' });
              }}
              className="flex-1"
              disabled={actionLoading.create}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Counterparty Details Modal */}
      <Modal
        isOpen={!!selectedCounterparty}
        onClose={() => setSelectedCounterparty(null)}
        title={selectedCounterparty?.name || ''}
        description="Counterparty details and relationship history"
        size="lg"
      >
        {selectedCounterparty && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Contact Information</h4>
                <div className="space-y-2 text-small">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Email:</span>
                    <span className="font-medium">{selectedCounterparty.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Type:</span>
                    <span className="font-medium capitalize">{selectedCounterparty.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Status:</span>
                    {getStatusBadge(selectedCounterparty.status)}
                  </div>
                  {selectedCounterparty.contactInfo?.phone && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Phone:</span>
                      <span className="font-medium">{selectedCounterparty.contactInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Reconciliation Stats</h4>
                <div className="space-y-2 text-small">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Transactions:</span>
                    <span className="font-medium">{selectedCounterparty.statistics.totalTransactions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Matches:</span>
                    <span className="font-medium">{selectedCounterparty.statistics.totalMatches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Match Rate:</span>
                    <Badge variant="success">
                      {selectedCounterparty.statistics.matchRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedCounterparty.statistics.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">System:</span>
                    <span className="font-medium capitalize">{selectedCounterparty.linkedSystem || 'Not linked'}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedCounterparty.notes && (
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Notes</h4>
                <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                  {selectedCounterparty.notes}
                </p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4 border-t border-neutral-200">
              {selectedCounterparty.status === 'linked' && (
                <Button variant="primary" size="sm">
                  View Matches
                </Button>
              )}
              {selectedCounterparty.status === 'invited' && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {
                    handleResendInvitation(selectedCounterparty);
                    setSelectedCounterparty(null);
                  }}
                  disabled={actionLoading[`resend_${selectedCounterparty._id}`]}
                >
                  Resend Invitation
                </Button>
              )}
              <Button variant="ghost" size="sm">
                Edit Details
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  handleRemoveCounterparty(selectedCounterparty._id);
                  setSelectedCounterparty(null);
                }}
                disabled={actionLoading[`delete_${selectedCounterparty._id}`]}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};