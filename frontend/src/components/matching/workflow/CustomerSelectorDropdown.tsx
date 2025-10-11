/**
 * CustomerSelectorDropdown Component
 * 
 * Shows a dropdown of Xero customers/suppliers when Xero is selected as data source
 * Includes a "Load Data" button to fetch invoices
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { apiClient } from '../../../services/api';

interface Customer {
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
  onLoadData: (data: { 
    invoices: any[];
    customerName: string;
    invoiceCount: number;
  }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const CustomerSelectorDropdown: React.FC<CustomerSelectorDropdownProps> = ({
  onLoadData,
  onError,
  disabled = false,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        console.log('📞 Fetching customers from Xero...');
        
        // Use the same endpoint as XeroDataSelector
        const response = await apiClient.get('xero/customers');
        console.log('📦 Response received:', response.status, response.data);
        
        // Safely access response data
        const data = response?.data || {};
        const success = data.success !== false;
        const customersList = data.customers || [];
        
        console.log('   Success:', success);
        console.log('   Customers count:', customersList.length);
        
        if (success && Array.isArray(customersList)) {
          setCustomers(customersList);
          
          if (customersList.length === 0) {
            console.log('⚠️ No customers found in Xero account');
          }
        } else {
          throw new Error(data.error || data.message || 'Failed to fetch customers');
        }
      } catch (error: any) {
        console.error('❌ Error fetching customers:', error);
        const errorMessage = error.response?.data?.error 
          || error.response?.data?.message 
          || error.response?.data?.details
          || error.message 
          || 'Failed to load customers from Xero. Please try again.';
        console.error('   Error message:', errorMessage);
        onError(errorMessage);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [onError]);

  const handleLoadData = async () => {
    if (!selectedCustomer) return;

    try {
      console.log('📞 Fetching invoices for customer:', selectedCustomer.Name);
      setLoadingData(true);
      
      // Fetch invoices for the selected customer - same endpoint as XeroDataSelector
      const response = await apiClient.get(`xero/customers/${selectedCustomer.ContactID}/invoices`, {
        params: { includeHistory: 'false' }
      });
      
      console.log('📦 Invoices response:', response.status, response.data);
      
      const data = response?.data || {};
      const success = data.success !== false;
      const invoicesList = data.invoices || [];
      
      if (success && Array.isArray(invoicesList)) {
        console.log('   Invoices found:', invoicesList.length);
        
        // FIXED: Transform Xero invoices to TransactionRecord format using camelCase
        // This matches the TypeScript interface defined in frontend/src/types/matching.ts
        const transformedInvoices = invoicesList
          .map((invoice: XeroInvoice, index: number) => {
            // Skip if invoice is null or undefined
            if (!invoice) {
              console.warn(`⚠️ Skipping null/undefined invoice at index ${index}`);
              return null;
            }

            // CRITICAL FIX: Use camelCase property names to match TransactionRecord interface
            const transformed = {
              id: invoice.InvoiceID || invoice.InvoiceNumber || `INV-${Date.now()}-${index}`,
              transactionNumber: invoice.InvoiceNumber || '',  // ← FIXED: camelCase
              type: invoice.Type === 'ACCREC' ? 'Invoice' : 'Credit Note',  // ← FIXED: camelCase
              amount: invoice.Total || 0,
              date: invoice.Date || '',  // ← FIXED: camelCase (was issue_date)
              dueDate: invoice.DueDate || '',  // ← FIXED: camelCase
              status: invoice.Status || '',
              reference: invoice.Reference || '',
              vendor: invoice.Contact?.Name || selectedCustomer.Name,  // ← FIXED: camelCase
              xeroId: invoice.InvoiceID || '',  // ← FIXED: camelCase
              source: 'xero' as const
            };
            
            console.log(`   ✅ Transformed invoice ${index + 1}:`, JSON.stringify(transformed, null, 2));
            return transformed;
          })
          .filter((invoice): invoice is NonNullable<typeof invoice> => {
            // Filter out any null/undefined invoices and ensure 'id' exists
            if (!invoice) return false;
            if (!invoice.id) {
              console.warn('⚠️ Filtering out invoice without id:', invoice);
              return false;
            }
            return true;
          });
        
        console.log('✅ Transformed invoices:', transformedInvoices.length);
        
        // Final validation: Ensure all invoices have required fields (using camelCase)
        const validInvoices = transformedInvoices.filter(invoice => 
          invoice && 
          invoice.id && 
          typeof invoice.transactionNumber !== 'undefined' &&  // ← FIXED: camelCase
          typeof invoice.amount !== 'undefined' &&
          typeof invoice.date !== 'undefined'  // ← FIXED: camelCase
        );

        if (validInvoices.length !== transformedInvoices.length) {
          console.warn(`⚠️ Filtered ${transformedInvoices.length - validInvoices.length} invalid invoices`);
        }
        
        const dataToPass = {
          invoices: validInvoices,
          customerName: selectedCustomer.Name,
          invoiceCount: validInvoices.length
        };
        
        console.log('   📤 Passing data to parent:', {
          invoiceCount: dataToPass.invoiceCount,
          customerName: dataToPass.customerName,
          sampleInvoice: dataToPass.invoices[0]
        });
        
        onLoadData(dataToPass);
        
        console.log('   ✅ onLoadData called successfully');
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch invoices');
      }
    } catch (error: any) {
      console.error('❌ Error loading customer data:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to load customer invoices. ';
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-body text-neutral-600">Loading customers...</span>
        <p className="text-xs text-neutral-500 mt-2">If this is your first request, the server may need 30-60 seconds to wake up...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-4 bg-warning-50 border border-warning-200 rounded-md">
        <p className="text-small text-warning-900">
          No customers found in your Xero account. Please add customers in Xero first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-body font-medium text-neutral-900 mb-1 block">
          Select Customer/Supplier
        </label>
        <p className="text-small text-neutral-600 mb-3">
          Choose which customer's invoices you want to load
        </p>
      </div>

      <select
        value={selectedCustomer?.ContactID || ''}
        onChange={(e) => {
          const customer = customers.find(c => c.ContactID === e.target.value);
          setSelectedCustomer(customer || null);
        }}
        disabled={disabled || loading}
        className={`
          w-full px-4 py-2.5 rounded-md border border-neutral-200 
          bg-white text-body text-neutral-900
          focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-short
          ${!selectedCustomer ? 'text-neutral-400' : ''}
        `}
      >
        <option value="">Choose a customer...</option>
        {customers.map((customer) => (
          <option key={customer.ContactID} value={customer.ContactID}>
            {customer.Name}
            {customer.EmailAddress ? ` (${customer.EmailAddress})` : ''}
          </option>
        ))}
      </select>

      <Button
        variant="primary"
        onClick={handleLoadData}
        disabled={!selectedCustomer || disabled || loadingData}
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
      {selectedCustomer && !loadingData && (
        <div className="text-xs text-neutral-500 mt-2">
          💡 Tip: If the first request fails, wait 30-60 seconds for the backend to wake up, then try again.
        </div>
      )}
    </div>
  );
};

export default CustomerSelectorDropdown;
