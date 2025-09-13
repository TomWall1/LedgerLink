import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { mockCounterpartyLinks } from '../data/mockData';
import { useToast } from '../hooks/useToast';

export interface CounterpartiesProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

const Counterparties: React.FC<CounterpartiesProps> = ({ isLoggedIn, onLogin }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [counterparties, setCounterparties] = useState(mockCounterpartyLinks);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    customerName: '',
    email: '',
    message: '',
  });
  const { success, error } = useToast();
  
  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">
            Account Required
          </h2>
          <p className="text-body-lg text-neutral-600 mb-8">
            Please create an account to manage counterparty connections. 
            This enables secure collaboration with your customers and vendors.
          </p>
          <Button variant="primary" onClick={onLogin}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }
  
  const handleInvite = async () => {
    if (!inviteForm.customerName || !inviteForm.email) {
      error('Please fill in all required fields');
      return;
    }
    
    setIsInviting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCounterparty = {
        id: `cp-${Date.now()}`,
        ourCustomer: inviteForm.customerName,
        theirSystem: 'Unknown',
        connectionStatus: 'invited' as const,
        inviteDate: new Date().toISOString(),
        email: inviteForm.email,
      };
      
      setCounterparties(prev => [...prev, newCounterparty]);
      setIsInviteModalOpen(false);
      setInviteForm({ customerName: '', email: '', message: '' });
      setIsInviting(false);
      
      success(`Invitation sent to ${inviteForm.email}`);
    }, 1500);
  };
  
  const handleResendInvite = (id: string) => {
    const counterparty = counterparties.find(cp => cp.id === id);
    if (counterparty) {
      success(`Invitation resent to ${counterparty.email}`);
    }
  };
  
  const handleRevokeInvite = (id: string) => {
    setCounterparties(prev => prev.filter(cp => cp.id !== id));
    success('Invitation revoked');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge variant="success">Linked</Badge>;
      case 'invited':
        return <Badge variant="warning">Invited</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'declined':
        return <Badge variant="error">Declined</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const linkedCount = counterparties.filter(cp => cp.connectionStatus === 'linked').length;
  const invitedCount = counterparties.filter(cp => cp.connectionStatus === 'invited').length;
  const pendingCount = counterparties.filter(cp => cp.connectionStatus === 'pending').length;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900">Counterparties</h1>
          <p className="mt-1 text-body text-neutral-600">
            Invite customers and vendors to connect their systems for automated reconciliation
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invite counterparty
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Linked
                </p>
                <p className="mt-2 text-h2 font-bold text-success-600">
                  {linkedCount}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  Active connections
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Invited
                </p>
                <p className="mt-2 text-h2 font-bold text-warning-600">
                  {invitedCount}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  Pending response
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small font-medium text-neutral-600 uppercase tracking-wide">
                  Pending
                </p>
                <p className="mt-2 text-h2 font-bold text-primary-600">
                  {pendingCount}
                </p>
                <p className="mt-1 text-small text-neutral-500">
                  Setting up connection
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Counterparties Table */}
      <Card>
        <CardHeader>
          <h2 className="text-h3 font-semibold text-neutral-900">
            Counterparty Connections
          </h2>
          <p className="text-body text-neutral-600">
            Manage your customer and vendor connections
          </p>
        </CardHeader>
        <CardContent>
          {counterparties.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-h3 font-medium text-neutral-900 mb-2">
                No counterparties yet
              </h3>
              <p className="text-body text-neutral-600 mb-6">
                Invite your customers and vendors to connect their accounting systems for automated reconciliation.
              </p>
              <Button 
                variant="primary" 
                onClick={() => setIsInviteModalOpen(true)}
              >
                Send your first invite
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer/Vendor</TableHead>
                  <TableHead>Their System</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counterparties.map((counterparty) => (
                  <TableRow key={counterparty.id}>
                    <TableCell>
                      <div className="font-medium text-neutral-900">
                        {counterparty.ourCustomer}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {counterparty.theirSystem}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(counterparty.connectionStatus)}
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {counterparty.linkDate 
                          ? formatDate(counterparty.linkDate)
                          : counterparty.inviteDate 
                          ? formatDate(counterparty.inviteDate)
                          : '-'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-neutral-600">
                        {counterparty.email || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {counterparty.connectionStatus === 'invited' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResendInvite(counterparty.id)}
                            >
                              Resend
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRevokeInvite(counterparty.id)}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                        {counterparty.connectionStatus === 'linked' && (
                          <Button 
                            variant="secondary" 
                            size="sm"
                          >
                            View matches
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Counterparty"
        description="Send a secure invitation to connect accounting systems"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Customer/Vendor Name"
            value={inviteForm.customerName}
            onChange={(e) => setInviteForm(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder="e.g., Acme Corporation"
            helperText="The name of the company you want to invite"
          />
          
          <Input
            label="Contact Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="finance@company.com"
            helperText="Email of their finance/accounting contact"
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Custom Message (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
              rows={3}
              value={inviteForm.message}
              onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Hi! We'd like to connect our accounting systems to streamline our reconciliation process..."
            />
            <p className="mt-1 text-xs text-neutral-400">
              Add a personal message to explain why you're requesting this connection
            </p>
          </div>
          
          <div className="flex items-center p-3 bg-primary-50 rounded-md">
            <svg className="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-small font-medium text-primary-800">Secure & Private</p>
              <p className="text-xs text-primary-700">Only invited contacts can access specific customer/vendor data</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleInvite}
              isLoading={isInviting}
            >
              Send invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Counterparties };