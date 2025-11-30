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

  const handleCancelInvite = async (contact: ERPContact) => {
    if (!contact.inviteId) return;

    // Confirm cancellation
    if (!confirm(`Are you sure you want to cancel the invitation for ${contact.name}? This will allow you to send a fresh invitation.`)) {
      return;
    }

    try {
      await apiClient.post(`/counterparty/invite/${contact.inviteId}/cancel`);

      // Refresh the contacts list
      await fetchERPContacts();
      
      alert('Invitation cancelled successfully! You can now send a new invitation.');
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      alert(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };