import multer from 'multer';
import csvParser from 'csv-parser';
import Papa from 'papaparse';
import fs from 'fs';
import { Readable } from 'stream';
import path from 'path';
import os from 'os';

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create a temp directory for uploads
    const tempDir = path.join(os.tmpdir(), 'ledgerlink-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create the multer instance for handling file uploads
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Debug utility to print file contents for troubleshooting
const debugFileContents = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File preview (first 500 chars):', content.substring(0, 500));
    console.log('File size:', content.length, 'bytes');
    // Try to detect column structure
    const firstLine = content.split('\n')[0];
    console.log('Headers:', firstLine);
    
    // Peek at second line to see data format
    const secondLine = content.split('\n')[1];
    if (secondLine) {
      console.log('First data row:', secondLine);
    }
  } catch (error) {
    console.error('Error reading file for debug:', error);
  }
};

// Parse CSV file and return transactions
export const parseCSV = async (filePath, dateFormat = 'YYYY-MM-DD') => {
  console.log('Starting to parse CSV file at path:', filePath, 'with date format:', dateFormat);
  // First try with Papa Parse for more robust parsing
  return new Promise((resolve, reject) => {
    try {
      // Debug file contents first
      debugFileContents(filePath);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Use Papa Parse for more robust CSV parsing
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Convert numbers and booleans automatically
        transformHeader: header => header ? header.trim() : header,
        transform: function(value, field) {
          // Trim all string values
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        }
      });
      
      console.log(`CSV parsed with PapaParse: ${parseResult.data.length} rows found`);
      console.log('Sample data (first 2 rows):', parseResult.data.slice(0, 2));
      
      // Check for parsing errors
      if (parseResult.errors && parseResult.errors.length > 0) {
        console.warn('PapaParse encountered errors:', parseResult.errors);
      }
      
      // Map data to transaction format
      const transactions = [];
      parseResult.data.forEach((row, index) => {
        try {
          // Skip empty rows
          if (Object.keys(row).length === 0 || 
              (Object.keys(row).length === 1 && Object.values(row)[0] === null)) {
            return;
          }
          
          const transaction = mapCSVToTransaction(row, dateFormat);
          if (transaction) {
            transactions.push(transaction);
          } else {
            console.warn(`Row ${index + 1}: Could not map to transaction format`, row);
          }
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error, row);
        }
      });
      
      console.log(`Successfully created ${transactions.length} transactions from CSV`);
      resolve(transactions);
      
    } catch (error) {
      console.error('Error using PapaParse to parse CSV:', error);
      
      // Fall back to the old method if Papa Parse fails
      console.log('Falling back to legacy CSV parsing method...');
      
      const results = [];
      const errors = [];
      let rowCount = 0;
      
      fs.createReadStream(filePath)
        .pipe(csvParser({strict: false, skipLines: 0}))
        .on('data', (data) => {
          rowCount++;
          // Debug the raw data
          if (rowCount <= 3) {
            console.log(`CSV Row ${rowCount}:`, data);
          }
          
          // Map CSV row to transaction format
          try {
            const transaction = mapCSVToTransaction(data, dateFormat);
            if (transaction) {
              results.push(transaction);
            } else {
              errors.push(`Row ${rowCount}: Unable to map to transaction`);
            }
          } catch (error) {
            console.error(`Error processing row ${rowCount}:`, error);
            errors.push(`Row ${rowCount}: ${error.message}`);
          }
        })
        .on('end', () => {
          console.log(`Legacy CSV parsing complete: ${results.length} valid transactions from ${rowCount} rows`);
          if (errors.length > 0) {
            console.log(`Encountered ${errors.length} errors:`, errors.slice(0, 5));
          }
          resolve(results);
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        });
    }
  });
};

// Parse CSV data from buffer and return transactions
export const parseCSVBuffer = async (buffer, dateFormat = 'YYYY-MM-DD') => {
  console.log('Starting to parse CSV from buffer with date format:', dateFormat);
  return new Promise((resolve, reject) => {
    try {
      // Convert buffer to string
      const csvString = buffer.toString('utf8');
      
      // Use Papa Parse for more reliable parsing
      const parseResult = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header ? header.trim() : header,
        transform: function(value, field) {
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        }
      });
      
      console.log(`CSV buffer parsed with PapaParse: ${parseResult.data.length} rows found`);
      console.log('Sample data (first 3 rows):', parseResult.data.slice(0, 3));
      
      // Check for parsing errors
      if (parseResult.errors && parseResult.errors.length > 0) {
        console.warn('PapaParse encountered errors:', parseResult.errors);
      }
      
      // Map data to transaction format
      const transactions = [];
      parseResult.data.forEach((row, index) => {
        try {
          // Skip empty rows
          if (Object.keys(row).length === 0 || 
              (Object.keys(row).length === 1 && Object.values(row)[0] === null)) {
            return;
          }
          
          const transaction = mapCSVToTransaction(row, dateFormat);
          if (transaction) {
            transactions.push(transaction);
          } else {
            console.warn(`Row ${index + 1}: Could not map to transaction format`, row);
          }
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error, row);
        }
      });
      
      console.log(`Successfully created ${transactions.length} transactions from CSV buffer`);
      resolve(transactions);
      
    } catch (papaError) {
      console.error('Error using PapaParse to parse CSV buffer:', papaError);
      
      // Fall back to the old method if Papa Parse fails
      console.log('Falling back to legacy CSV buffer parsing method...');
      
      const results = [];
      const errors = [];
      let rowCount = 0;
      
      // Create a readable stream from the buffer
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csvParser({strict: false, skipLines: 0}))
        .on('data', (data) => {
          rowCount++;
          // Debug the raw data for first few rows
          if (rowCount <= 3) {
            console.log(`CSV Row ${rowCount}:`, data);
          }
          
          // Map CSV row to transaction format
          try {
            const transaction = mapCSVToTransaction(data, dateFormat);
            if (transaction) {
              results.push(transaction);
            } else {
              errors.push(`Row ${rowCount}: Unable to map to transaction`);
            }
          } catch (error) {
            console.error(`Error processing row ${rowCount}:`, error);
            errors.push(`Row ${rowCount}: ${error.message}`);
          }
        })
        .on('end', () => {
          console.log(`Legacy CSV buffer parsing complete: ${results.length} valid transactions from ${rowCount} rows`);
          if (errors.length > 0) {
            console.log(`Encountered ${errors.length} errors:`, errors.slice(0, 5));
          }
          resolve(results);
        })
        .on('error', (error) => {
          console.error('CSV buffer parsing error:', error);
          reject(error);
        });
    }
  });
};

// Map CSV row to transaction object
const mapCSVToTransaction = (row, dateFormat) => {
  // Improved debugging
  console.log('Processing row:', row);
  
  // Normalize keys to lowercase and trim
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    if (key !== null && key !== undefined) {
      // Skip null or empty keys
      if (key.trim && key.trim() === '') return;
      
      // Normalize key name
      const normalizedKey = typeof key === 'string' ? key.toLowerCase().trim() : key;
      
      // Normalize value
      let value = row[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          value = value.trim();
        }
      }
      
      normalizedRow[normalizedKey] = value;
    }
  });
  
  console.log('Normalized row:', normalizedRow);
  
  // Check if row is empty (all values null or empty string)
  const hasValues = Object.values(normalizedRow).some(
    val => val !== null && val !== undefined && val !== ''
  );
  
  if (!hasValues) {
    console.log('Skipping empty row');
    return null;
  }
  
  // Try to identify columns by common variations - More extensive than before
  // Transaction number/ID fields
  const transactionNumber = 
    normalizedRow['transaction_number'] || 
    normalizedRow['transaction number'] || 
    normalizedRow['id'] || 
    normalizedRow['invoice_number'] || 
    normalizedRow['invoice number'] ||
    normalizedRow['reference_number'] || 
    normalizedRow['reference'] || 
    normalizedRow['transaction id'] ||
    normalizedRow['transactionid'] ||
    normalizedRow['invoice #'] ||
    normalizedRow['no.'] ||
    normalizedRow['number'] ||
    normalizedRow['invoice'] ||
    normalizedRow['inv no'] ||
    normalizedRow['inv #'] ||
    null;
  
  // Amount fields
  const amountValue = 
    normalizedRow['amount'] || 
    normalizedRow['value'] || 
    normalizedRow['total'] ||
    normalizedRow['debit'] ||
    normalizedRow['credit'] ||
    normalizedRow['invoice amount'] ||
    normalizedRow['invoice_amount'] ||
    normalizedRow['payment'] ||
    normalizedRow['amount (debit)'] ||
    normalizedRow['amount (credit)'] ||
    normalizedRow['paid amount'] ||
    normalizedRow['payment amount'] ||
    null;
  
  let amount = null;
  if (amountValue !== null) {
    // Handle amount format variations
    if (typeof amountValue === 'string') {
      // Remove currency symbols and commas, then parse
      const cleanAmount = amountValue.replace(/[$,£€\s]/g, '');
      amount = parseFloat(cleanAmount);
    } else if (typeof amountValue === 'number') {
      amount = amountValue;
    }
  }
  
  // Date fields - Fix: Also check issue_date which is present in our CSV
  const dateValue = 
    normalizedRow['date'] || 
    normalizedRow['transaction_date'] || 
    normalizedRow['transaction date'] ||
    normalizedRow['invoice_date'] || 
    normalizedRow['invoice date'] ||
    normalizedRow['issue_date'] ||  // This was missing in the previous version
    normalizedRow['doc date'] ||
    normalizedRow['document date'] ||
    normalizedRow['posting date'] ||
    normalizedRow['payment date'] ||
    normalizedRow['due date'] ||
    normalizedRow['duedate'] ||
    null;
  
  // For debugging - show what we've extracted from the row
  console.log('Extracted fields:', {
    transactionNumber,
    amount,
    dateValue
  });
  
  // Allow more flexibility in transaction number - it's ok if we only have amount and date
  // This is more permissive than the original code
  if (!transactionNumber) {
    console.warn('Missing transaction number/ID in row. Using row index or timestamp as fallback.');
    // Create a fallback transaction ID based on timestamp
    const fallbackId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log(`Created fallback transaction ID: ${fallbackId}`);
    // This is more permissive, allowing rows without transaction IDs
  }
  
  if (amount === null || isNaN(amount)) {
    console.warn('Missing or invalid amount in row:', row, 'Extracted amount value:', amountValue);
    return null;
  }
  
  if (!dateValue) {
    console.warn('Missing date in row:', row);
    // We're more permissive now - if we have an amount and transaction number, we'll continue
    // Use current date as fallback
    const currentDate = new Date();
    console.log(`Using current date (${currentDate.toISOString()}) as fallback`);
  }
  
  // Parse date based on the specified format
  let date;
  try {
    if (dateValue) {
      console.log(`Parsing date value: ${dateValue} with format: ${dateFormat}`);
      
      // Simple date parsing based on format
      if (dateFormat === 'MM/DD/YYYY') {
        const [month, day, year] = dateValue.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateFormat === 'DD/MM/YYYY') {
        const [day, month, year] = dateValue.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateFormat === 'YYYY-MM-DD') {
        date = new Date(dateValue);
      } else if (dateFormat === 'MM-DD-YYYY') {
        const [month, day, year] = dateValue.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateFormat === 'DD-MM-YYYY') {
        const [day, month, year] = dateValue.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Default to ISO format
        date = new Date(dateValue);
      }
      
      console.log(`Parsed date: ${date}`);
      
      // If date is invalid, try a more flexible approach
      if (isNaN(date.getTime())) {
        console.warn('Invalid date using specified format, trying flexible parsing for:', dateValue);
        // Try common date formats
        date = new Date(dateValue);
        
        // If still invalid, we'll fall back to current date below
        if (isNaN(date.getTime())) {
          throw new Error(`Cannot parse date: ${dateValue}`);
        }
      }
    } else {
      // No date value provided, use current date
      date = new Date();
    }
  } catch (error) {
    console.warn('Error parsing date, using current date:', error);
    date = new Date(); // Fallback to current date
  }
  
  // Get description field with various possible names
  const description = 
    normalizedRow['description'] || 
    normalizedRow['desc'] || 
    normalizedRow['notes'] || 
    normalizedRow['memo'] ||
    normalizedRow['narrative'] ||
    normalizedRow['details'] ||
    normalizedRow['transaction description'] ||
    normalizedRow['comment'] ||
    '';
  
  // Extract reference if separate from transaction number
  const reference = 
    normalizedRow['reference'] || 
    normalizedRow['ref'] || 
    normalizedRow['reference number'] ||
    normalizedRow['ref number'] ||
    normalizedRow['document number'] ||
    normalizedRow['doc number'] ||
    transactionNumber || 
    `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`; // Fallback
  
  // Build the transaction object
  const transaction = {
    transactionNumber: transactionNumber || reference, // Use reference as fallback
    amount,
    date,
    reference,
    description,
    status: normalizedRow['status'] || 'pending',
    source: 'CSV'
  };
  
  console.log('Created transaction object:', transaction);
  return transaction;
};

// Delete temp file after processing
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting temp file:', error);
  }
};