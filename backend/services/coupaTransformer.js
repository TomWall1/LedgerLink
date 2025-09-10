/**
 * Coupa Data Transformer
 * 
 * This service converts data from Coupa's format into LedgerLink's format.
 * Think of this as a "translator" that makes Coupa data work with your system.
 */

class CoupaTransformer {
  /**
   * Transform a single invoice approval from Coupa format to LedgerLink format
   */
  static transformInvoiceApproval(coupaApproval) {
    try {
      return {
        // Core invoice information
        invoiceNumber: coupaApproval.invoice?.number || coupaApproval.invoice_number || 'Unknown',
        amount: parseFloat(coupaApproval.invoice?.total || coupaApproval.total || 0),
        currency: coupaApproval.invoice?.currency?.code || coupaApproval.currency || 'USD',
        
        // Dates
        issueDate: this.formatDate(coupaApproval.invoice?.invoice_date || coupaApproval.invoice_date),
        dueDate: this.formatDate(coupaApproval.invoice?.payment_due_date || coupaApproval.due_date),
        approvalDate: this.formatDate(coupaApproval.approved_at || coupaApproval.created_at),
        
        // Vendor/Supplier information
        vendor: coupaApproval.invoice?.supplier?.name || coupaApproval.supplier_name || 'Unknown Vendor',
        vendorId: coupaApproval.invoice?.supplier?.id || coupaApproval.supplier_id,
        
        // Approval information
        status: this.normalizeStatus(coupaApproval.status),
        approver: coupaApproval.approver?.display_name || coupaApproval.approver_name || 'Unknown',
        approverId: coupaApproval.approver?.id || coupaApproval.approver_id,
        
        // Additional information
        description: coupaApproval.invoice?.invoice_lines?.[0]?.description || coupaApproval.description || '',
        reference: coupaApproval.invoice?.reference_number || coupaApproval.reference || '',
        
        // System information
        coupaId: coupaApproval.id,
        source: 'coupa-api',
        syncedAt: new Date().toISOString(),
        
        // Raw data for debugging (optional)
        rawData: process.env.NODE_ENV === 'development' ? coupaApproval : undefined
      };
    } catch (error) {
      console.error('Error transforming invoice approval:', error);
      
      // Return a basic structure even if transformation fails
      return {
        invoiceNumber: 'TRANSFORM_ERROR',
        amount: 0,
        vendor: 'Unknown',
        status: 'error',
        source: 'coupa-api',
        error: error.message,
        rawData: coupaApproval
      };
    }
  }

  /**
   * Transform multiple invoice approvals
   */
  static transformInvoiceApprovals(coupaApprovals) {
    if (!Array.isArray(coupaApprovals)) {
      console.warn('Expected array of approvals, got:', typeof coupaApprovals);
      return [];
    }
    
    return coupaApprovals.map(approval => this.transformInvoiceApproval(approval));
  }

  /**
   * Transform a single invoice from Coupa format to LedgerLink format
   */
  static transformInvoice(coupaInvoice) {
    try {
      return {
        // Core invoice information
        invoiceNumber: coupaInvoice.number || coupaInvoice.invoice_number || 'Unknown',
        amount: parseFloat(coupaInvoice.total || coupaInvoice.amount || 0),
        currency: coupaInvoice.currency?.code || coupaInvoice.currency || 'USD',
        
        // Dates
        issueDate: this.formatDate(coupaInvoice.invoice_date || coupaInvoice.created_at),
        dueDate: this.formatDate(coupaInvoice.payment_due_date || coupaInvoice.due_date),
        receivedDate: this.formatDate(coupaInvoice.created_at),
        
        // Vendor/Supplier information
        vendor: coupaInvoice.supplier?.name || coupaInvoice.supplier_name || 'Unknown Vendor',
        vendorId: coupaInvoice.supplier?.id || coupaInvoice.supplier_id,
        
        // Status information
        status: this.normalizeInvoiceStatus(coupaInvoice.status),
        paymentStatus: this.normalizePaymentStatus(coupaInvoice.payment_status),
        
        // Additional information
        description: coupaInvoice.invoice_lines?.[0]?.description || coupaInvoice.description || '',
        reference: coupaInvoice.reference_number || coupaInvoice.external_ref_num || '',
        poNumber: coupaInvoice.order_header?.requisition_number || coupaInvoice.po_number || '',
        
        // Financial details
        subtotal: parseFloat(coupaInvoice.sub_total || 0),
        taxAmount: parseFloat(coupaInvoice.tax_amount || 0),
        
        // System information
        coupaId: coupaInvoice.id,
        source: 'coupa-api',
        syncedAt: new Date().toISOString(),
        
        // Raw data for debugging
        rawData: process.env.NODE_ENV === 'development' ? coupaInvoice : undefined
      };
    } catch (error) {
      console.error('Error transforming invoice:', error);
      
      return {
        invoiceNumber: 'TRANSFORM_ERROR',
        amount: 0,
        vendor: 'Unknown',
        status: 'error',
        source: 'coupa-api',
        error: error.message,
        rawData: coupaInvoice
      };
    }
  }

  /**
   * Transform multiple invoices
   */
  static transformInvoices(coupaInvoices) {
    if (!Array.isArray(coupaInvoices)) {
      console.warn('Expected array of invoices, got:', typeof coupaInvoices);
      return [];
    }
    
    return coupaInvoices.map(invoice => this.transformInvoice(invoice));
  }

  /**
   * Transform a single supplier from Coupa format to LedgerLink format
   */
  static transformSupplier(coupaSupplier) {
    try {
      return {
        // Basic supplier information
        name: coupaSupplier.name || 'Unknown Supplier',
        supplierId: coupaSupplier.id,
        displayName: coupaSupplier.display_name || coupaSupplier.name,
        
        // Contact information
        email: coupaSupplier.primary_contact?.email || coupaSupplier.email || '',
        phone: coupaSupplier.primary_contact?.phone_work || coupaSupplier.phone || '',
        
        // Address information
        address: {
          street: coupaSupplier.primary_address?.street1 || '',
          city: coupaSupplier.primary_address?.city || '',
          state: coupaSupplier.primary_address?.state || '',
          postalCode: coupaSupplier.primary_address?.postal_code || '',
          country: coupaSupplier.primary_address?.country?.name || ''
        },
        
        // Status and settings
        status: coupaSupplier.active ? 'active' : 'inactive',
        paymentTerms: coupaSupplier.payment_term?.code || '',
        
        // Tax information
        taxId: coupaSupplier.tax_id || '',
        vatNumber: coupaSupplier.vat_number || '',
        
        // System information
        coupaId: coupaSupplier.id,
        source: 'coupa-api',
        syncedAt: new Date().toISOString(),
        
        // Raw data for debugging
        rawData: process.env.NODE_ENV === 'development' ? coupaSupplier : undefined
      };
    } catch (error) {
      console.error('Error transforming supplier:', error);
      
      return {
        name: 'TRANSFORM_ERROR',
        supplierId: coupaSupplier?.id || 'unknown',
        status: 'error',
        source: 'coupa-api',
        error: error.message,
        rawData: coupaSupplier
      };
    }
  }

  /**
   * Transform multiple suppliers
   */
  static transformSuppliers(coupaSuppliers) {
    if (!Array.isArray(coupaSuppliers)) {
      console.warn('Expected array of suppliers, got:', typeof coupaSuppliers);
      return [];
    }
    
    return coupaSuppliers.map(supplier => this.transformSupplier(supplier));
  }

  /**
   * Helper method to format dates consistently
   */
  static formatDate(dateValue) {
    if (!dateValue) return null;
    
    try {
      // Handle different date formats from Coupa
      const date = new Date(dateValue);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date received:', dateValue);
        return null;
      }
      
      // Return in ISO format for consistency
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error.message);
      return null;
    }
  }

  /**
   * Normalize approval status from Coupa to standard values
   */
  static normalizeStatus(coupaStatus) {
    if (!coupaStatus) return 'unknown';
    
    const status = coupaStatus.toLowerCase();
    
    // Map Coupa statuses to standard values
    const statusMap = {
      'approved': 'approved',
      'pending': 'pending',
      'pending_approval': 'pending',
      'denied': 'rejected',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'draft': 'draft'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Normalize invoice status from Coupa
   */
  static normalizeInvoiceStatus(coupaStatus) {
    if (!coupaStatus) return 'unknown';
    
    const status = coupaStatus.toLowerCase();
    
    const statusMap = {
      'pending_receipt': 'pending',
      'pending_approval': 'pending_approval',
      'approved': 'approved',
      'paid': 'paid',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'draft': 'draft',
      'disputed': 'disputed'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Normalize payment status from Coupa
   */
  static normalizePaymentStatus(coupaPaymentStatus) {
    if (!coupaPaymentStatus) return 'unpaid';
    
    const status = coupaPaymentStatus.toLowerCase();
    
    const statusMap = {
      'paid': 'paid',
      'unpaid': 'unpaid',
      'partially_paid': 'partial',
      'pending': 'pending',
      'failed': 'failed',
      'cancelled': 'cancelled'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Convert LedgerLink data to Coupa format (for future two-way sync)
   */
  static toLedgerLinkFormat(coupaData, dataType) {
    switch (dataType) {
      case 'invoice':
        return this.transformInvoice(coupaData);
      case 'approval':
        return this.transformInvoiceApproval(coupaData);
      case 'supplier':
        return this.transformSupplier(coupaData);
      default:
        console.warn('Unknown data type for transformation:', dataType);
        return coupaData;
    }
  }

  /**
   * Batch transform different types of data
   */
  static transformBatch(coupaDataArray, dataType) {
    if (!Array.isArray(coupaDataArray)) {
      console.warn('Expected array for batch transform, got:', typeof coupaDataArray);
      return [];
    }

    console.log(`Transforming ${coupaDataArray.length} ${dataType} records...`);
    
    const results = coupaDataArray.map(item => this.toLedgerLinkFormat(item, dataType));
    
    // Filter out any failed transformations
    const successfulTransforms = results.filter(item => !item.error);
    const failedTransforms = results.filter(item => item.error);
    
    if (failedTransforms.length > 0) {
      console.warn(`${failedTransforms.length} transformations failed for ${dataType}`);
    }
    
    console.log(`Successfully transformed ${successfulTransforms.length} ${dataType} records`);
    
    return successfulTransforms;
  }
}

module.exports = CoupaTransformer;