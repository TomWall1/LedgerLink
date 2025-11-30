import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import apiClient from '../services/api';
import { xeroService } from '../services/xeroService';

interface ERPContact {
  erpConnectionId: string;
  erpType: string;
  erpContactId: string;
  name: string;
  email: string;
  hasCustomEmail?: boolean;
  type: 'customer' | 'vendor' | 'both';
  contactNumber: string;
  status: 'linked' | 'pending' | 'accepted' | 'unlinked';
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

interface InviteFormData {
  contact: ERPContact | null;
  message: string;
}

interface EmailFormData {
  contact: ERPContact | null;
  email: string;
}

export const Counterparties: React.FC = () => {
  const [erpContacts, setErpContacts] = useState<ERPContact[]>([]);
  const [erpConnections, setErpConnections] = useState<ERPConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    contact: null,
    message: ''
  });
  
  // Email management states
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    contact: null,
    email: ''
  });
  const [savingEmail, setSavingEmail] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlinked' | 'pending' | 'linked'>('all');
  const [sending, setSending] = useState(false);
  
  // New states for connection checking
  const [isXeroConnected, setIsXeroConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [xeroConnections, setXeroConnections] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fetchingContacts, setFetchingContacts] = useState(false);

  // First check Xero connection status
  useEffect(() => {
    checkXeroConnection();
  }, []);

  // Then fetch contacts when connection is confirmed
  useEffect(() => {
    if (isXeroConnected && !checkingConnection) {
      fetchERPContacts();
    }
  }, [isXeroConnected, checkingConnection]);

  const checkXeroConnection = async () => {
    console.log('🔍 Checking Xero connection status...');
    setCheckingConnection(true);
    setErrorMessage('');
    
    try {
      const connections = await xeroService.getConnections();
      
      console.log('✅ Xero connections found:', connections.length);
      console.log('Connection details:', connections);
      
      setXeroConnections(connections);
      setIsXeroConnected(connections.length > 0);
      
      if (connections.length === 0) {
        console.log('ℹ️ No active Xero connections found');
      }
    } catch (error: any) {
      console.error('❌ Error checking Xero connection:', error);
      setIsXeroConnected(false);
      setErrorMessage(error.message || 'Failed to check Xero connection');
    } finally {
      setCheckingConnection(false);
      setLoading(false);
    }
  };

  const fetchERPContacts = async () => {
    console.log('📋 Fetching ERP contacts...');
    setFetchingContacts(true);
    setErrorMessage('');
    
    try {
      const response = await apiClient.get('/counterparty/erp-contacts');
      
      console.log('✅ ERP contacts response:', {
        contactsCount: response.data.contacts?.length || 0,
        connectionsCount: response.data.erpConnections?.length || 0
      });
      
      setErpContacts(response.data.contacts || []);
      setErpConnections(response.data.erpConnections || []);
      
      if (response.data.contacts?.length === 0) {
        console.log('ℹ️ No contacts found in connected ERP systems');
      }
    } catch (error: any) {
      console.error('❌ Error fetching ERP contacts:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to fetch ERP contacts');
    } finally {
      setFetchingContacts(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await checkXeroConnection();
  };

  // Handle email modal open
  const handleAddEmailClick = (contact: ERPContact) => {
    setEmailForm({
      contact,
      email: contact.email || ''
    });
    setEmailModal(true);
  };

  // Handle save email
  const handleSaveEmail = async () => {
    if (!emailForm.contact || !emailForm.email) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setSavingEmail(true);
    try {
      await apiClient.post('/counterparty/contact/email', {
        erpConnectionId: emailForm.contact.erpConnectionId,
        erpContactId: emailForm.contact.erpContactId,
        contactName: emailForm.contact.name,
        customEmail: emailForm.email
      });

      // Refresh the contacts list
      await fetchERPContacts();
      
      setEmailModal(false);
      setEmailForm({ contact: null, email: '' });
      
      alert('Email saved successfully!');
    } catch (error: any) {
      console.error('Error saving email:', error);
      alert(error.response?.data?.message || error.message || 'Failed to save email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleInviteClick = (contact: ERPContact) => {
    setInviteForm({
      contact,
      message: `Hi ${contact.name},\n\nI'd like to connect our accounting systems to streamline our invoice reconciliation process. This will help us both save time and reduce errors.\n\nLooking forward to working together!`
    });
    setInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!inviteForm.contact) return;

    setSending(true);
    try {
      await apiClient.post('/counterparty/invite', {
        erpConnectionId: inviteForm.contact.erpConnectionId,
        erpContactId: inviteForm.contact.erpContactId,
        recipientEmail: inviteForm.contact.email,
        relationshipType: inviteForm.contact.type,
        message: inviteForm.message,
        contactDetails: {
          name: inviteForm.contact.name,
          email: inviteForm.contact.email,
          type: inviteForm.contact.type
        }
      });

      // Refresh the contacts list
      await fetchERPContacts();
      
      setInviteModal(false);
      setInviteForm({ contact: null, message: '' });
      
      alert('Invitation sent successfully!');
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert(error.response?.data?.error || error.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleResendInvite = async (contact: ERPContact) => {
    if (!contact.inviteId) return;

    try {
      await apiClient.post('/counterparty/invite/resend', {
        inviteId: contact.inviteId
      });

      alert('Invitation reminder sent!');
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'linked':
        return <Badge variant="success">Linked</Badge>;
      case 'pending':
      case 'accepted':
        return <Badge variant="warning">Invited</Badge>;
      case 'unlinked':
        return <Badge variant="default">Not Invited</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'both') {
      return (
        <div className="flex gap-1">
          <Badge variant="default" size="sm">Customer</Badge>
          <Badge variant="default" size="sm">Vendor</Badge>
        </div>
      );
    }
    return (
      <Badge variant="default" size="sm" className="capitalize">
        {type}
      </Badge>
    );
  };

  // Filter contacts
  const filteredContacts = erpContacts.filter(contact => {
    // Search filter
    const matchesSearch = !searchQuery || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = filterType === 'all' || 
      contact.type === filterType || 
      contact.type === 'both';

    // Status filter
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const totalContacts = erpContacts.length;
  const linkedCount = erpContacts.filter(c => c.status === 'linked').length;
  const invitedCount = erpContacts.filter(c => c.status === 'pending' || c.status === 'accepted').length;
  const uninvitedCount = erpContacts.filter(c => c.status === 'unlinked').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-h1 text-neutral-900 mb-2">Counterparties</h1>
            <p className="text-body-lg text-neutral-600">
              Invite customers and vendors from your accounting system to automate reconciliation.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!checkingConnection && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isXeroConnected ? (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success-100">
                      <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Xero Connected</p>
                      <p className="text-small text-neutral-600">
                        {xeroConnections.map(conn => conn.tenantName).join(', ')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning-100">
                      <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">No Accounting System Connected</p>
                      <p className="text-small text-neutral-600">Connect Xero to import your customers and vendors</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading || fetchingContacts}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Refresh
                </Button>
                {!isXeroConnected && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = '/connections'}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                  >
                    Connect Accounting System
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error-100 flex-shrink-0">
                <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-error-900">Error Loading Data</p>
                <p className="text-small text-error-700 mt-1">{errorMessage}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={handleRefresh}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {(checkingConnection || loading) && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">
              {checkingConnection ? 'Checking Xero connection...' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!checkingConnection && !loading && isXeroConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-h1 font-bold text-primary-600">{totalContacts}</div>
                <div className="text-small text-neutral-600">Total Contacts</div>
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
                <div className="text-h1 font-bold text-neutral-600">{uninvitedCount}</div>
                <div className="text-small text-neutral-600">Not Invited</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No ERP Connections State */}
      {!loading && !checkingConnection && !isXeroConnected && (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-h3 font-semibold text-neutral-900 mb-2">Connect Your Accounting System</h3>
            <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
              To invite counterparties, first connect your accounting system (like Xero, QuickBooks, or Sage). 
              This will import your customers and vendors automatically.
            </p>
            <Button 
              variant="primary"
              onClick={() => window.location.href = '/connections'}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              Connect Accounting System
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ERP Contacts Table */}
      {!loading && !checkingConnection && isXeroConnected && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-h3 text-neutral-900">Customers & Vendors</h2>
                  <p className="text-body text-neutral-600 mt-1">
                    {fetchingContacts ? 'Loading contacts from Xero...' : 'From your connected accounting systems'}
                  </p>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex gap-3 items-center">
                <Input 
                  placeholder="Search by name or email..."
                  className="flex-1 max-w-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <option value="all">All Statuses</option>
                  <option value="unlinked">Not Invited</option>
                  <option value="pending">Invited</option>
                  <option value="linked">Linked</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={fetchingContacts}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  }
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetchingContacts ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading contacts from your accounting system...</p>
              </div>
            ) : filteredContacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact, index) => {
                    const erpConnection = erpConnections.find(
                      conn => conn.id === contact.erpConnectionId
                    );

                    return (
                      <TableRow key={`${contact.erpContactId}-${index}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              contact.type === 'customer' || contact.type === 'both'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-warning-100 text-warning-700'
                            }`}>
                              {contact.type === 'customer' ? 'C' : contact.type === 'vendor' ? 'V' : 'B'}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{contact.name}</p>
                              {contact.contactNumber && (
                                <p className="text-xs text-neutral-500">{contact.contactNumber}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-600">
                          <div className="flex items-center gap-2">
                            {contact.email ? (
                              <>
                                <span>{contact.email}</span>
                                {contact.hasCustomEmail && (
                                  <button
                                    onClick={() => handleAddEmailClick(contact)}
                                    className="text-primary-600 hover:text-primary-700"
                                    title="Edit custom email"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-neutral-400 italic">No email</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(contact.type)}
                        </TableCell>
                        <TableCell>
                          <span className="text-neutral-900">
                            {erpConnection?.platform || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(contact.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Show Add Email button if no email */}
                            {!contact.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddEmailClick(contact)}
                                leftIcon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                }
                              >
                                Add Email
                              </Button>
                            )}
                            
                            {/* Show Invite button if has email and not invited */}
                            {contact.status === 'unlinked' && contact.email && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleInviteClick(contact)}
                              >
                                Invite
                              </Button>
                            )}
                            
                            {/* Show buttons for pending/accepted invitations */}
                            {(contact.status === 'pending' || contact.status === 'accepted') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendInvite(contact)}
                                  title="Resend invitation"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                              </>
                            )}
                            
                            {/* Show Connected badge if linked */}
                            {contact.status === 'linked' && (
                              <Badge variant="success" size="sm">
                                Connected
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-neutral-600">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                    ? 'No contacts match your filters'
                    : 'No contacts found in your accounting system'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Modal */}
      <Modal
        isOpen={emailModal}
        onClose={() => {
          setEmailModal(false);
          setEmailForm({ contact: null, email: '' });
        }}
        title={`${emailForm.contact?.email ? 'Edit' : 'Add'} Email for ${emailForm.contact?.name || 'Contact'}`}
        description="Enter the email address for this contact to send invitations"
      >
        {emailForm.contact && (
          <div className="space-y-4">
            {/* Contact Info */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-600">Name:</span>
                  <p className="font-medium text-neutral-900">{emailForm.contact.name}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Type:</span>
                  <p className="font-medium text-neutral-900 capitalize">{emailForm.contact.type}</p>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">
                This email will be used to send invitation for system connection
              </p>
            </div>

            {/* Note about custom emails */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-small text-primary-700">
                💡 This email is stored in LedgerLink only and won't change your Xero data
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSaveEmail}
                disabled={savingEmail || !emailForm.email}
                className="flex-1"
              >
                {savingEmail ? 'Saving...' : 'Save Email'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEmailModal(false);
                  setEmailForm({ contact: null, email: '' });
                }}
                disabled={savingEmail}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModal}
        onClose={() => {
          setInviteModal(false);
          setInviteForm({ contact: null, message: '' });
        }}
        title={`Invite ${inviteForm.contact?.name || 'Counterparty'}`}
        description="Send an invitation to connect accounting systems for automated reconciliation"
      >
        {inviteForm.contact && (
          <div className="space-y-4">
            {/* Contact Info */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-600">Name:</span>
                  <p className="font-medium text-neutral-900">{inviteForm.contact.name}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Email:</span>
                  <p className="font-medium text-neutral-900">{inviteForm.contact.email}</p>
                </div>
                <div>
                  <span className="text-neutral-600">Type:</span>
                  <p className="font-medium text-neutral-900 capitalize">{inviteForm.contact.type}</p>
                </div>
                <div>
                  <span className="text-neutral-600">System:</span>
                  <p className="font-medium text-neutral-900">
                    {erpConnections.find(c => c.id === inviteForm.contact?.erpConnectionId)?.platform || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                className="input w-full min-h-[120px]"
                placeholder="Add a personal message to your invitation..."
              />
            </div>

            {/* What Happens Next */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-900 mb-2">What happens next?</h4>
              <ul className="text-small text-primary-700 space-y-1">
                <li>• {inviteForm.contact.name} receives an invitation email with a secure code</li>
                <li>• They can accept and connect their accounting system (read-only)</li>
                <li>• Once connected, invoices are automatically matched between your systems</li>
                <li>• Both parties can view reconciliation results and resolve discrepancies</li>
                <li>• No sensitive financial data is shared between companies</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={handleSendInvite}
                disabled={sending || !inviteForm.contact.email}
                className="flex-1"
              >
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInviteModal(false);
                  setInviteForm({ contact: null, message: '' });
                }}
                disabled={sending}
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
