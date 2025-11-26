/**
 * ERP Contact Selector Component
 * Allows users to select which contact in their ERP represents the inviting company
 */

import React, { useState, useEffect } from 'react';

interface ERPContact {
  erpConnectionId: string;
  erpType: string;
  erpContactId: string;
  name: string;
  email: string;
  type: 'customer' | 'vendor' | 'both';
  contactNumber?: string;
  accountNumber?: string;
  metadata?: any;
}

interface ERPConnection {
  id: string;
  platform: string;
  name: string;
  status: string;
}

interface InvitationInfo {
  senderCompany: {
    name: string;
    email: string;
  };
  relationshipType: string;
  message?: string;
}

interface ERPContactSelectorProps {
  inviteCode: string;
  onContactSelected: (erpConnectionId: string, erpContactId: string) => void;
  onCancel: () => void;
}

export const ERPContactSelector: React.FC<ERPContactSelectorProps> = ({
  inviteCode,
  onContactSelected,
  onCancel
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [contacts, setContacts] = useState<ERPContact[]>([]);
  const [erpConnections, setErpConnections] = useState<ERPConnection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableContacts();
  }, [inviteCode]);

  const fetchAvailableContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/counterparty/invite/${inviteCode}/available-contacts`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contacts');
      }

      const data = await response.json();
      
      if (data.requiresCompanySetup) {
        setError('Please set up your company profile first');
        return;
      }

      if (data.requiresErpConnection) {
        setError('Please connect your accounting system first');
        return;
      }

      setInvitation(data.invitation);
      setContacts(data.availableContacts || []);
      setErpConnections(data.erpConnections || []);
      
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: ERPContact) => {
    setSelectedContactId(contact.erpContactId);
  };

  const handleConfirm = () => {
    const selectedContact = contacts.find(c => c.erpContactId === selectedContactId);
    if (selectedContact) {
      onContactSelected(selectedContact.erpConnectionId, selectedContact.erpContactId);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-600">Loading your contacts...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-error-900 mb-2">Setup Required</h3>
        <p className="text-error-700 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="bg-error-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-error-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Link to Your Accounting System
        </h2>
        <p className="text-neutral-600">
          Which contact in your {erpConnections[0]?.platform} represents{' '}
          <span className="font-semibold text-neutral-900">
            {invitation?.senderCompany.name}
          </span>?
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email, or account number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Contacts List */}
      <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-96 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 text-neutral-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-neutral-600 mb-2">
              {searchTerm ? 'No contacts match your search' : 'No contacts found'}
            </p>
            <p className="text-sm text-neutral-500">
              You may need to add {invitation?.senderCompany.name} to your {erpConnections[0]?.platform} first.
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.erpContactId}
              onClick={() => handleContactSelect(contact)}
              className={`
                p-4 cursor-pointer transition-colors hover:bg-primary-50
                ${selectedContactId === contact.erpContactId ? 'bg-primary-100 border-l-4 border-primary-600' : ''}
              `}
            >
              <div className="flex items-start">
                {/* Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedContactId === contact.erpContactId
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-neutral-300'
                      }
                    `}
                  >
                    {selectedContactId === contact.erpContactId && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="ml-3 flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {contact.name}
                      </h3>
                      {contact.email && (
                        <p className="text-sm text-neutral-600">{contact.email}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`
                          inline-block px-2 py-1 text-xs font-medium rounded
                          ${contact.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                            contact.type === 'vendor' ? 'bg-purple-100 text-purple-800' :
                            'bg-neutral-100 text-neutral-800'}
                        `}
                      >
                        {contact.type === 'customer' ? 'Customer' :
                         contact.type === 'vendor' ? 'Vendor' : 'Both'}
                      </span>
                      {contact.accountNumber && (
                        <span className="text-xs text-neutral-500">
                          #{contact.accountNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {contact.contactNumber && (
                    <p className="text-sm text-neutral-500 mt-1">
                      {contact.contactNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Why do I need to select a contact?</p>
            <p>
              This links the invitation to the specific {invitation?.relationshipType === 'customer' ? 'customer' : 'vendor'} entry
              in your accounting system, enabling automatic invoice matching.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-neutral-100 text-neutral-700 py-3 px-6 rounded-lg font-semibold hover:bg-neutral-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedContactId}
          className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm & Accept Invitation
        </button>
      </div>
    </div>
  );
};

export default ERPContactSelector;
