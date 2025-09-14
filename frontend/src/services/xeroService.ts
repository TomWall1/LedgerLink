/**
 * Xero Frontend Service
 * Handles all Xero API calls from the frontend
 */

import { apiClient } from './api';

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
      const response = await apiClient.get(`/xero/auth`, {
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
      
      const response = await apiClient.get('/xero/connections', { params });
      
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
      const response = await apiClient.delete(`/xero/connections/${connectionId}`);
      
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
      const response = await apiClient.get(`/xero/health/${connectionId}`);
      
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
   * Get invoices from Xero
   */
  async getInvoices(params: {
    connectionId: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<{ invoices: XeroInvoice[]; pagination: any }> {
    try {
      const response = await apiClient.get('/xero/invoices', {
        params: {
          page: 1,
          limit: 100,
          ...params
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch Xero invoices:', error);
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
      const response = await apiClient.get('/xero/contacts', {
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
      const response = await apiClient.post('/xero/sync', {
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