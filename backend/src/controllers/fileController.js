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

// Parse CSV file and return transactions
export const parseCSV = async (filePath, dateFormat = 'YYYY-MM-DD') => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        // Map CSV row to transaction format
        const transaction = mapCSVToTransaction(data, dateFormat);
        if (transaction) {
          results.push(transaction);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Parse CSV data from buffer and return transactions
export const parseCSVBuffer = async (buffer, dateFormat = 'YYYY-MM-DD') => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Create a readable stream from the buffer
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csvParser())
      .on('data', (data) => {
        // Map CSV row to transaction format
        const transaction = mapCSVToTransaction(data, dateFormat);
        if (transaction) {
          results.push(transaction);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Map CSV row to transaction object
const mapCSVToTransaction = (row, dateFormat) => {
  // Normalize keys to lowercase
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    normalizedRow[key.toLowerCase().trim()] = row[key];
  });
  
  // Check for required fields
  const transactionNumber = 
    normalizedRow['transaction_number'] || 
    normalizedRow['id'] || 
    normalizedRow['reference_number'] || 
    normalizedRow['reference'] || 
    null;
  
  const amount = parseFloat(
    normalizedRow['amount'] || 
    normalizedRow['value'] || 
    '0'
  );
  
  const dateValue = 
    normalizedRow['date'] || 
    normalizedRow['transaction_date'] || 
    normalizedRow['invoice_date'] || 
    null;
  
  // If any required field is missing, skip this row
  if (!transactionNumber || isNaN(amount) || !dateValue) {
    console.warn('Skipping CSV row due to missing required fields:', row);
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
      date = new Date(dateValue);
    }
  } catch (error) {
    console.warn('Error parsing date, using current date:', error);
    date = new Date(); // Fallback to current date
  }
  
  return {
    transactionNumber,
    amount,
    date,
    reference: normalizedRow['reference'] || transactionNumber,
    description: normalizedRow['description'] || normalizedRow['notes'] || '',
    status: normalizedRow['status'] || 'pending',
    source: 'CSV'
  };
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