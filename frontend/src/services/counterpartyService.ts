/**
 * Counterparty Service
 * 
 * Handles API calls related to counterparty management and linked accounts
 * Updated to work with Prisma-based backend
 */

import { apiClient } from './api';

/**
 * Response from check-link endpoint
 */
interface CheckLinkResponse {
  success: boolean;
  linked: boolean;
  counterparty: {
    id: string;
    companyName: string;
    erpType: string;
    contactEmail?: string;
    contactName?: string;
    lastUpdated: string;
  } | null;
}

/**
 * Response from fetch invoices endpoint (not yet implemented)
 */
interface FetchInvoicesResponse {
  success: boolean;
  invoices?: any[];
  error?: string;
  message?: string;
}

/**
 * Response from links endpoint
 */
interface LinksResponse {
  success: boolean;
  links: Array<{
    id: string;
    ourCustomerName: string;
    theirCompanyName: string;
    theirSystemType: string;
    theirContactEmail: string;
    connectionStatus: string;
    createdAt: string;
    updatedAt: string;
  }>;
  count: number;
}

class CounterpartyService {
  /**
   * Check if a customer/supplier has a linked counterparty account
   * 
   * @param customerName - The name of the customer/vendor in YOUR system
   * @param ledgerType - 'AR' or 'AP'
   * @returns Promise with link status and counterparty info
   */
  async checkLink(
    customerName: string,
    ledgerType: 'AR' | 'AP'
  ): Promise<CheckLinkResponse> {
    try {
      console.log(`🔍 Checking counterparty link for: ${customerName} (${ledgerType})`);
      
      const response = await apiClient.get<CheckLinkResponse>(
        '/counterparty/check-link',
        {
          params: {
            name: customerName,
            ledgerType: ledgerType
          }
        }
      );

      if (response.data.success && response.data.linked) {
        console.log('✅ Linked counterparty found:', response.data.counterparty?.companyName);
      } else {
        console.log('ℹ️ No linked counterparty found');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Error checking counterparty link:', error);
      
      // Return a safe default response on error
      return {
        success: false,
        linked: false,
        counterparty: null
      };
    }
  }

  /**
   * Fetch invoices from a linked counterparty
   * NOTE: This endpoint returns 501 Not Implemented - it's a placeholder for future functionality
   * 
   * @param linkId - The ID of the counterparty link
   * @returns Promise with invoice data (when implemented)
   */
  async fetchInvoices(linkId: string): Promise<FetchInvoicesResponse> {
    try {
      console.log(`📥 Attempting to fetch invoices for link: ${linkId}`);
      
      const response = await apiClient.get<FetchInvoicesResponse>(
        `/counterparty/${linkId}/invoices`
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching counterparty invoices:', error);
      
      if (error.response?.status === 501) {
        return {
          success: false,
          error: 'Feature not yet implemented',
          message: 'Cross-account invoice fetching is not available yet'
        };
      }
      
      throw error;
    }
  }

  /**
   * Get all counterparty links for the current company
   * 
   * @returns Promise with array of all counterparty links
   */
  async getAllLinks(): Promise<LinksResponse> {
    try {
      console.log('📋 Fetching all counterparty links');
      
      const response = await apiClient.get<LinksResponse>('/counterparty/links');
      
      console.log(`✅ Found ${response.data.count} counterparty links`);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching counterparty links:', error);
      
      return {
        success: false,
        links: [],
        count: 0
      };
    }
  }
}

export const counterpartyService = new CounterpartyService();
export default counterpartyService;
