/**
 * CustomerSelectorDropdown Component
 * 
 * Shows a dropdown of Xero customers/suppliers when Xero is selected as data source
 * Includes a "Load Data" button to fetch invoices
 * 
 * FIX: Now supports both AR (customers) and AP (suppliers) matching
 * FIX: Added connectionId parameter to prevent infinite loop
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { apiClient } from '../../../services/api';

interface Contact {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
  ContactStatus: string;
  Balances?: {
    AccountsReceivable?: {
      Outstanding?: number;
    };
  };
}

interface XeroConnection {
  _id: string;
  tenantId: string;
  tenantName: string;
  status: string;
  createdAt: string;
}

interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: string;
  Contact: {
    ContactID: string;
    Name: string;
  };
  Date: string;
  DueDate: string;
  Status: string;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountDue: number;
  AmountPaid: number;
  Reference?: string;
}

interface CustomerSelectorDropdownProps {
  ledgerType: 'AR' | 'AP' | null;  // NEW: Now knows which type to fetch
  onLoadData: (data: { 
    invoices: any[];
    customerName: string;
    invoiceCount: number;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const CustomerSelectorDropdown: React.FC<CustomerSelectorDropdownProps> = ({
  ledgerType,
  onLoadData,
  onError,
  disabled = false,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // NEW: Connection management state
  const [connections, setConnections] = useState<XeroConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Determine labels based on ledger type
  const isAR = ledgerType === 'AR';
  const contactLabel = isAR ? 'Customer' : 'Supplier';
  const contactsLabel = isAR ? 'Customers' : 'Suppliers';
  const invoiceLabel = isAR ? 'invoices' : 'bills';

  /**
   * NEW: Fetch available Xero connections on component mount
   */
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoadingConnections(true);
        console.log('🔍 Fetching Xero connections...');
        
        const response = await apiClient.get('xero/connections');
        const connectionsList = response?.data?.data || [];
        
        console.log(`✅ Found ${connectionsList.length} Xero connection(s)`);
        setConnections(connectionsList);
        
        // Auto-select first active connection
        const activeConnection = connectionsList.find((c: XeroConnection) => c.status === 'active');
        if (activeConnection) {
          console.log(`🎯 Auto-selected connection: ${activeConnection.tenantName}`);
          setSelectedConnectionId(activeConnection._id);
        } else {
          console.log('⚠️ No active connections found');
        }
      } catch (error: any) {
        console.error('❌ Error fetching Xero connections:', error);
        onError('Failed to load Xero connections. Please check your connection in the Connections tab.');
        setConnections([]);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [onError]);

  useEffect(() => {
    const fetchContacts = async () => {
      // Don't fetch if ledger type is not set
      if (!ledgerType) {
        console.log('⏸️ Ledger type not set, skipping contact fetch');
        setLoading(false);
        return;
      }

      // NEW: Don't fetch if we don't have a connection
      if (!selectedConnectionId) {
        console.log('⏸️ No connection selected, skipping contact fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`📞 Fetching ${contactsLabel.toLowerCase()} from Xero for ${ledgerType}...`);
        
        // FIX: Use different endpoints based on ledger type
        const endpoint = isAR ? 'xero/customers' : 'xero/suppliers';
        const responseKey = isAR ? 'customers' : 'suppliers';
        
        console.log(`   Using endpoint: ${endpoint}`);
        console.log(`   Using connectionId: ${selectedConnectionId}`);
        
        // NEW: Include connectionId in request
        const response = await apiClient.get(endpoint, {
          params: { connectionId: selectedConnectionId }
        });
        console.log('📦 Response received:', response.status, response.data);
        
        // Safely access response data
        const data = response?.data || {};
        const success = data.success !== false;
        const contactsList = data[responseKey] || [];
        
        console.log('   Success:', success);
        console.log(`   ${contactsLabel} count:`, contactsList.length);
        
        if (success && Array.isArray(contactsList)) {
          setContacts(contactsList);
          
          if (contactsList.length === 0) {
            console.log(`⚠️ No ${contactsLabel.toLowerCase()} found in Xero account`);
          }
        } else {
          throw new Error(data.error || data.message || `Failed to fetch ${contactsLabel.toLowerCase()}`);
        }
      } catch (error: any) {
        console.error(`❌ Error fetching ${contactsLabel.toLowerCase()}:`, error);
        const errorMessage = error.response?.data?.error 
          || error.response?.data?.message 
          || error.response?.data?.details
          || error.message 
          || `Failed to load ${contactsLabel.toLowerCase()} from Xero. Please try again.`;
        console.error('   Error message:', errorMessage);
        onError(errorMessage);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [ledgerType, selectedConnectionId, onError, isAR, contactsLabel]); // NEW: Added selectedConnectionId to dependencies

  const handleLoadData = async () => {
    if (!selectedContact || !ledgerType) return;

    // NEW: Validate connectionId exists
    if (!selectedConnectionId) {
      onError('No Xero connection available. Please reconnect in the Connections tab.');
      return;
    }

    try {
      console.log(`📞 Fetching ${invoiceLabel} for ${contactLabel.toLowerCase()}:`, selectedContact.Name);
      console.log(`   Using connectionId: ${selectedConnectionId}`);
      setLoadingData(true);
      
      // FIX: Use different endpoints based on ledger type
      const endpoint = isAR 
        ? `xero/customers/${selectedContact.ContactID}/invoices`
        : `xero/suppliers/${selectedContact.ContactID}/invoices`;
      
      console.log(`   Using endpoint: ${endpoint}`);
      
      // NEW: Include connectionId in request
      const response = await apiClient.get(endpoint, {
        params: { 
          connectionId: selectedConnectionId,
          includeHistory: 'false' 
        }
      });
      
      console.log(`📦 ${invoiceLabel} response:`, response.status, response.data);
      
      const data = response?.data || {};
      const success = data.success !== false;
      const invoicesList = data.invoices || [];
      
      if (success && Array.isArray(invoicesList)) {
        console.log(`   Raw ${invoiceLabel} found:`, invoicesList.length);
        
        // CRITICAL FIX #1: Filter out null/undefined/invalid invoices BEFORE transformation
        const validRawInvoices = invoicesList.filter((invoice, index) => {
          // Check for null/undefined
          if (invoice === null || invoice === undefined) {
            console.warn(`⚠️ Skipping null/undefined invoice at index ${index}`);
            return false;
          }
          // Check that it's actually an object
          if (typeof invoice !== 'object') {
            console.warn(`⚠️ Skipping non-object invoice at index ${index}:`, typeof invoice);
            return false;
          }
          // Check it has at least one identifier
          if (!invoice.InvoiceID && !invoice.InvoiceNumber) {
            console.warn(`⚠️ Skipping invoice without ID or Number at index ${index}`);
            return false;
          }
          return true;
        });

        console.log(`   Valid raw ${invoiceLabel} after null filtering:`, validRawInvoices.length);
        
        if (validRawInvoices.length === 0) {
          throw new Error(`No valid ${invoiceLabel} found in response. Please check your Xero data.`);
        }
        
        // CRITICAL FIX #2: Transform with explicit null checks and error handling
        const transformedInvoices = validRawInvoices
          .map((invoice: XeroInvoice, index: number) => {
            try {
              // Double-check invoice exists (defensive programming)
              if (!invoice) {
                console.warn(`⚠️ Unexpected null invoice at index ${index}`);
                return null;
              }

              // Generate unique ID - MUST NOT be undefined
              const uniqueId = invoice.InvoiceID || invoice.InvoiceNumber || `INV-${Date.now()}-${index}`;
              
              if (!uniqueId || uniqueId === 'undefined') {
                console.error(`❌ Failed to generate valid ID for invoice at index ${index}`);
                return null;
              }

              // CRITICAL FIX: Use camelCase property names to match TransactionRecord interface
              const transformed = {
                id: uniqueId,                                            // ← MUST exist
                transactionNumber: invoice.InvoiceNumber || '',         // ← camelCase
                type: invoice.Type === 'ACCREC' ? 'Invoice' : invoice.Type === 'ACCPAY' ? 'Bill' : 'Credit Note',
                amount: invoice.Total || 0,
                date: invoice.Date || '',                               // ← camelCase
                dueDate: invoice.DueDate || '',                         // ← camelCase
                status: invoice.Status || '',
                reference: invoice.Reference || '',
                vendor: invoice.Contact?.Name || selectedContact.Name, // ← camelCase
                xeroId: invoice.InvoiceID || '',                        // ← camelCase
                source: 'xero' as const
              };
              
              // CRITICAL FIX #3: Validate transformed object before returning
              if (!transformed.id || transformed.id === 'undefined') {
                console.error(`❌ Transformed invoice has invalid id at index ${index}`);
                return null;
              }
              
              console.log(`   ✅ Transformed ${invoiceLabel.slice(0, -1)} ${index + 1}:`, {
                id: transformed.id,
                transactionNumber: transformed.transactionNumber,
                amount: transformed.amount,
                date: transformed.date
              });
              
              return transformed;
            } catch (transformError) {
              console.error(`❌ Error transforming invoice at index ${index}:`, transformError);
              return null;
            }
          })
          .filter((invoice): invoice is NonNullable<typeof invoice> => {
            // CRITICAL FIX #4: Filter out any null results
            if (invoice === null || invoice === undefined) {
              console.warn('⚠️ Filtering out null/undefined transformed invoice');
              return false;
            }
            // Double-check id exists
            if (!invoice.id || invoice.id === 'undefined') {
              console.warn('⚠️ Filtering out invoice with invalid id:', invoice);
              return false;
            }
            return true;
          });
        
        console.log(`   Transformed ${invoiceLabel} count:`, transformedInvoices.length);
        
        // CRITICAL FIX #5: Final validation with explicit checks
        const validInvoices = transformedInvoices.filter((invoice, index) => {
          // Paranoid null check
          if (!invoice) {
            console.warn(`⚠️ Invoice ${index} is null/undefined in final validation`);
            return false;
          }
          
          // Check required id field - CRITICAL
          if (!invoice.id || invoice.id === 'undefined' || invoice.id === 'null') {
            console.warn(`⚠️ Filtering invoice with invalid id at index ${index}:`, invoice.id);
            return false;
          }
          
          // Check other required camelCase fields
          if (invoice.transactionNumber === undefined) {
            console.warn(`⚠️ Filtering invoice without transactionNumber at index ${index}`);
            return false;
          }
          
          if (invoice.amount === undefined) {
            console.warn(`⚠️ Filtering invoice without amount at index ${index}`);
            return false;
          }
          
          if (invoice.date === undefined) {
            console.warn(`⚠️ Filtering invoice without date at index ${index}`);
            return false;
          }
          
          return true;
        });

        if (validInvoices.length !== transformedInvoices.length) {
          console.warn(`⚠️ Filtered ${transformedInvoices.length - validInvoices.length} invalid ${invoiceLabel} in final validation`);
        }
        
        console.log(`   ✅ Final valid ${invoiceLabel} count:`, validInvoices.length);
        
        // CRITICAL FIX #6: Ensure we have at least one valid invoice
        if (validInvoices.length === 0) {
          throw new Error(`No valid ${invoiceLabel} remained after filtering. The data format may be incompatible.`);
        }
        
        // CRITICAL FIX #7: Verify structure of first invoice before sending
        const firstInvoice = validInvoices[0];
        if (!firstInvoice || !firstInvoice.id || firstInvoice.id === 'undefined') {
          console.error('❌ First invoice validation failed:', firstInvoice);
          throw new Error('Invoice data validation failed. Please contact support.');
        }
        
        const dataToPass = {
          invoices: validInvoices,
          customerName: selectedContact.Name,
          invoiceCount: validInvoices.length
        };
        
        console.log('   📤 Passing data to parent:', {
          invoiceCount: dataToPass.invoiceCount,
          customerName: dataToPass.customerName,
          sampleInvoice: {
            id: firstInvoice.id,
            transactionNumber: firstInvoice.transactionNumber,
            amount: firstInvoice.amount,
            date: firstInvoice.date
          }
        });
        
        // CRITICAL FIX #8: Wrap callback in try-catch
        try {
          onLoadData(dataToPass);
          console.log('   ✅ onLoadData called successfully');
        } catch (callbackError) {
          console.error('❌ Error in onLoadData callback:', callbackError);
          throw new Error('Failed to process loaded data. Please try again.');
        }
      } else {
        throw new Error(data.error || data.message || `Failed to fetch ${invoiceLabel}`);
      }
    } catch (error: any) {
      console.error(`❌ Error loading ${contactLabel.toLowerCase()} data:`, error);
      
      // Provide more helpful error messages
      let errorMessage = `Failed to load ${contactLabel.toLowerCase()} ${invoiceLabel}. `;
      
      if (error.response?.status === 500) {
        errorMessage += 'The server encountered an error. This might be because: ' +
                       '(1) Backend is starting up (wait 60s and retry), ' +
                       '(2) Xero connection expired (reconnect in Connections page), ' +
                       'or (3) Xero API issue. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Your Xero connection has expired. Please reconnect in the Connections page.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage += 'Request timed out. The backend might be waking up. Please try again in 30 seconds.';
      } else {
        errorMessage += error.response?.data?.error 
          || error.response?.data?.message
          || error.response?.data?.details
          || error.message 
          || 'Unknown error occurred.';
      }
      
      onError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  // NEW: Updated loading check to include connections loading
  if (loading || loadingConnections) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-body text-neutral-600 mt-3">
          {loadingConnections ? 'Loading connections...' : `Loading ${contactsLabel.toLowerCase()}...`}
        </span>
        <p className="text-xs text-neutral-500 mt-2">If this is your first request, the server may need 30-60 seconds to wake up...</p>
      </div>
    );
  }

  // NEW: Show error if no connections available
  if (!selectedConnectionId && connections.length === 0) {
    return (
      <div className="p-4 bg-warning-50 border border-warning-200 rounded-md">
        <p className="text-small text-warning-900">
          No Xero connections found. Please connect your Xero account in the Connections tab first.
        </p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="p-4 bg-warning-50 border border-warning-200 rounded-md">
        <p className="text-small text-warning-900">
          No {contactsLabel.toLowerCase()} found in your Xero account. Please add {contactsLabel.toLowerCase()} in Xero first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-body font-medium text-neutral-900 mb-1 block">
          Select {contactLabel}
        </label>
        <p className="text-small text-neutral-600 mb-3">
          Choose which {contactLabel.toLowerCase()}'s {invoiceLabel} you want to load
        </p>
      </div>

      <select
        value={selectedContact?.ContactID || ''}
        onChange={(e) => {
          const contact = contacts.find(c => c.ContactID === e.target.value);
          setSelectedContact(contact || null);
        }}
        disabled={disabled || loading}
        className={`
          w-full px-4 py-2.5 rounded-md border border-neutral-200 
          bg-white text-body text-neutral-900
          focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-short
          ${!selectedContact ? 'text-neutral-400' : ''}
        `}
      >
        <option value="">Choose a {contactLabel.toLowerCase()}...</option>
        {contacts.map((contact) => (
          <option key={contact.ContactID} value={contact.ContactID}>
            {contact.Name}
            {contact.EmailAddress ? ` (${contact.EmailAddress})` : ''}
          </option>
        ))}
      </select>

      <Button
        variant="primary"
        onClick={handleLoadData}
        disabled={!selectedContact || disabled || loadingData}
        className="w-full md:w-auto"
      >
        {loadingData ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Data
          </>
        )}
      </Button>
      
      {/* Help text for first-time users */}
      {selectedContact && !loadingData && (
        <div className="text-xs text-neutral-500 mt-2">
          💡 Tip: If the first request fails, wait 30-60 seconds for the backend to wake up, then try again.
        </div>
      )}
    </div>
  );
};

export default CustomerSelectorDropdown;