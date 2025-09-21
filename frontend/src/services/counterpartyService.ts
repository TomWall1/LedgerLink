/**
 * Counterparty Service
 * 
 * This service handles all communication between the frontend and backend
 * for counterparty (business relationship) management. Think of it as the
 * "business directory manager" for your invoice reconciliation partners.
 */

import { apiClient, ApiResponse } from './api';

// Types for counterparty management
export interface CounterpartyContactInfo {
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  taxId?: string;
}

export interface CounterpartyPreferences {
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
  currency?: string;
  timezone?: string;
  notifications?: {
    emailMatches?: boolean;
    emailSummaries?: boolean;
    emailDiscrepancies?: boolean;
  };
}

export interface CounterpartyPermissions {
  canViewMatches?: boolean;
  canRunMatches?: boolean;
  canExportData?: boolean;
  canViewReports?: boolean;
}

export interface CounterpartyStatistics {
  totalTransactions: number;
  totalMatches: number;
  totalAmount: number;
  matchRate: number;
  lastMatchedAt?: string;
  lastActivityAt: string;
}

export interface Counterparty {
  _id: string;
  name: string;
  email: string;
  type: 'customer' | 'vendor';
  status: 'invited' | 'pending' | 'linked' | 'unlinked' | 'suspended';
  primaryUserId?: string;
  primaryCompanyName?: string;
  linkedUserId?: string;
  linkedSystem?: 'xero' | 'quickbooks' | 'csv' | 'manual' | null;
  matchingEnabled: boolean;
  autoMatchingEnabled: boolean;
  statistics: CounterpartyStatistics;
  contactInfo?: CounterpartyContactInfo;
  preferences?: CounterpartyPreferences;
  permissions?: CounterpartyPermissions;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  
  // Virtual fields
  isLinked?: boolean;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

export interface CounterpartySummary {
  total: number;
  linked: number;
  invited: number;
  pending: number;
  unlinked: number;
}

export interface CounterpartyListResponse {
  counterparties: Counterparty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: CounterpartySummary;
}

export interface CounterpartyStatsResponse {
  total: number;
  linked: number;
  invited: number;
  pending: number;
  unlinked: number;
  totalTransactions: number;
  totalMatches: number;
  totalAmount: number;
  averageMatchRate: number;
}

export interface CreateCounterpartyRequest {
  name: string;
  email: string;
  type: 'customer' | 'vendor';
  phone?: string;
  notes?: string;
  matchingEnabled?: boolean;
  autoMatchingEnabled?: boolean;
  preferences?: CounterpartyPreferences;
}

export interface UpdateCounterpartyRequest {
  name?: string;
  phone?: string;
  notes?: string;
  matchingEnabled?: boolean;
  autoMatchingEnabled?: boolean;
  preferences?: CounterpartyPreferences;
  permissions?: CounterpartyPermissions;
  tags?: string[];
}

export interface CounterpartyInvitation {
  id: string;
  name: string;
  type: 'customer' | 'vendor';
  primaryCompany: string;
  primaryUser: {
    name: string;
    email: string;
  };
  expiresAt: string;
  daysUntilExpiry: number;
}

// The base URL of your backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ledgerlink.onrender.com'  // Your production backend
  : 'http://localhost:3002';           // Your local development backend

// Helper function to get authorization headers
const getAuthHeaders = () => ({
  'Authorization': 'Bearer demo_token_123'
});

class CounterpartyService {
  /**
   * Get all counterparties for the authenticated user
   */
  async getCounterparties(options: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<CounterpartyListResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/counterparties?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching counterparties:', error);
      throw error;
    }
  }

  /**
   * Get a specific counterparty by ID
   */
  async getCounterparty(id: string): Promise<{ counterparty: Counterparty; recentMatches: any[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching counterparty:', error);
      throw error;
    }
  }

  /**
   * Create a new counterparty and send invitation
   */
  async createCounterparty(data: CreateCounterpartyRequest): Promise<{ counterparty: Counterparty; invitationUrl: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error creating counterparty:', error);
      throw error;
    }
  }

  /**
   * Update an existing counterparty
   */
  async updateCounterparty(id: string, data: UpdateCounterpartyRequest): Promise<Counterparty> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.counterparty;
    } catch (error) {
      console.error('Error updating counterparty:', error);
      throw error;
    }
  }

  /**
   * Delete (soft delete) a counterparty
   */
  async deleteCounterparty(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting counterparty:', error);
      throw error;
    }
  }

  /**
   * Resend invitation to a counterparty
   */
  async resendInvitation(id: string): Promise<{ invitationUrl: string; expiresAt: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/${id}/resend-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Get counterparty statistics
   */
  async getCounterpartyStats(): Promise<CounterpartyStatsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching counterparty stats:', error);
      throw error;
    }
  }

  /**
   * Search counterparties (for matching operations)
   */
  async searchCounterparties(options: {
    q?: string;
    type?: 'customer' | 'vendor';
    status?: string;
  } = {}): Promise<Counterparty[]> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/counterparties/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error searching counterparties:', error);
      throw error;
    }
  }

  /**
   * Get invitation details by token (public route)
   */
  async getInvitation(token: string): Promise<CounterpartyInvitation> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/invitation/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.invitation;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  }

  /**
   * Accept a counterparty invitation
   */
  async acceptInvitation(token: string): Promise<Counterparty> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/invitation/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.counterparty;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Update counterparty statistics (internal use by matching system)
   */
  async updateCounterpartyStats(id: string, stats: {
    totalTransactions?: number;
    matches?: number;
    totalAmount?: number;
  }): Promise<CounterpartyStatistics> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/counterparties/${id}/update-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(stats)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.statistics;
    } catch (error) {
      console.error('Error updating counterparty stats:', error);
      throw error;
    }
  }
}

// Export a single instance that can be used throughout the app
export const counterpartyService = new CounterpartyService();
export default counterpartyService;