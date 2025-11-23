/**
 * Xero Frontend Service
 * Handles all Xero API calls from the frontend
 */

import { apiClient } from './api';
import { TransactionRecord } from '../types/matching';

export interface XeroConnection {
  _id: string;
  tenantId: string;
  tenantName: string;
  tenantType: 'ORGANISATION' | 'PRACTICE';
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastSyncAt: string;
  lastSyncStatus: 'success' | 'error' | 'partial';
  settings?: {
    baseCurrency: string;
    countryCode: string;
    timezone: string;
    shortCode: string;
    organisationType: string;
  };
  dataCounts?: {
    invoices: number;
    contacts: number;
    lastUpdated: string;
  };
  syncErrors?: Array<{
    type: string;
    timestamp: string;
  }>;
}

export interface XeroInvoice {
  transaction_number: string;
  transaction_type: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  reference: string;
  contact_name: string;
  xero_id: string;
  source: 'xero';
}

export interface XeroContact {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
  ContactStatus: string;
  IsCustomer?: boolean;
  IsSupplier?: boolean;
  Addresses?: Array<any>;
  Phones?: Array<any>;
}

export interface XeroConnectionHealth {
  connectionId: string;
  tenantName: string;
  status: string;
  isExpired: boolean;
  lastSyncAt: string;
  lastSyncStatus: string;
  apiConnectivity: 'ok' | 'error';
  apiError?: string;
  recentErrors?: Array<{
    type: string;
    timestamp: string;
  }>;
}

class XeroService {
  /**
   * Initiate Xero OAuth connection
   */
  async initiateConnection(companyId: string): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await apiClient.get(`xero/auth`, {
        params: { companyId }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate Xero connection');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to initiate Xero connection:', error);
      throw new Error(error.response?.data?.message || 'Failed to start Xero connection');
    }
  }
  
  /**
   * Get all Xero connections for the user
   */
  async getConnections(companyId?: string): Promise<XeroConnection[]> {
    try {
      const params: any = {};
      if (companyId) params.companyId = companyId;
      
      const response = await apiClient.get('xero/connections', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch Xero connections');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch Xero connections:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch connections');
    }
  }
  
  /**
   * Disconnect a Xero connection
   */
  async disconnectConnection(connectionId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`xero/connections/${connectionId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to disconnect Xero');
      }
    } catch (error: any) {
      console.error('Failed to disconnect Xero:', error);
      throw new Error(error.response?.data?.message || 'Failed to disconnect connection');
    }
  }
  
  /**
   * Check connection health
   */
  async checkConnectionHealth(connectionId: string): Promise<XeroConnectionHealth> {
    try {
      const response = await apiClient.get(`xero/health/${connectionId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check connection health');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to check connection health:', error);
      throw new Error(error.response?.data?.message || 'Failed to check connection');
    }
  }
  
  /**
   * Get Xero customers (contacts marked as customers)
   */
  async getCustomers(connectionId: string): Promise<XeroContact[]> {
    try {
      console.log('🔍 [xeroService] Fetching Xero customers for connection:', connectionId);
      const response = await apiClient.get('xero/customers', {
        params: { connectionId }
      });
      
      console.log('📦 [xeroService] Raw response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasCustomers: !!response.data.data?.customers
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch customers');
      }
      
      // Handle the nested data structure properly
      const customers = response.data.data?.customers || [];
      console.log('✅ [xeroService] Customers fetched:', customers.length);
      return customers;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch Xero customers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
  
  /**
   * Get Xero suppliers (contacts marked as suppliers)
   * NEW: Added to fetch suppliers for AP matching
   */
  async getSuppliers(connectionId: string): Promise<XeroContact[]> {
    try {
      console.log('🔍 [xeroService] Fetching Xero suppliers for connection:', connectionId);
      const response = await apiClient.get('xero/suppliers', {
        params: { connectionId }
      });
      
      console.log('📦 [xeroService] Raw response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasSuppliers: !!response.data.data?.suppliers
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch suppliers');
      }
      
      // Handle the nested data structure properly
      const suppliers = response.data.data?.suppliers || [];
      console.log('✅ [xeroService] Suppliers fetched:', suppliers.length);
      return suppliers;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch Xero suppliers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch suppliers');
    }
  }
  
  /**
   * Get invoices for a specific customer
   * NEW: Fetches only the selected customer's invoices (not all invoices)
   */
  async getCustomerInvoices(connectionId: string, contactId: string): Promise<TransactionRecord[]> {
    try {
      console.log('🔍 [xeroService] Fetching invoices for customer:', { connectionId, contactId });
      
      const response = await apiClient.get(`xero/customers/${contactId}/invoices`, {
        params: { connectionId }
      });
      
      console.log('📦 [xeroService] Customer invoices response:', {
        success: response.data.success,
        hasInvoices: !!response.data.invoices,
        count: response.data.invoices?.length
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch customer invoices');
      }
      
      const invoices = response.data.invoices || [];
      
      // Transform to TransactionRecord format
      const transformed = invoices.map((invoice: any, index: number) => {
        const id = invoice.xero_id || invoice.transaction_number || `TEMP-${Date.now()}-${index}`;
        
        return {
          id: String(id),
          transaction_number: invoice.transaction_number || '',
          transaction_type: invoice.transaction_type || 'ACCREC',
          amount: invoice.amount || 0,
          issue_date: invoice.issue_date || '',
          due_date: invoice.due_date || '',
          status: invoice.status || '',
          reference: invoice.reference || '',
          contact_name: invoice.contact_name || '',
          xero_id: invoice.xero_id || '',
          source: 'xero' as const
        };
      });
      
      console.log('✅ [xeroService] Successfully fetched customer invoices:', transformed.length);
      return transformed;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch customer invoices:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customer invoices');
    }
  }
  
  /**
   * Get invoices (bills) for a specific supplier
   * NEW: Fetches only the selected supplier's bills (not all invoices)
   */
  async getSupplierInvoices(connectionId: string, contactId: string): Promise<TransactionRecord[]> {
    try {
      console.log('🔍 [xeroService] Fetching bills for supplier:', { connectionId, contactId });
      
      const response = await apiClient.get(`xero/suppliers/${contactId}/invoices`, {
        params: { connectionId }
      });
      
      console.log('📦 [xeroService] Supplier bills response:', {
        success: response.data.success,
        hasInvoices: !!response.data.invoices,
        count: response.data.invoices?.length
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch supplier invoices');
      }
      
      const invoices = response.data.invoices || [];
      
      // Transform to TransactionRecord format
      const transformed = invoices.map((invoice: any, index: number) => {
        const id = invoice.xero_id || invoice.transaction_number || `TEMP-${Date.now()}-${index}`;
        
        return {
          id: String(id),
          transaction_number: invoice.transaction_number || '',
          transaction_type: invoice.transaction_type || 'ACCPAY',
          amount: invoice.amount || 0,
          issue_date: invoice.issue_date || '',
          due_date: invoice.due_date || '',
          status: invoice.status || '',
          reference: invoice.reference || '',
          contact_name: invoice.contact_name || '',
          xero_id: invoice.xero_id || '',
          source: 'xero' as const
        };
      });
      
      console.log('✅ [xeroService] Successfully fetched supplier bills:', transformed.length);
      return transformed;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch supplier invoices:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch supplier invoices');
    }
  }
  
  /**
   * Get invoices from Xero (legacy method - kept for compatibility)
   * @deprecated Use getCustomerInvoices or getSupplierInvoices instead
   */
  async getInvoices(params: {
    connectionId: string;
    contactId?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<{ invoices: TransactionRecord[]; pagination: any }> {
    try {
      console.log('🔍 [xeroService] Fetching invoices:', params);
      
      const queryParams: any = {
        connectionId: params.connectionId,
        page: params.page || 1,
        limit: params.limit || 50
      };
      
      // Add optional filters
      if (params.contactId) queryParams.contactId = params.contactId;
      if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
      if (params.dateTo) queryParams.dateTo = params.dateTo;
      if (params.status) queryParams.status = params.status;
      
      const response = await apiClient.get('xero/invoices', {
        params: queryParams
      });
      
      console.log('📦 [xeroService] Invoices response status:', response.status);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
      
      const invoices = response.data.data?.invoices || [];
      const pagination = response.data.data?.pagination || { page: 1, limit: 50, total: 0 };
      
      // Transform to TransactionRecord format
      const transformed = invoices.map((invoice: any, index: number) => {
        const id = invoice.xero_id || invoice.transaction_number || `TEMP-${Date.now()}-${index}`;
        
        return {
          id: String(id),
          transaction_number: invoice.transaction_number || '',
          transaction_type: invoice.transaction_type || 'ACCREC',
          amount: invoice.amount || 0,
          issue_date: invoice.issue_date || '',
          due_date: invoice.due_date || '',
          status: invoice.status || '',
          reference: invoice.reference || '',
          contact_name: invoice.contact_name || '',
          xero_id: invoice.xero_id || '',
          source: 'xero' as const
        };
      });
      
      return { invoices: transformed, pagination };
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch invoices:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch invoices');
    }
  }
  
  /**
   * Get contacts from Xero
   */
  async getContacts(params: {
    connectionId: string;
    page?: number;
    limit?: number;
  }): Promise<{ contacts: XeroContact[]; pagination: any }> {
    try {
      const response = await apiClient.get('xero/contacts', {
        params: {
          page: 1,
          limit: 100,
          ...params
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch contacts');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch Xero contacts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch contacts');
    }
  }
  
  /**
   * Trigger manual sync
   */
  async syncConnection(connectionId: string): Promise<{ lastSyncAt: string; status: string }> {
    try {
      const response = await apiClient.post('xero/sync', {
        connectionId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to sync connection');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to sync Xero connection:', error);
      throw new Error(error.response?.data?.message || 'Failed to sync connection');
    }
  }
  
  /**
   * Handle OAuth callback redirect
   */
  handleOAuthCallback(): { success: boolean; error?: string; connected?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success') === 'true';
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    const connected = urlParams.get('connected');
    
    // Clean up URL
    if (urlParams.has('success') || urlParams.has('error')) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    return {
      success,
      error: error ? decodeURIComponent(message || error) : undefined,
      connected: connected ? decodeURIComponent(connected) : undefined
    };
  }
  
  /**
   * Format currency amount
   */
  formatAmount(amount: number, currency?: string): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
    
    return currency ? `${currency} ${formatted}` : formatted;
  }
  
  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return dateString;
    }
  }
  
  /**
   * Get status badge color
   */
  getStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status.toLowerCase()) {
      case 'active':
      case 'paid':
      case 'success':
        return 'success';
      case 'open':
      case 'pending':
      case 'authorised':
        return 'warning';
      case 'expired':
      case 'revoked':
      case 'error':
      case 'void':
        return 'error';
      default:
        return 'default';
    }
  }
  
  /**
   * Get connection status display text
   */
  getConnectionStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'Connected',
      expired: 'Expired - Reconnect Required',
      revoked: 'Disconnected',
      error: 'Connection Error'
    };
    
    return statusMap[status] || status;
  }
}

// Export singleton instance
export const xeroService = new XeroService();
export default xeroService;
