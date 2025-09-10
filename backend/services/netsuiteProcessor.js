// backend/services/netsuiteProcessor.js
// Service to process NetSuite AR ledger CSV exports

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class NetSuiteProcessor {
  constructor() {
    // Common NetSuite AR ledger field mappings
    this.fieldMappings = {
      // Invoice identification
      'Document Number': 'invoiceNumber',
      'Transaction #': 'invoiceNumber',
      'Invoice #': 'invoiceNumber',
      'Invoice Number': 'invoiceNumber',
      'Ref #': 'invoiceNumber',
      
      // Purchase Order
      'PO Number': 'poNumber',
      'PO #': 'poNumber',
      'Purchase Order': 'poNumber',
      'Ref Number': 'poNumber',
      
      // Supplier/Customer info
      'Name': 'supplierName',
      'Customer': 'supplierName',
      'Vendor': 'supplierName',
      'Entity': 'supplierName',
      'Supplier': 'supplierName',
      
      // Amounts
      'Amount': 'amount',
      'Total': 'amount',
      'Invoice Amount': 'amount',
      'Net Amount': 'amount',
      'Original Amount': 'amount',
      'Transaction Amount': 'amount',
      
      // Dates
      'Date': 'invoiceDate',
      'Invoice Date': 'invoiceDate',
      'Transaction Date': 'invoiceDate',
      'Due Date': 'dueDate',
      'Terms Date': 'dueDate',
      
      // Status
      'Status': 'status',
      'Transaction Status': 'status',
      'Payment Status': 'paymentStatus',
      
      // Additional fields
      'Currency': 'currency',
      'Memo': 'description',
      'Description': 'description',
      'Class': 'class',
      'Department': 'department',
      'Location': 'location'
    };
    
    // Status mappings for NetSuite
    this.statusMappings = {
      'Open': 'OPEN',
      'Paid In Full': 'PAID',
      'Partially Paid': 'PARTIAL',
      'Pending Approval': 'PENDING',
      'Approved': 'APPROVED',
      'Rejected': 'REJECTED',
      'Voided': 'VOIDED',
      'Cancelled': 'CANCELLED'
    };
  }

  /**
   * Process NetSuite CSV file and return normalized invoice data
   * @param {string} filePath - Path to the CSV file
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Array of normalized invoice objects
   */
  async processCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const invoices = [];
      const errors = [];
      let lineNumber = 0;

      console.log(`Processing NetSuite CSV: ${filePath}`);

      fs.createReadStream(filePath)
        .pipe(csv({
          skipEmptyLines: true,
          trim: true,
          headers: options.customHeaders || undefined
        }))
        .on('headers', (headers) => {
          console.log('CSV Headers detected:', headers);
          this.validateHeaders(headers);
        })
        .on('data', (row) => {
          lineNumber++;
          try {
            const normalizedInvoice = this.normalizeInvoice(row, lineNumber);
            if (normalizedInvoice) {
              invoices.push(normalizedInvoice);
            }
          } catch (error) {
            errors.push({
              line: lineNumber,
              error: error.message,
              data: row
            });
            console.warn(`Error processing line ${lineNumber}:`, error.message);
          }
        })
        .on('end', () => {
          console.log(`NetSuite CSV processing complete: ${invoices.length} invoices processed`);
          if (errors.length > 0) {
            console.warn(`${errors.length} errors encountered during processing`);
          }
          
          resolve({
            invoices,
            errors,
            summary: {
              totalRows: lineNumber,
              successfulRows: invoices.length,
              errorRows: errors.length,
              processingDate: new Date()
            }
          });
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  }

  /**
   * Validate CSV headers and suggest corrections
   * @param {Array} headers - CSV headers from the file
   */
  validateHeaders(headers) {
    const recognizedHeaders = [];
    const unrecognizedHeaders = [];
    
    headers.forEach(header => {
      const trimmedHeader = header.trim();
      if (this.fieldMappings[trimmedHeader]) {
        recognizedHeaders.push(trimmedHeader);
      } else {
        // Try case-insensitive matching
        const matchedKey = Object.keys(this.fieldMappings).find(
          key => key.toLowerCase() === trimmedHeader.toLowerCase()
        );
        
        if (matchedKey) {
          recognizedHeaders.push(trimmedHeader);
        } else {
          unrecognizedHeaders.push(trimmedHeader);
        }
      }
    });

    console.log(`Recognized headers: ${recognizedHeaders.length}/${headers.length}`);
    
    if (unrecognizedHeaders.length > 0) {
      console.log('Unrecognized headers:', unrecognizedHeaders);
      console.log('Consider mapping these headers in your configuration');
    }

    // Check for essential fields
    const essentialFields = ['invoiceNumber', 'supplierName', 'amount'];
    const mappedFields = recognizedHeaders.map(h => this.fieldMappings[h] || this.fieldMappings[
      Object.keys(this.fieldMappings).find(key => key.toLowerCase() === h.toLowerCase())
    ]);
    
    const missingEssential = essentialFields.filter(field => !mappedFields.includes(field));
    
    if (missingEssential.length > 0) {
      console.warn('Warning: Missing essential fields:', missingEssential);
    }
  }

  /**
   * Normalize a single invoice row from NetSuite
   * @param {Object} row - Raw CSV row data
   * @param {number} lineNumber - Line number for error reporting
   * @returns {Object} Normalized invoice object
   */
  normalizeInvoice(row, lineNumber) {
    const invoice = {
      id: `netsuite_${lineNumber}_${Date.now()}`, // Unique identifier
      source: 'NetSuite',
      lineNumber,
      processedAt: new Date()
    };

    // Map all fields using the field mappings
    Object.entries(row).forEach(([csvField, value]) => {
      const trimmedField = csvField.trim();
      let mappedField = this.fieldMappings[trimmedField];
      
      // Try case-insensitive matching if direct match fails
      if (!mappedField) {
        const matchedKey = Object.keys(this.fieldMappings).find(
          key => key.toLowerCase() === trimmedField.toLowerCase()
        );
        mappedField = matchedKey ? this.fieldMappings[matchedKey] : null;
      }
      
      if (mappedField && value !== null && value !== undefined && value !== '') {
        invoice[mappedField] = this.parseValue(mappedField, value);
      }
    });

    // Post-processing and validation
    this.validateAndCleanInvoice(invoice);
    
    // Skip invoices without essential data
    if (!invoice.invoiceNumber && !invoice.amount) {
      console.log(`Skipping line ${lineNumber}: Missing essential data`);
      return null;
    }

    return invoice;
  }

  /**
   * Parse and convert values based on field type
   * @param {string} fieldName - The mapped field name
   * @param {string} value - Raw value from CSV
   * @returns {*} Parsed value
   */
  parseValue(fieldName, value) {
    if (!value || value === '') return null;
    
    const stringValue = String(value).trim();
    
    switch (fieldName) {
      case 'amount':
        // Handle various currency formats
        const cleanAmount = stringValue
          .replace(/[,$£€¥]/g, '') // Remove currency symbols
          .replace(/[()]/g, '')    // Remove parentheses
          .trim();
        
        const amount = parseFloat(cleanAmount);
        
        // Handle negative amounts (sometimes in parentheses)
        if (String(value).includes('(') && String(value).includes(')')) {
          return -Math.abs(amount);
        }
        
        return isNaN(amount) ? 0 : amount;
        
      case 'invoiceDate':
      case 'dueDate':
        // Parse various date formats
        return this.parseDate(stringValue);
        
      case 'status':
      case 'paymentStatus':
        // Normalize status values
        return this.normalizeStatus(stringValue);
        
      case 'invoiceNumber':
      case 'poNumber':
        // Clean invoice and PO numbers
        return stringValue.replace(/[^\w\-\/]/g, '').toUpperCase();
        
      case 'supplierName':
        // Clean supplier names
        return stringValue.replace(/\s+/g, ' ').trim();
        
      default:
        return stringValue;
    }
  }

  /**
   * Parse date strings in various formats
   * @param {string} dateString - Date string to parse
   * @returns {string|null} ISO date string or null
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try common formats
        const formats = [
          /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
          /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
          /(\d{1,2})-(\d{1,2})-(\d{4})/   // DD-MM-YYYY or MM-DD-YYYY
        ];
        
        for (const format of formats) {
          const match = dateString.match(format);
          if (match) {
            // Assume MM/DD/YYYY format for ambiguous dates
            const parsed = new Date(match[3], match[1] - 1, match[2]);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
          }
        }
        
        console.warn(`Unable to parse date: ${dateString}`);
        return null;
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn(`Date parsing error for "${dateString}":`, error.message);
      return null;
    }
  }

  /**
   * Normalize status values
   * @param {string} status - Raw status value
   * @returns {string} Normalized status
   */
  normalizeStatus(status) {
    if (!status) return 'UNKNOWN';
    
    const trimmedStatus = status.trim();
    
    // Direct mapping
    if (this.statusMappings[trimmedStatus]) {
      return this.statusMappings[trimmedStatus];
    }
    
    // Case-insensitive mapping
    const matchedKey = Object.keys(this.statusMappings).find(
      key => key.toLowerCase() === trimmedStatus.toLowerCase()
    );
    
    if (matchedKey) {
      return this.statusMappings[matchedKey];
    }
    
    // Partial matching for common status patterns
    const lowerStatus = trimmedStatus.toLowerCase();
    
    if (lowerStatus.includes('open') || lowerStatus.includes('outstanding')) {
      return 'OPEN';
    } else if (lowerStatus.includes('paid') && lowerStatus.includes('full')) {
      return 'PAID';
    } else if (lowerStatus.includes('partial')) {
      return 'PARTIAL';
    } else if (lowerStatus.includes('pending')) {
      return 'PENDING';
    } else if (lowerStatus.includes('approved')) {
      return 'APPROVED';
    } else if (lowerStatus.includes('void')) {
      return 'VOIDED';
    }
    
    return trimmedStatus.toUpperCase();
  }

  /**
   * Validate and clean the invoice object
   * @param {Object} invoice - Invoice object to validate
   */
  validateAndCleanInvoice(invoice) {
    // Ensure required fields have default values
    if (!invoice.currency) {
      invoice.currency = 'USD';
    }
    
    if (!invoice.status) {
      invoice.status = 'UNKNOWN';
    }
    
    // Clean numeric values
    if (invoice.amount && typeof invoice.amount === 'string') {
      invoice.amount = parseFloat(invoice.amount) || 0;
    }
    
    // Ensure supplier name exists
    if (!invoice.supplierName) {
      invoice.supplierName = 'Unknown Supplier';
    }
    
    // Add processing metadata
    invoice.processingNotes = [];
    
    if (!invoice.invoiceNumber) {
      invoice.processingNotes.push('Missing invoice number');
    }
    
    if (!invoice.invoiceDate) {
      invoice.processingNotes.push('Missing invoice date');
    }
    
    if (invoice.amount <= 0) {
      invoice.processingNotes.push('Zero or negative amount');
    }
  }

  /**
   * Generate processing summary
   * @param {Array} invoices - Processed invoices
   * @returns {Object} Summary statistics
   */
  generateSummary(invoices) {
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: 0,
      statusBreakdown: {},
      supplierBreakdown: {},
      currencyBreakdown: {},
      dateRange: { earliest: null, latest: null },
      averageAmount: 0,
      processingIssues: 0
    };

    invoices.forEach(invoice => {
      // Amount totals
      summary.totalAmount += invoice.amount || 0;
      
      // Status breakdown
      const status = invoice.status || 'UNKNOWN';
      summary.statusBreakdown[status] = (summary.statusBreakdown[status] || 0) + 1;
      
      // Supplier breakdown
      const supplier = invoice.supplierName || 'Unknown';
      summary.supplierBreakdown[supplier] = (summary.supplierBreakdown[supplier] || 0) + 1;
      
      // Currency breakdown
      const currency = invoice.currency || 'USD';
      summary.currencyBreakdown[currency] = (summary.currencyBreakdown[currency] || 0) + 1;
      
      // Date range
      if (invoice.invoiceDate) {
        const date = new Date(invoice.invoiceDate);
        if (!summary.dateRange.earliest || date < new Date(summary.dateRange.earliest)) {
          summary.dateRange.earliest = invoice.invoiceDate;
        }
        if (!summary.dateRange.latest || date > new Date(summary.dateRange.latest)) {
          summary.dateRange.latest = invoice.invoiceDate;
        }
      }
      
      // Processing issues
      if (invoice.processingNotes && invoice.processingNotes.length > 0) {
        summary.processingIssues++;
      }
    });

    summary.averageAmount = summary.totalInvoices > 0 ? summary.totalAmount / summary.totalInvoices : 0;

    return summary;
  }

  /**
   * Export processed data to various formats
   * @param {Array} invoices - Processed invoices
   * @param {string} format - Export format ('json', 'csv')
   * @param {string} outputPath - Output file path
   */
  async exportData(invoices, format = 'json', outputPath) {
    try {
      if (format === 'json') {
        const jsonData = JSON.stringify(invoices, null, 2);
        fs.writeFileSync(outputPath, jsonData);
      } else if (format === 'csv') {
        // Convert back to CSV with normalized headers
        const csvHeaders = ['invoiceNumber', 'supplierName', 'amount', 'invoiceDate', 'dueDate', 'status', 'currency', 'poNumber'];
        const csvRows = [csvHeaders.join(',')];
        
        invoices.forEach(invoice => {
          const row = csvHeaders.map(header => {
            const value = invoice[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          });
          csvRows.push(row.join(','));
        });
        
        fs.writeFileSync(outputPath, csvRows.join('\n'));
      }
      
      console.log(`Data exported to: ${outputPath}`);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

module.exports = NetSuiteProcessor;