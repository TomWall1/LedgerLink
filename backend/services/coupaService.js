// backend/services/coupaService.js
// Service to interact with Coupa REST API for invoice data

const axios = require('axios');

class CoupaService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl; // e.g., 'https://yourcompany.coupahost.com'
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'X-COUPA-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  /**
   * Fetch invoices from Coupa
   * @param {Object} filters - Filter parameters for the API call
   * @returns {Promise<Array>} Array of invoice objects
   */
  async getInvoices(filters = {}) {
    try {
      console.log('Fetching invoices from Coupa...');
      
      // Build query parameters
      const params = {
        limit: filters.limit || 1000,
        offset: filters.offset || 0,
        ...filters
      };

      // Add date filters if provided
      if (filters.startDate) {
        params['created-at[gte]'] = filters.startDate;
      }
      if (filters.endDate) {
        params['created-at[lte]'] = filters.endDate;
      }

      const response = await this.client.get('/api/invoices', { params });
      
      console.log(`Retrieved ${response.data.length} invoices from Coupa`);
      
      return this.normalizeInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices from Coupa:', error.response?.data || error.message);
      throw new Error(`Coupa API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get invoice details by ID
   * @param {string} invoiceId - Coupa invoice ID
   * @returns {Promise<Object>} Invoice object with full details
   */
  async getInvoiceById(invoiceId) {
    try {
      const response = await this.client.get(`/api/invoices/${invoiceId}`);
      return this.normalizeInvoice(response.data);
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch invoice ${invoiceId}`);
    }
  }

  /**
   * Get invoices by supplier
   * @param {string} supplierId - Coupa supplier ID
   * @returns {Promise<Array>} Array of invoices for the supplier
   */
  async getInvoicesBySupplier(supplierId) {
    try {
      const filters = { 'supplier-id': supplierId };
      return await this.getInvoices(filters);
    } catch (error) {
      console.error(`Error fetching invoices for supplier ${supplierId}:`, error.message);
      throw error;
    }
  }

  /**
   * Normalize invoice data to consistent format
   * @param {Array} invoices - Raw invoice data from Coupa
   * @returns {Array} Normalized invoice objects
   */
  normalizeInvoices(invoices) {
    return invoices.map(invoice => this.normalizeInvoice(invoice));
  }

  /**
   * Normalize single invoice to consistent format
   * @param {Object} invoice - Raw invoice from Coupa
   * @returns {Object} Normalized invoice object
   */
  normalizeInvoice(invoice) {
    return {
      coupaId: invoice.id,
      invoiceNumber: invoice['invoice-number'] || invoice.number,
      poNumber: invoice['order-number'] || invoice['po-number'],
      supplierName: invoice.supplier?.name || 'Unknown Supplier',
      supplierId: invoice.supplier?.id,
      amount: parseFloat(invoice['invoice-amount'] || invoice.total || 0),
      currency: invoice.currency?.code || 'USD',
      invoiceDate: invoice['invoice-date'],
      createdAt: invoice['created-at'],
      updatedAt: invoice['updated-at'],
      status: this.mapCoupaStatus(invoice.status),
      approvalStatus: this.mapApprovalStatus(invoice['approval-status'] || invoice['workflow-status']),
      dueDate: invoice['payment-due-date'],
      description: invoice.description,
      rawData: invoice // Keep original data for reference
    };
  }

  /**
   * Map Coupa status to standardized values
   * @param {string} status - Raw Coupa status
   * @returns {string} Standardized status
   */
  mapCoupaStatus(status) {
    const statusMap = {
      'draft': 'DRAFT',
      'pending_approval': 'PENDING_APPROVAL', 
      'approved': 'APPROVED',
      'rejected': 'REJECTED',
      'paid': 'PAID',
      'cancelled': 'CANCELLED',
      'disputed': 'DISPUTED'
    };
    
    return statusMap[status?.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Map approval status to standardized values
   * @param {string} approvalStatus - Raw approval status
   * @returns {string} Standardized approval status
   */
  mapApprovalStatus(approvalStatus) {
    const approvalMap = {
      'pending_buyer_approval': 'PENDING_BUYER',
      'pending_approval': 'PENDING_APPROVAL',
      'approved': 'APPROVED',
      'rejected': 'REJECTED',
      'requires_approval': 'REQUIRES_APPROVAL'
    };

    return approvalMap[approvalStatus?.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      // Try to fetch a small number of invoices as a connection test
      await this.client.get('/api/invoices', { params: { limit: 1 } });
      return true;
    } catch (error) {
      console.error('Coupa connection test failed:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get suppliers list
   * @returns {Promise<Array>} Array of suppliers
   */
  async getSuppliers() {
    try {
      const response = await this.client.get('/api/suppliers');
      return response.data.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        number: supplier.number,
        status: supplier.status
      }));
    } catch (error) {
      console.error('Error fetching suppliers:', error.response?.data || error.message);
      throw new Error('Failed to fetch suppliers from Coupa');
    }
  }
}

module.exports = CoupaService;