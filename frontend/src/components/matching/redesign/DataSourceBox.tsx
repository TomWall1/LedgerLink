/**
 * DataSourceBox Component
 * 
 * UPDATED:
 * - Fixed CSV date parsing to properly handle selected format (DD/MM/YYYY vs MM/DD/YYYY)
 * - Dates are now correctly parsed and converted to ISO format for matching
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { xeroService } from '../../../services/xeroService';
import counterpartyService from '../../../services/counterpartyService';
import matchingService from '../../../services/matchingService';
import { useNavigate } from 'react-router-dom';

// Types
interface LoadedDataSource {
  type: 'xero' | 'csv';
  invoices: any[];
  customerName?: string;
  fileName?: string;
  invoiceCount: number;
}

interface CounterpartyConnection {
  companyName: string;
  erpType: string;
}

export type DateFormat = 
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD/MM/YYYY'
  | 'DD-MM-YYYY'
  | 'MM-DD-YYYY';

interface DataSourceBoxProps {
  side: 'AR' | 'AP';
  title: string;
  isXeroConnected: boolean;
  xeroConnectionId?: string;
  onDataLoaded: (data: LoadedDataSource) => void;
  onError: (error: string) => void;
  counterpartyConnection?: CounterpartyConnection | null;
  isCounterpartyLocked: boolean;
  shouldDefaultToCsv?: boolean;
  onUseCsvInstead?: () => void;
  onConnectCounterparty?: () => void;
}

export const DataSourceBox: React.FC<DataSourceBoxProps> = ({
  side,
  title,
  isXeroConnected,
  xeroConnectionId,
  onDataLoaded,
  onError,
  counterpartyConnection,
  isCounterpartyLocked,
  shouldDefaultToCsv = false,
  onUseCsvInstead,
  onConnectCounterparty,
}) => {
  const navigate = useNavigate();

  // State
  const [dataSourceType, setDataSourceType] = useState<'xero' | 'csv' | null>(null);
  const [loadedData, setLoadedData] = useState<LoadedDataSource | null>(null);
  
  // Xero state
  const [xeroContacts, setXeroContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [loadingXeroContacts, setLoadingXeroContacts] = useState(false);
  const [loadingXeroInvoices, setLoadingXeroInvoices] = useState(false);
  
  // CSV state
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  /**
   * Auto-select CSV when shouldDefaultToCsv is true
   */
  useEffect(() => {
    if (shouldDefaultToCsv && !loadedData && !dataSourceType) {
      console.log(`🔄 ${side} box auto-defaulting to CSV (no counterparty found)`);
      setDataSourceType('csv');
    }
  }, [shouldDefaultToCsv, loadedData, dataSourceType, side]);

  /**
   * Load Xero contacts when Xero is selected
   */
  useEffect(() => {
    const loadXeroContacts = async () => {
      if (dataSourceType !== 'xero' || !isXeroConnected || !xeroConnectionId) {
        return;
      }

      setLoadingXeroContacts(true);
      console.log(`📥 Loading Xero ${side === 'AR' ? 'customers' : 'suppliers'}`);

      try {
        const contacts = side === 'AR' 
          ? await xeroService.getCustomers(xeroConnectionId)
          : await xeroService.getSuppliers(xeroConnectionId);
        
        console.log(`✅ Loaded ${contacts.length} ${side === 'AR' ? 'customers' : 'suppliers'}`);
        setXeroContacts(contacts);
      } catch (error) {
        console.error('❌ Error loading Xero contacts:', error);
        onError(`Failed to load ${side === 'AR' ? 'customers' : 'suppliers'} from Xero`);
        setDataSourceType(null);
      } finally {
        setLoadingXeroContacts(false);
      }
    };

    loadXeroContacts();
  }, [dataSourceType, isXeroConnected, xeroConnectionId, side, onError]);

  /**
   * Handle Xero contact selection and invoice loading
   */
  const handleContactSelection = async (contactId: string) => {
    setSelectedContact(contactId);
    
    if (!contactId || !xeroConnectionId) return;

    const contact = xeroContacts.find(c => c.ContactID === contactId);
    if (!contact) return;

    setLoadingXeroInvoices(true);
    console.log(`📥 Loading ${side === 'AR' ? 'invoices' : 'bills'} for ${contact.Name}...`);

    try {
      const invoices = side === 'AR'
        ? await xeroService.getCustomerInvoices(xeroConnectionId, contactId)
        : await xeroService.getSupplierInvoices(xeroConnectionId, contactId);

      console.log(`✅ Loaded ${invoices.length} items for ${contact.Name}`);

      const data: LoadedDataSource = {
        type: 'xero',
        invoices: invoices,
        customerName: contact.Name,
        invoiceCount: invoices.length,
      };

      setLoadedData(data);
      onDataLoaded(data);

    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      onError(`Failed to load ${side === 'AR' ? 'invoices' : 'bills'} from Xero`);
    } finally {
      setLoadingXeroInvoices(false);
    }
  };

  /**
   * Parse a date string according to the selected format
   * FIXED: Now properly converts dates based on selected format
   */
  const parseDateWithFormat = (dateStr: string, format: DateFormat): string => {
    if (!dateStr) return '';
    
    let day: number, month: number, year: number;
    
    // Remove any whitespace
    dateStr = dateStr.trim();
    
    try {
      switch (format) {
        case 'MM/DD/YYYY': {
          const parts = dateStr.split('/');
          if (parts.length !== 3) return dateStr;
          month = parseInt(parts[0]);
          day = parseInt(parts[1]);
          year = parseInt(parts[2]);
          break;
        }
        case 'DD/MM/YYYY': {
          const parts = dateStr.split('/');
          if (parts.length !== 3) return dateStr;
          day = parseInt(parts[0]);
          month = parseInt(parts[1]);
          year = parseInt(parts[2]);
          break;
        }
        case 'YYYY-MM-DD': {
          const parts = dateStr.split('-');
          if (parts.length !== 3) return dateStr;
          year = parseInt(parts[0]);
          month = parseInt(parts[1]);
          day = parseInt(parts[2]);
          break;
        }
        case 'DD-MM-YYYY': {
          const parts = dateStr.split('-');
          if (parts.length !== 3) return dateStr;
          day = parseInt(parts[0]);
          month = parseInt(parts[1]);
          year = parseInt(parts[2]);
          break;
        }
        case 'MM-DD-YYYY': {
          const parts = dateStr.split('-');
          if (parts.length !== 3) return dateStr;
          month = parseInt(parts[0]);
          day = parseInt(parts[1]);
          year = parseInt(parts[2]);
          break;
        }
        default:
          return dateStr;
      }
      
      // Validate the parsed values
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.warn(`⚠️ Invalid date components: ${dateStr}`);
        return dateStr;
      }
      
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn(`⚠️ Date out of range: ${dateStr}`);
        return dateStr;
      }
      
      // Create date object and convert to ISO format
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid date created: ${dateStr}`);
        return dateStr;
      }
      
      return date.toISOString();
    } catch (error) {
      console.error(`❌ Error parsing date "${dateStr}" with format "${format}":`, error);
      return dateStr;
    }
  };

  /**
   * Handle CSV file upload
   */
  const handleCsvUpload = async (file: File) => {
    setCsvFile(file);
    setUploadingCsv(true);
    console.log(`📤 Uploading CSV: ${file.name} with format: ${dateFormat}`);

    try {
      // Validate file
      const validation = await matchingService.validateCSVFile(file);
      if (!validation.isValid) {
        onError(validation.error || 'Invalid CSV file');
        setUploadingCsv(false);
        return;
      }

      // Read file
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Parse CSV with selected date format
      const invoices = parseCSVWithDateFormat(text, dateFormat);

      if (invoices.length === 0) {
        onError('No valid invoices found in CSV');
        setUploadingCsv(false);
        return;
      }

      console.log(`✅ Parsed ${invoices.length} invoices from CSV`);
      console.log('   Sample invoice:', invoices[0]);

      const data: LoadedDataSource = {
        type: 'csv',
        invoices: invoices,
        fileName: file.name,
        invoiceCount: invoices.length,
      };

      setLoadedData(data);
      onDataLoaded(data);

    } catch (error) {
      console.error('❌ Error processing CSV:', error);
      onError('Failed to process CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingCsv(false);
    }
  };

  /**
   * Parse CSV with the selected date format
   * FIXED: Now properly parses dates according to selected format
   */
  const parseCSVWithDateFormat = (text: string, format: DateFormat): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse CSV line handling quoted commas
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^"|"$/g, ''));
    };

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    console.log('📋 CSV headers:', headers);
    
    // Find column indices
    const transactionNumberIndex = headers.findIndex(h => 
      h.includes('transaction') || h.includes('invoice') || h.includes('number') || h.includes('id')
    );
    const amountIndex = headers.findIndex(h => 
      h.includes('amount') || h.includes('total') || h.includes('value')
    );
    const dateIndex = headers.findIndex(h => h.includes('date') && !h.includes('due'));
    const statusIndex = headers.findIndex(h => h.includes('status'));
    const dueDateIndex = headers.findIndex(h => h.includes('due'));
    const referenceIndex = headers.findIndex(h => h.includes('reference'));
    const vendorIndex = headers.findIndex(h => h.includes('vendor') || h.includes('customer'));
    
    if (transactionNumberIndex === -1 || amountIndex === -1 || dateIndex === -1) {
      throw new Error('CSV must include transaction number, amount, and date columns');
    }

    console.log(`📍 Column indices - Transaction: ${transactionNumberIndex}, Amount: ${amountIndex}, Date: ${dateIndex}`);

    // Parse data rows
    const invoices: any[] = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      
      const transactionNumber = cells[transactionNumberIndex];
      const amountStr = cells[amountIndex];
      const dateStr = cells[dateIndex];
      
      if (!transactionNumber || !amountStr || !dateStr) {
        failCount++;
        continue;
      }
      
      const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
      if (isNaN(amount)) {
        failCount++;
        continue;
      }
      
      // Parse date with selected format
      const parsedDate = parseDateWithFormat(dateStr, format);
      const parsedDueDate = dueDateIndex >= 0 && cells[dueDateIndex] 
        ? parseDateWithFormat(cells[dueDateIndex], format)
        : undefined;
      
      invoices.push({
        id: `csv-${i}`,
        transaction_number: transactionNumber,
        transaction_type: 'CSV Invoice',
        amount: amount,
        issue_date: parsedDate,
        due_date: parsedDueDate,
        status: statusIndex >= 0 ? (cells[statusIndex] || 'UNKNOWN') : 'UNKNOWN',
        reference: referenceIndex >= 0 ? cells[referenceIndex] : undefined,
        contact_name: vendorIndex >= 0 ? cells[vendorIndex] : undefined,
        source: 'csv',
        // Keep original for debugging
        _original_date: dateStr,
        _parsed_date: parsedDate
      });
      
      successCount++;
    }

    console.log(`✅ CSV parsing complete: ${successCount} successful, ${failCount} failed`);
    if (successCount > 0) {
      console.log('   First invoice date conversion:', {
        original: invoices[0]._original_date,
        parsed: invoices[0]._parsed_date,
        format: format
      });
    }

    return invoices;
  };

  /**
   * Clear loaded data
   */
  const handleClear = () => {
    setLoadedData(null);
    setDataSourceType(null);
    setSelectedContact('');
    setCsvFile(null);
    setXeroContacts([]);
  };

  /**
   * Handle "Use CSV Instead" button
   */
  const handleUseCsvInstead = () => {
    if (onUseCsvInstead) {
      onUseCsvInstead();
    }
    setDataSourceType('csv');
  };

  // Render counterparty connection display
  if (isCounterpartyLocked && counterpartyConnection) {
    return (
      <div className="border-2 border-primary-200 rounded-lg p-6 bg-gradient-to-br from-primary-50 to-white min-h-[400px] flex flex-col shadow-sm">
        <h3 className="text-h4 text-neutral-900 mb-6">{title}</h3>
        
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-small text-neutral-600 mb-1">Connected Counterparty:</p>
            <p className="text-h4 text-neutral-900 font-semibold">{counterpartyConnection.companyName}</p>
            <p className="text-small text-neutral-500 mt-1">
              via {counterpartyConnection.erpType}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2 mt-6">
            <Button
              variant="secondary"
              onClick={handleUseCsvInstead}
              className="w-full"
            >
              Use CSV Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render loaded data summary
  if (loadedData) {
    return (
      <div className="border-2 border-success-300 rounded-lg p-6 bg-gradient-to-br from-success-50 to-white min-h-[400px] flex flex-col shadow-sm">
        <h3 className="text-h4 text-neutral-900 mb-6">{title}</h3>
        
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="text-center">
            <p className="text-small text-success-700 mb-1">✓ Data Loaded</p>
            <p className="text-h4 text-neutral-900 font-semibold">
              {loadedData.customerName || loadedData.fileName}
            </p>
            <p className="text-body text-neutral-600 mt-2">
              {loadedData.invoiceCount} invoice{loadedData.invoiceCount !== 1 ? 's' : ''} loaded
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={handleClear}
            className="mt-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear and Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Main data source selection interface
  return (
    <div className="border-2 border-neutral-300 rounded-lg p-6 bg-gradient-to-br from-neutral-50 to-white min-h-[400px] flex flex-col shadow-sm">
      <h3 className="text-h4 text-neutral-900 mb-6">{title}</h3>
      
      <div className="flex-1 space-y-4">
        {/* Data Source Selection */}
        <div>
          <label className="block text-body font-medium text-neutral-900 mb-2">
            Choose data source
          </label>
          <select
            value={dataSourceType || ''}
            onChange={(e) => setDataSourceType(e.target.value as 'xero' | 'csv' | null)}
            className="w-full px-4 py-3 rounded-md border-2 border-neutral-300 bg-white text-body text-neutral-900
                       focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
                       transition-all duration-short hover:border-neutral-400"
          >
            <option value="">Select a data source...</option>
            {isXeroConnected && <option value="xero">Connected ERP - Xero ✓</option>}
            <option value="csv">Upload CSV File</option>
          </select>
        </div>

        {/* Xero Contact Selection */}
        {dataSourceType === 'xero' && (
          <div className="space-y-4 pt-2">
            {loadingXeroContacts ? (
              <div className="flex items-center justify-center py-8 bg-blue-50 rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-neutral-700">Loading {side === 'AR' ? 'customers' : 'suppliers'}...</span>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-body font-medium text-neutral-900 mb-2">
                    Select {side === 'AR' ? 'customer' : 'supplier'}
                  </label>
                  <select
                    value={selectedContact}
                    onChange={(e) => handleContactSelection(e.target.value)}
                    disabled={loadingXeroInvoices}
                    className="w-full px-4 py-3 rounded-md border-2 border-neutral-300 bg-white text-body text-neutral-900
                               focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-short hover:border-neutral-400"
                  >
                    <option value="">Choose a {side === 'AR' ? 'customer' : 'supplier'}...</option>
                    {xeroContacts.map(contact => (
                      <option key={contact.ContactID} value={contact.ContactID}>
                        {contact.Name}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingXeroInvoices && (
                  <div className="flex items-center justify-center py-4 bg-blue-50 rounded-md">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-blue-900">Loading {side === 'AR' ? 'invoices' : 'bills'}...</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CSV Upload */}
        {dataSourceType === 'csv' && (
          <div className="space-y-4 pt-2">
            {/* Date Format Selection */}
            <div>
              <label className="block text-body font-medium text-neutral-900 mb-2">
                Select Date Format in Your CSV
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="w-full px-4 py-3 rounded-md border-2 border-neutral-300 bg-white text-body text-neutral-900
                           focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500
                           transition-all duration-short hover:border-neutral-400"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/01/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 01/31/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2024-01-31)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (e.g., 31-01-2024)</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY (e.g., 01-31-2024)</option>
              </select>
              <p className="text-xs text-neutral-600 mt-1">
                ⚠️ Important: Select the date format used in YOUR CSV file
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-body font-medium text-neutral-900 mb-2">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                disabled={uploadingCsv}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvUpload(file);
                }}
                className="block w-full text-sm text-neutral-700
                          file:mr-4 file:py-3 file:px-6
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-secondary-600 file:text-white
                          hover:file:bg-secondary-700
                          file:cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed
                          border-2 border-dashed border-neutral-300 rounded-md p-3
                          hover:border-secondary-400 transition-colors"
              />
              
              {uploadingCsv && (
                <div className="flex items-center mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-small text-blue-900">Processing CSV...</span>
                </div>
              )}
            </div>

            {/* Connect to Counterparty Button */}
            {!isCounterpartyLocked && onConnectCounterparty && (
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-small text-neutral-600 mb-3">
                  Does this {side === 'AR' ? 'customer' : 'supplier'} use LedgerLink?
                </p>
                <Button
                  variant="ghost"
                  onClick={onConnectCounterparty}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect to Counterparty
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceBox;
