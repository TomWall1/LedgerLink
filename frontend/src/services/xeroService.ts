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
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch customers');
      }
      
      const customers = response.data.data?.customers || response.data.customers || [];
      console.log('✅ [xeroService] Customers fetched:', customers.length);
      return customers;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch Xero customers:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
  
  /**
   * Get invoices from Xero
   * @param params - Query parameters for filtering invoices
   * @param params.connectionId - Required: The Xero connection ID
   * @param params.contactId - Optional: Filter by specific contact/customer
   * @param params.page - Optional: Page number for pagination
   * @param params.limit - Optional: Number of results per page
   * @param params.dateFrom - Optional: Filter invoices from this date
   * @param params.dateTo - Optional: Filter invoices to this date
   * @param params.status - Optional: Filter by invoice status
   */
  async getInvoices(params: {
    connectionId: string;
    contactId?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<TransactionRecord[]> {
    try {
      console.log('🔍 [xeroService] Fetching invoices for customer:', params);
      
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
      console.log('📦 [xeroService] Response data structure:', {
        success: response.data.success,
        hasInvoices: !!response.data.data?.invoices,
        invoicesLength: response.data.data?.invoices?.length
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
      
      const invoices = response.data.data?.invoices || [];
      console.log('📊 [xeroService] Raw invoices from API:', invoices.length);
      
      // Handle empty invoices array
      if (invoices.length === 0) {
        console.log('ℹ️ [xeroService] No invoices found for this customer');
        return [];
      }
      
      // Log the first raw invoice to see its structure
      if (invoices.length > 0) {
        console.log('📋 [xeroService] First raw invoice structure:', {
          InvoiceID: invoices[0].InvoiceID,
          InvoiceNumber: invoices[0].InvoiceNumber,
          Type: invoices[0].Type,
          Total: invoices[0].Total,
          Status: invoices[0].Status,
          hasContact: !!invoices[0].Contact
        });
      }
      
      // Transform Xero invoices to TransactionRecord format with robust error handling
      const transformed = invoices.map((invoice: any, index: number) => {
        try {
          // Generate a unique ID - use InvoiceID first, then InvoiceNumber, finally a fallback
          const id = invoice.InvoiceID || invoice.InvoiceNumber || `TEMP-${Date.now()}-${index}`;
          
          if (!id) {
            console.warn(`⚠️ [xeroService] Invoice ${index} has no ID, using fallback`);
          }
          
          const transformedInvoice: TransactionRecord = {
            id: String(id), // Ensure it's a string
            transaction_number: String(invoice.InvoiceNumber || invoice.InvoiceID || ''),
            transaction_type: invoice.Type || 'ACCREC',
            amount: parseFloat(invoice.Total) || 0,
            issue_date: invoice.Date || invoice.DateString || '',
            due_date: invoice.DueDate || invoice.DueDateString || '',
            status: invoice.Status || '',
            reference: invoice.Reference || '',
            contact_name: invoice.Contact?.Name || '',
            xero_id: invoice.InvoiceID || '',
            source: 'xero' as const
          };
          
          // Log only the first transformed invoice to avoid spam
          if (index === 0) {
            console.log(`✅ [xeroService] Transformed first invoice:`, {
              id: transformedInvoice.id,
              transaction_number: transformedInvoice.transaction_number,
              amount: transformedInvoice.amount,
              status: transformedInvoice.status
            });
          }
          
          return transformedInvoice;
        } catch (transformError) {
          console.error(`❌ [xeroService] Error transforming invoice ${index}:`, transformError);
          // Return a minimal valid record to prevent complete failure
          return {
            id: `ERROR-${Date.now()}-${index}`,
            transaction_number: 'ERROR',
            transaction_type: 'ACCREC',
            amount: 0,
            issue_date: '',
            due_date: '',
            status: 'ERROR',
            reference: 'Error processing invoice',
            contact_name: '',
            xero_id: '',
            source: 'xero' as const
          };
        }
      });
      
      console.log('✅ [xeroService] Successfully transformed invoices:', transformed.length);
      
      // Validate that all invoices have an id
      const invalidInvoices = transformed.filter(inv => !inv.id);
      if (invalidInvoices.length > 0) {
        console.error('❌ [xeroService] Found invoices without ID:', invalidInvoices.length);
      }
      
      return transformed;
    } catch (error: any) {
      console.error('❌ [xeroService] Failed to fetch customer invoices:', error);
      console.error('❌ [xeroService] Error details:', {
        message: error.message,
        response: error.response?.data
      });
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
