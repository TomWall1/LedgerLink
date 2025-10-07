/**
 * Counterparty Service
 * 
 * Handles API calls related to counterparty management and linked accounts
 */

import { apiClient } from './api';

export interface LinkedCounterparty {
  id: string;
  name: string;
  organizationName?: string;
  connectionType: 'xero' | 'quickbooks' | 'manual';
  email?: string;
  xeroContactId?: string;
  quickbooksCustomerId?: string;
  lastSyncDate?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface CounterpartyRelationship {
  id: string;
  customerId: string;
  customerName: string;
  counterpartyId: string;
  counterparty: LinkedCounterparty;
  relationshipType: 'supplier' | 'customer';
  createdAt: string;
  updatedAt: string;
}

class CounterpartyService {
  /**
   * Check if a customer/contact has a linked counterparty
   * 
   * @param contactId - The Xero contact ID or customer ID
   * @param contactName - The customer/contact name for fallback matching
   * @returns LinkedCounterparty if found, null otherwise
   */
  async getLinkedCounterparty(
    contactId: string,
    contactName: string
  ): Promise<LinkedCounterparty | null> {
    try {
      console.log('🔍 Checking for linked counterparty:', contactName);
      
      const response = await apiClient.get<{
        success: boolean;
        data: LinkedCounterparty | null;
      }>(`/counterparties/linked/${contactId}`);

      if (response.data.success && response.data.data) {
        console.log('✅ Linked counterparty found:', response.data.data.name);
        return response.data.data;
      }

      console.log('ℹ️ No linked counterparty found for:', contactName);
      return null;
    } catch (error: any) {
      // If endpoint doesn't exist yet, return null gracefully
      if (error.response?.status === 404 || error.message?.includes('backend implementation')) {
        console.log('⚠️ Counterparty linking feature not yet implemented in backend');
        return null;
      }
      
      console.error('❌ Error fetching linked counterparty:', error);
      throw new Error('Failed to check for linked counterparty');
    }
  }

  /**
   * Get all counterparty relationships for the current user
   */
  async getCounterpartyRelationships(): Promise<CounterpartyRelationship[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: CounterpartyRelationship[];
      }>('/counterparties/relationships');

      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('backend implementation')) {
        console.log('⚠️ Counterparty relationships feature not yet implemented in backend');
        return [];
      }
      
      console.error('Error fetching counterparty relationships:', error);
      throw new Error('Failed to fetch counterparty relationships');
    }
  }

  /**
   * Create a new counterparty relationship
   */
  async createCounterpartyLink(
    customerId: string,
    customerName: string,
    counterpartyId: string,
    counterpartyName: string,
    relationshipType: 'supplier' | 'customer'
  ): Promise<CounterpartyRelationship> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: CounterpartyRelationship;
      }>('/counterparties/link', {
        customerId,
        customerName,
        counterpartyId,
        counterpartyName,
        relationshipType,
      });

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('backend implementation')) {
        throw new Error('Counterparty linking feature not yet implemented. Please check back later.');
      }
      
      console.error('Error creating counterparty link:', error);
      throw new Error('Failed to create counterparty link');
    }
  }

  /**
   * Remove a counterparty relationship
   */
  async removeCounterpartyLink(relationshipId: string): Promise<void> {
    try {
      await apiClient.delete(`/counterparties/link/${relationshipId}`);
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('backend implementation')) {
        throw new Error('Counterparty linking feature not yet implemented. Please check back later.');
      }
      
      console.error('Error removing counterparty link:', error);
      throw new Error('Failed to remove counterparty link');
    }
  }

  /**
   * Search for potential counterparties by name or email
   */
  async searchCounterparties(query: string): Promise<LinkedCounterparty[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: LinkedCounterparty[];
      }>('/counterparties/search', {
        params: { query },
      });

      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('backend implementation')) {
        console.log('⚠️ Counterparty search feature not yet implemented in backend');
        return [];
      }
      
      console.error('Error searching counterparties:', error);
      throw new Error('Failed to search counterparties');
    }
  }

  /**
   * DEMO MODE: Generate mock linked counterparty for testing
   * This is used when the backend endpoint isn't available yet
   * Remove this once the real backend is implemented
   */
  getMockLinkedCounterparty(contactName: string): LinkedCounterparty | null {
    // For demo purposes, simulate finding a linked counterparty for certain customers
    const mockLinkedCounterparties: Record<string, LinkedCounterparty> = {
      'ABC Corporation': {
        id: 'mock-cp-1',
        name: 'ABC Corporation Supplier Portal',
        organizationName: 'ABC Corp Ltd',
        connectionType: 'xero',
        email: 'accounts@abccorp.com',
        xeroContactId: 'xero-abc-123',
        status: 'active',
      },
      'XYZ Ltd': {
        id: 'mock-cp-2',
        name: 'XYZ Trading Company',
        organizationName: 'XYZ Ltd',
        connectionType: 'xero',
        email: 'finance@xyzltd.com',
        xeroContactId: 'xero-xyz-456',
        status: 'active',
      },
    };

    // Check if this customer has a mock linked counterparty
    if (mockLinkedCounterparties[contactName]) {
      console.log('📝 Using DEMO data - found mock linked counterparty for:', contactName);
      return mockLinkedCounterparties[contactName];
    }

    return null;
  }

  /**
   * Get linked counterparty with fallback to demo mode
   * This allows the UI to work even before the backend is implemented
   */
  async getLinkedCounterpartyWithFallback(
    contactId: string,
    contactName: string
  ): Promise<LinkedCounterparty | null> {
    try {
      // Try to get from real API first
      const result = await this.getLinkedCounterparty(contactId, contactName);
      return result;
    } catch (error) {
      // If API fails, fall back to demo mode
      console.log('🔄 Falling back to demo mode for linked counterparties');
      return this.getMockLinkedCounterparty(contactName);
    }
  }
}

export const counterpartyService = new CounterpartyService();
export default counterpartyService;
