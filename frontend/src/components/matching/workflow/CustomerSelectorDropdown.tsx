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
  ContactNumber?: string;
  EmailAddress?: string;
  ContactStatus?: string;
}

interface CustomerSelectorDropdownProps {
  onLoadData: (customer: Customer) => void;
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
            onError('No customers found in your Xero account. Please add customers in Xero first.');
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
        setCustomers([]); // Ensure customers is empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [onError]);

  const handleLoadData = async () => {
    if (!selectedCustomer) return;

    setLoadingData(true);
    try {
      await onLoadData(selectedCustomer);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-body text-neutral-600">Loading customers...</span>
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
    </div>
  );
};

export default CustomerSelectorDropdown;
