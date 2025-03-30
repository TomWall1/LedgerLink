import multer from 'multer';
import csvParser from 'csv-parser';
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
  } catch (error) {
    console.error('Error reading file for debug:', error);
  }
};

// Parse CSV file and return transactions
export const parseCSV = async (filePath, dateFormat = 'YYYY-MM-DD') => {
  return new Promise((resolve, reject) => {
    // Debug file contents
    debugFileContents(filePath);
    
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
        console.log(`CSV parsing complete: ${results.length} valid transactions from ${rowCount} rows`);
        if (errors.length > 0) {
          console.log(`Encountered ${errors.length} errors:`, errors.slice(0, 5));
        }
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        reject(error);
      });
  });
};

// Parse CSV data from buffer and return transactions
export const parseCSVBuffer = async (buffer, dateFormat = 'YYYY-MM-DD') => {
  return new Promise((resolve, reject) => {
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
        console.log(`CSV buffer parsing complete: ${results.length} valid transactions from ${rowCount} rows`);
        if (errors.length > 0) {
          console.log(`Encountered ${errors.length} errors:`, errors.slice(0, 5));
        }
        resolve(results);
      })
      .on('error', (error) => {
        console.error('CSV buffer parsing error:', error);
        reject(error);
      });
  });
};

// Map CSV row to transaction object
const mapCSVToTransaction = (row, dateFormat) => {
  // Improved debugging
  console.log('Processing row:', row);
  
  // Normalize keys to lowercase and trim
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    if (key && key.trim()) {
      const normalizedKey = key.toLowerCase().trim();
      normalizedRow[normalizedKey] = row[key] && typeof row[key] === 'string' ? row[key].trim() : row[key];
    }
  });
  
  console.log('Normalized row:', normalizedRow);
  
  // Try to identify columns by common variations
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
  
  // Date fields
  const dateValue = 
    normalizedRow['date'] || 
    normalizedRow['transaction_date'] || 
    normalizedRow['transaction date'] ||
    normalizedRow['invoice_date'] || 
    normalizedRow['invoice date'] ||
    normalizedRow['due date'] ||
    normalizedRow['duedate'] ||
    null;
  
  // For debugging - show what we've extracted from the row
  console.log('Extracted fields:', {
    transactionNumber,
    amount,
    dateValue
  });
  
  // If any required field is missing, skip this row but provide more detail
  if (!transactionNumber) {
    console.warn('Missing transaction number/ID in row:', row);
    return null;
  }
  
  if (amount === null || isNaN(amount)) {
    console.warn('Missing or invalid amount in row:', row, 'Extracted amount value:', amountValue);
    return null;
  }
  
  if (!dateValue) {
    console.warn('Missing date in row:', row);
    return null;
  }
  
  // Parse date based on the specified format
  let date;
  try {
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
    '';
  
  // Extract reference if separate from transaction number
  const reference = 
    normalizedRow['reference'] || 
    normalizedRow['ref'] || 
    transactionNumber;
  
  // Build the transaction object
  const transaction = {
    transactionNumber,
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
    }
  } catch (error) {
    console.error('Error deleting temp file:', error);
  }
};