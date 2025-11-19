import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Modal } from '../ui/Modal';
import axios from 'axios';

interface ERPContact {
  erpConnectionId: string;
  erpType: string;
  erpContactId: string;
  name: string;
  email: string;
  type: 'customer' | 'vendor' | 'both';
  contactNumber?: string;
  status: 'linked' | 'invited' | 'pending' | 'unlinked';
  inviteId?: string;
  linkId?: string;
  metadata?: any;
}

interface ERPConnection {
  id: string;
  platform: string;
  name: string;
  status: string;
}

interface CustomerVendorListProps {
  onInvite?: (contact: ERPContact) => void;
}

export const CustomerVendorList: React.FC<CustomerVendorListProps> = ({ onInvite }) => {
  const [contacts, setContacts] = useState<ERPContact[]>([]);
  const [connections, setConnections] = useState<ERPConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [inviteModal, setInviteModal] = useState<{ open: boolean; contact?: ERPContact }>({ open: false });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    fetchERPContacts();
  }, []);

  const fetchERPContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/counterparty/erp-contacts`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setContacts(response.data.contacts || []);
        setConnections(response.data.erpConnections || []);
      } else {
        setError(response.data.error || 'Failed to fetch contacts');
      }
    } catch (err: any) {
      console.error('Error fetching ERP contacts:', err);
      setError(err.response?.data?.error || 'Failed to fetch ERP contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteModal.contact || !inviteEmail) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/counterparty/invite`,
        {
          erpConnectionId: inviteModal.contact.erpConnectionId,
          erpContactId: inviteModal.contact.erpContactId,
          recipientEmail: inviteEmail,
          relationshipType: inviteModal.contact.type === 'both' ? 'customer' : inviteModal.contact.type,
          message: inviteMessage,
          contactDetails: {
            name: inviteModal.contact.name,
            email: inviteModal.contact.email || inviteEmail,
            type: inviteModal.contact.type,
            contactNumber: inviteModal.contact.contactNumber,
            metadata: inviteModal.contact.metadata
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update the contact status locally
        setContacts(prev => 
          prev.map(c => 
            c.erpContactId === inviteModal.contact!.erpContactId 
              ? { ...c, status: 'invited' as const, inviteId: response.data.invite.id }
              : c
          )
        );
        
        setInviteModal({ open: false });
        setInviteEmail('');
        setInviteMessage('');
        
        if (onInvite) {
          onInvite(inviteModal.contact);
        }
      } else {
        alert(response.data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      alert(err.response?.data?.error || 'Failed to send invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge variant="success">Linked</Badge>;
      case 'invited':
        return <Badge variant="warning">Invited</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      default:
        return <Badge variant="default">Unlinked</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'customer') {
      return (
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
          C
        </div>
      );
    } else if (type === 'vendor') {
      return (
        <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-700 flex items-center justify-center text-xs font-medium">
          V
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded-full bg-success-100 text-success-700 flex items-center justify-center text-xs font-medium">
          B
        </div>
      );
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'customer' && (contact.type === 'customer' || contact.type === 'both')) ||
                       (filterType === 'vendor' && (contact.type === 'vendor' || contact.type === 'both'));
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'linked' && contact.status === 'linked') ||
                         (filterStatus === 'unlinked' && contact.status !== 'linked');
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group contacts by ERP connection
  const groupedContacts = connections.map(conn => ({
    connection: conn,
    contacts: filteredContacts.filter(c => c.erpConnectionId === conn.id)
  })).filter(group => group.contacts.length > 0);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading ERP contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-error mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-neutral-900 font-medium mb-2">Failed to load contacts</p>
          <p className="text-neutral-600 text-sm mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchERPContacts}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-h3 text-neutral-900">ERP Contacts</h3>
              <p className="text-body text-neutral-600 mt-1">
                Customers and vendors from your connected accounting systems
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="customer">Customers</option>
                <option value="vendor">Vendors</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="linked">Linked</option>
                <option value="unlinked">Not Linked</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contacts by ERP Connection */}
      {groupedContacts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">No contacts found</h3>
            <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
              {connections.length === 0 
                ? 'Connect your accounting system to see customers and vendors'
                : 'No contacts match your current filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedContacts.map(group => (
          <Card key={group.connection.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">
                      {group.connection.platform === 'Xero' ? '🔷' : '🔵'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-h4 text-neutral-900">{group.connection.name}</h4>
                    <p className="text-small text-neutral-600">
                      {group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant={group.connection.status === 'connected' ? 'success' : 'default'}>
                  {group.connection.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.contacts.map((contact) => (
                    <TableRow key={contact.erpContactId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(contact.type)}
                          <div>
                            <p className="font-medium text-neutral-900">{contact.name}</p>
                            {contact.metadata?.accountNumber && (
                              <p className="text-xs text-neutral-500">#{contact.metadata.accountNumber}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-neutral-900">
                          {contact.type === 'both' ? 'Customer & Vendor' : contact.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-600">{contact.email || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-600">{contact.contactNumber || '-'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {contact.status === 'unlinked' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setInviteModal({ open: true, contact });
                                setInviteEmail(contact.email || '');
                              }}
                            >
                              Send Invite
                            </Button>
                          )}
                          {contact.status === 'invited' && (
                            <Button variant="ghost" size="sm">
                              Resend
                            </Button>
                          )}
                          {contact.status === 'linked' && (
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModal.open}
        onClose={() => setInviteModal({ open: false })}
        title={`Invite ${inviteModal.contact?.name || 'Contact'}`}
        description="Send an invitation to link for automated reconciliation"
      >
        {inviteModal.contact && (
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {getTypeIcon(inviteModal.contact.type)}
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{inviteModal.contact.name}</p>
                  <p className="text-sm text-neutral-600 capitalize">
                    {inviteModal.contact.type === 'both' ? 'Customer & Vendor' : inviteModal.contact.type}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Recipient Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="finance@company.com"
              helperText="The email address where the invitation will be sent"
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                className="input min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {inviteMessage.length}/500 characters
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">What happens next?</h4>
              <ul className="text-small text-primary-700 space-y-1">
                <li>• They receive a secure invitation with a unique code</li>
                <li>• They can accept and connect their accounting system</li>
                <li>• Transactions are automatically matched between systems</li>
                <li>• Only shared transaction data is visible to both parties</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSendInvite}
                disabled={!inviteEmail}
                className="flex-1"
              >
                Send Invitation
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInviteModal({ open: false });
                  setInviteEmail('');
                  setInviteMessage('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
