import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

interface Counterparty {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'vendor';
  status: 'linked' | 'invited' | 'pending' | 'unlinked';
  linkedSystem?: string;
  lastActivity?: string;
  matchingEnabled: boolean;
  totalTransactions?: number;
  matchRate?: number;
}

export const Counterparties: React.FC = () => {
  const [inviteModal, setInviteModal] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<'customer' | 'vendor'>('customer');
  const [inviteName, setInviteName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Real data will be fetched from backend
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);

  useEffect(() => {
    // TODO: Fetch real counterparty data from backend
    // const fetchCounterparties = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await fetch('/api/counterparties');
    //     const data = await response.json();
    //     setCounterparties(data);
    //   } catch (error) {
    //     console.error('Failed to fetch counterparties:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchCounterparties();
  }, []);
  
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
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };
  
  const handleInvite = () => {
    // TODO: Send invitation via backend API
    const newCounterparty: Counterparty = {
      id: Date.now().toString(),
      name: inviteName,
      email: inviteEmail,
      type: inviteType,
      status: 'invited',
      matchingEnabled: false,
      lastActivity: 'Just now'
    };
    
    setCounterparties(prev => [...prev, newCounterparty]);
    setInviteModal(false);
    setInviteEmail('');
    setInviteName('');
  };
  
  const handleResendInvite = (counterparty: Counterparty) => {
    // TODO: Resend invite via backend API
    console.log('Resending invite to:', counterparty.email);
    setCounterparties(prev => 
      prev.map(cp => 
        cp.id === counterparty.id 
          ? { ...cp, lastActivity: 'Just now' }
          : cp
      )
    );
  };
  
  const handleRemoveCounterparty = (id: string) => {
    // TODO: Remove via backend API
    setCounterparties(prev => prev.filter(cp => cp.id !== id));
  };
  
  const linkedCount = counterparties.filter(cp => cp.status === 'linked').length;
  const invitedCount = counterparties.filter(cp => cp.status === 'invited').length;
  const pendingCount = counterparties.filter(cp => cp.status === 'pending').length;
  
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
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-primary-600">{counterparties.length}</div>
              <div className="text-small text-neutral-600">Total Counterparties</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-success">{linkedCount}</div>
              <div className="text-small text-neutral-600">Linked</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-warning">{invitedCount}</div>
              <div className="text-small text-neutral-600">Invited</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-h1 font-bold text-neutral-600">{pendingCount}</div>
              <div className="text-small text-neutral-600">Pending</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Counterparties Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h3 text-neutral-900">All Counterparties</h2>
              <p className="text-body text-neutral-600 mt-1">
                {counterparties.length > 0 
                  ? 'Manage your customer and vendor relationships'
                  : 'Invite counterparties to start automated reconciliation'}
              </p>
            </div>
            {counterparties.length > 0 && (
              <div className="flex space-x-2">
                <Input 
                  placeholder="Search counterparties..."
                  className="w-64"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
            )}
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
                  <TableRow key={counterparty.id}>
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
                        <span className="text-neutral-900">{counterparty.linkedSystem}</span>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-neutral-900">
                        {counterparty.totalTransactions?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {counterparty.matchRate ? (
                        <Badge variant="confidence" score={counterparty.matchRate}>
                          {counterparty.matchRate.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-600">
                      {counterparty.lastActivity || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {counterparty.status === 'invited' && (
                          <button
                            onClick={() => handleResendInvite(counterparty)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors duration-120"
                            title="Resend invitation"
                          >
                            <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
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
                          onClick={() => handleRemoveCounterparty(counterparty.id)}
                          className="p-1 hover:bg-error-100 rounded transition-colors duration-120"
                          title="Remove counterparty"
                        >
                          <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
              <h3 className="text-h3 font-semibold text-neutral-900 mb-2">No counterparties yet</h3>
              <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
                Invite your customers and vendors to establish secure connections for automatic invoice reconciliation.
              </p>
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
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Invite Modal */}
      <Modal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Invite Counterparty"
        description="Invite a customer or vendor to link their accounting system for automated reconciliation"
      >
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Acme Corporation"
            required
          />
          
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="finance@company.com"
            helperText="They will receive an invitation to connect their accounting system"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Counterparty Type
            </label>
            <select
              value={inviteType}
              onChange={(e) => setInviteType(e.target.value as 'customer' | 'vendor')}
              className="input w-full"
            >
              <option value="customer">Customer (they owe you money)</option>
              <option value="vendor">Vendor (you owe them money)</option>
            </select>
          </div>
          
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-primary-900 mb-2">What happens next?</h4>
            <ul className="text-small text-primary-700 space-y-1">
              <li>• {inviteName || 'The counterparty'} receives a secure invitation email</li>
              <li>• They can connect their accounting system in read-only mode</li>
              <li>• Both parties can view reconciliation results</li>
              <li>• No sensitive data is shared between systems</li>
            </ul>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              onClick={handleInvite}
              disabled={!inviteEmail || !inviteName}
              className="flex-1"
            >
              Send Invitation
            </Button>
            <Button
              variant="ghost"
              onClick={() => setInviteModal(false)}
              className="flex-1"
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
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-900 mb-2">Reconciliation Stats</h4>
                <div className="space-y-2 text-small">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Transactions:</span>
                    <span className="font-medium">{selectedCounterparty.totalTransactions?.toLocaleString() || 0}</span>
                  </div>
                  {selectedCounterparty.matchRate && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Match Rate:</span>
                      <Badge variant="confidence" score={selectedCounterparty.matchRate}>
                        {selectedCounterparty.matchRate.toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-600">System:</span>
                    <span className="font-medium">{selectedCounterparty.linkedSystem || 'Not linked'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedCounterparty.status === 'linked' && (
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">Recent Activity</h4>
                <p className="text-sm text-neutral-600">No recent activity</p>
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
                  onClick={() => handleResendInvite(selectedCounterparty)}
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
                  handleRemoveCounterparty(selectedCounterparty.id);
                  setSelectedCounterparty(null);
                }}
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
