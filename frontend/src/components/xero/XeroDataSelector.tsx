import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';
import { TransactionRecord } from '../../types/matching';

export interface XeroCustomer {
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

export interface XeroInvoice {
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
  LineAmountTypes: string;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountDue: number;
  AmountPaid: number;
  Reference?: string;
}

export interface XeroDataSelectorProps {
  onDataSelected: (data: {
    invoices: TransactionRecord[];
    customerName: string;
    invoiceCount: number;
  }) => void;
  onError?: (error: string) => void;
}

const XeroDataSelector: React.FC<XeroDataSelectorProps> = ({ onDataSelected, onError }) => {
  const [customers, setCustomers] = useState<XeroCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<XeroCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeHistory, setIncludeHistory] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      console.log('📞 Fetching customers from Xero...');
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('xero/customers');
      console.log('📦 Response received:', response.status, response.data);
      
      // Safely access response data with fallbacks
      const data = response?.data || {};
      const success = data.success !== false; // Assume success if not explicitly false
      const customersList = data.customers || [];
      
      console.log('   Success:', success);
      console.log('   Customers count:', customersList.length);
      
      if (success && Array.isArray(customersList)) {
        setCustomers(customersList);
        
        if (customersList.length === 0) {
          const msg = 'No customers found in your Xero account';
          console.log('⚠️', msg);
          setError(msg);
        }
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch customers');
      }
    } catch (err: any) {
      console.error('❌ Error fetching customers:', err);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.response?.data?.details
        || err.message 
        || 'Failed to load customers from Xero. Please try again.';
      console.error('   Error message:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
      setCustomers([]); // Ensure customers is empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = async (customer: XeroCustomer) => {
    // Safety check
    if (!customer || !customer.ContactID) {
      console.error('❌ Invalid customer selected:', customer);
      return;
    }
    
    try {
      console.log('📞 Fetching invoices for customer:', customer.Name);
      setLoading(true);
      setError(null);
      setSelectedCustomer(customer);
      
      // Fetch invoices for the selected customer
      const response = await apiClient.get(`xero/customers/${customer.ContactID}/invoices`, {
        params: { includeHistory: includeHistory ? 'true' : 'false' }
      });
      
      console.log('📦 Invoices response:', response.status, response.data);
      
      // Safely access response data
      const data = response?.data || {};
      const success = data.success !== false;
      const invoicesList = data.invoices || [];
      
      if (success && Array.isArray(invoicesList)) {
        console.log('   Invoices found:', invoicesList.length);
        
        // FIXED: Transform Xero invoices to match TransactionRecord interface (camelCase properties)
        const transformedInvoices: TransactionRecord[] = invoicesList.map((invoice: XeroInvoice) => {
          console.log('   🔍 DIAGNOSTIC: Transforming invoice:', invoice.InvoiceNumber || 'NO_NUMBER', {
            InvoiceID: invoice.InvoiceID || 'NO_ID',
            Total: invoice.Total || 0
          });
          
          // Create properly formatted TransactionRecord with camelCase properties
          return {
            // Required fields matching TransactionRecord interface
            transactionNumber: invoice.InvoiceNumber || '',  // FIXED: Changed from transaction_number
            amount: invoice.Total || 0,
            date: invoice.Date || '',  // FIXED: Changed from issue_date
            
            // Optional fields
            dueDate: invoice.DueDate || '',  // FIXED: Changed from due_date
            status: invoice.Status || '',
            reference: invoice.Reference || '',
            type: invoice.Type === 'ACCREC' ? 'Invoice' : 'Credit Note',  // FIXED: Changed from transaction_type
            vendor: invoice.Contact?.Name || customer.Name,  // FIXED: Changed from contact_name to vendor
            
            // Additional metadata fields (allowed by [key: string]: any in TransactionRecord)
            xeroId: invoice.InvoiceID || '',  // FIXED: Changed from xero_id to xeroId
            source: 'xero' as const,
            contactName: invoice.Contact?.Name || customer.Name,  // Keep contact name as additional field
          };
        });
        
        console.log('✅ Transformed invoices:', transformedInvoices.length);
        console.log('   🔍 DIAGNOSTIC: First transformed invoice:', transformedInvoices.length > 0 ? JSON.stringify(transformedInvoices[0], null, 2) : 'None');
        
        console.log('   🔍 DIAGNOSTIC: Data being passed to parent:', {
          invoices: transformedInvoices,
          customerName: customer.Name,
          invoiceCount: transformedInvoices.length
        });
        
        onDataSelected({
          invoices: transformedInvoices,
          customerName: customer.Name,
          invoiceCount: transformedInvoices.length
        });
        
        console.log('   ✅ DIAGNOSTIC: onDataSelected called successfully');
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch invoices');
      }
    } catch (err: any) {
      console.error('❌ Error fetching invoices:', err);
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message
        || err.response?.data?.details
        || err.message 
        || 'Failed to load customer invoices. Please try again.';
      console.error('   Error message:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading customers from Xero...</p>
        <p className="text-sm text-neutral-500 mt-2">This may take 30-60 seconds if the server is starting up...</p>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-error-900">Error Loading Customers</p>
              <p className="text-sm text-error-700 mt-1">{error}</p>
              <p className="text-xs text-error-600 mt-2">
                Common causes: Server is waking up (wait 60s and retry), connection issue, or Xero API error.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCustomers}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-h3 font-semibold text-neutral-900 mb-2">No Customers Found</h3>
        <p className="text-body text-neutral-600 mb-4">
          No customers found in your Xero account. Make sure you have customer contacts set up in Xero.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchCustomers}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* History Toggle */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="includeHistory"
            checked={includeHistory}
            onChange={(e) => setIncludeHistory(e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="includeHistory" className="text-sm font-medium text-neutral-900">
            Include historical invoices (paid, voided)
          </label>
        </div>
        <p className="text-xs text-neutral-600 mt-1 ml-7">
          When enabled, includes all invoices regardless of status. Otherwise, only outstanding invoices are shown.
        </p>
      </div>

      {/* Customer List */}
      <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-96 overflow-y-auto">
        <div className="bg-primary-50 p-3 sticky top-0 z-10">
          <h3 className="text-sm font-semibold text-neutral-900">Select a Customer</h3>
          <p className="text-xs text-neutral-600 mt-1">
            Choose a customer to load their invoice data for matching
          </p>
        </div>
        
        {customers.map((customer) => {
          // Safety check for customer data
          if (!customer || !customer.ContactID) {
            return null;
          }
          
          return (
            <button
              key={customer.ContactID}
              onClick={() => handleCustomerSelect(customer)}
              disabled={loading}
              className={`w-full text-left p-4 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedCustomer?.ContactID === customer.ContactID ? 'bg-primary-100' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {customer.Name || 'Unknown Customer'}
                  </p>
                  {customer.EmailAddress && (
                    <p className="text-xs text-neutral-600 mt-1 truncate">
                      {customer.EmailAddress}
                    </p>
                  )}
                </div>
                {customer.Balances?.AccountsReceivable?.Outstanding !== undefined && (
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className="text-xs text-neutral-600">Outstanding</p>
                    <p className="text-sm font-medium text-neutral-900">
                      ${customer.Balances.AccountsReceivable.Outstanding.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              {selectedCustomer?.ContactID === customer.ContactID && loading && (
                <div className="mt-2 flex items-center text-xs text-primary-600">
                  <svg className="animate-spin h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading invoices...
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && selectedCustomer && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <p className="text-sm text-error-900">{error}</p>
        </div>
      )}
    </div>
  );
};

export default XeroDataSelector;
