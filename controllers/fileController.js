const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { getXeroClient } = require('./xeroController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Parse CSV and extract transactions
const parseCSV = (filePath, dateFormat = 'DD/MM/YYYY') => {
  return new Promise((resolve, reject) => {
    const transactions = [];
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        try {
          // Process the CSV data
          results.forEach((row, index) => {
            const transaction = parseCSVRow(row, dateFormat, index + 1);
            if (transaction) {
              transactions.push(transaction);
            }
          });
          
          console.log(`Parsed ${transactions.length} valid transactions from CSV`);
          resolve(transactions);
        } catch (error) {
          console.error('Error parsing CSV data:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
};

// Parse individual CSV row
const parseCSVRow = (row, dateFormat, rowNumber) => {
  try {
    // Clean up the row keys (remove extra spaces, convert to lowercase)
    const cleanRow = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.trim().toLowerCase();
      cleanRow[cleanKey] = row[key];
    });
    
    // Find amount field (various possible names)
    const amountField = findField(cleanRow, [
      'amount', 'value', 'total', 'debit', 'credit', 'payment_amount',
      'transaction_amount', 'invoice_amount', 'sum', 'net_amount'
    ]);
    
    if (!amountField) {
      console.warn(`Row ${rowNumber}: No amount field found`);
      return null;
    }
    
    // Parse amount
    let amount = cleanRow[amountField];
    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      amount = amount.replace(/[^\d.-]/g, '');
    }
    amount = parseFloat(amount);
    
    if (isNaN(amount) || amount === 0) {
      console.warn(`Row ${rowNumber}: Invalid amount: ${cleanRow[amountField]}`);
      return null;
    }
    
    // Find date field
    const dateField = findField(cleanRow, [
      'date', 'transaction_date', 'invoice_date', 'payment_date',
      'due_date', 'issue_date', 'created_date', 'posted_date'
    ]);
    
    if (!dateField) {
      console.warn(`Row ${rowNumber}: No date field found`);
      return null;
    }
    
    // Parse date
    const dateValue = cleanRow[dateField];
    let parsedDate;
    
    try {
      parsedDate = moment(dateValue, dateFormat).toDate();
      if (!moment(parsedDate).isValid()) {
        // Try parsing with automatic detection
        parsedDate = moment(dateValue).toDate();
      }
    } catch (error) {
      console.warn(`Row ${rowNumber}: Invalid date format: ${dateValue}`);
      return null;
    }
    
    if (!moment(parsedDate).isValid()) {
      console.warn(`Row ${rowNumber}: Could not parse date: ${dateValue}`);
      return null;
    }
    
    // Find reference field
    const referenceField = findField(cleanRow, [
      'reference', 'ref', 'transaction_number', 'transaction_id', 'id',
      'invoice_number', 'payment_reference', 'description', 'memo', 'note'
    ]);
    
    const reference = referenceField ? cleanRow[referenceField] : '';
    
    // Find description field
    const descriptionField = findField(cleanRow, [
      'description', 'memo', 'note', 'details', 'narrative', 'particulars'
    ]);
    
    const description = descriptionField ? cleanRow[descriptionField] : '';
    
    return {
      id: `csv_${rowNumber}`,
      amount: Math.abs(amount), // Use absolute value for matching
      date: parsedDate,
      reference: reference || '',
      description: description || '',
      rawRow: cleanRow,
      rowNumber
    };
  } catch (error) {
    console.error(`Error parsing row ${rowNumber}:`, error);
    return null;
  }
};

// Helper function to find field by various names
const findField = (row, fieldNames) => {
  for (const fieldName of fieldNames) {
    const keys = Object.keys(row);
    const foundKey = keys.find(key => 
      key.toLowerCase().includes(fieldName.toLowerCase()) ||
      fieldName.toLowerCase().includes(key.toLowerCase())
    );
    if (foundKey) {
      return foundKey;
    }
  }
  return null;
};

// Calculate match confidence between transaction and invoice
const calculateMatchConfidence = (transaction, invoice) => {
  let confidence = 0;
  
  // Amount matching (50% of score)
  const amountDiff = Math.abs(transaction.amount - invoice.amount);
  const amountTolerance = Math.max(0.01, invoice.amount * 0.001); // 0.1% tolerance or $0.01 minimum
  
  if (amountDiff <= amountTolerance) {
    confidence += 50; // Exact match
  } else if (amountDiff <= invoice.amount * 0.05) {
    confidence += 30; // Within 5%
  } else if (amountDiff <= invoice.amount * 0.1) {
    confidence += 15; // Within 10%
  }
  
  // Date proximity (30% of score)
  const transactionDate = moment(transaction.date);
  const invoiceIssueDate = moment(invoice.issueDate);
  const invoiceDueDate = moment(invoice.dueDate);
  
  const daysDiffFromIssue = Math.abs(transactionDate.diff(invoiceIssueDate, 'days'));
  const daysDiffFromDue = Math.abs(transactionDate.diff(invoiceDueDate, 'days'));
  const daysDiff = Math.min(daysDiffFromIssue, daysDiffFromDue);
  
  if (daysDiff === 0) {
    confidence += 30; // Same date
  } else if (daysDiff <= 3) {
    confidence += 25; // Within 3 days
  } else if (daysDiff <= 7) {
    confidence += 20; // Within 1 week
  } else if (daysDiff <= 30) {
    confidence += 10; // Within 1 month
  }
  
  // Reference matching (20% of score)
  const transactionRef = (transaction.reference || transaction.description || '').toLowerCase();
  const invoiceRef = (invoice.reference || '').toLowerCase();
  
  if (transactionRef && invoiceRef) {
    if (transactionRef.includes(invoiceRef) || invoiceRef.includes(transactionRef)) {
      confidence += 20; // Reference match
    } else if (extractNumbers(transactionRef).some(num => extractNumbers(invoiceRef).includes(num))) {
      confidence += 10; // Number match in references
    }
  }
  
  return Math.min(100, confidence);
};

// Extract numbers from text
const extractNumbers = (text) => {
  return text.match(/\d+/g) || [];
};

// Match customer invoices with CSV transactions
const matchCustomerInvoices = async (req, res) => {
  try {
    const { customerId, dateFormat, useHistoricalData } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    console.log('Processing file:', file.filename);
    console.log('Customer ID:', customerId);
    console.log('Date format:', dateFormat);
    
    // Parse CSV file
    let transactions;
    try {
      transactions = await parseCSV(file.path, dateFormat);
    } catch (error) {
      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ error: 'Failed to parse CSV file: ' + error.message });
    }
    
    if (transactions.length === 0) {
      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ error: 'No valid transactions found in the CSV file' });
    }
    
    // Get customer invoices from Xero
    let customerInvoices;
    try {
      const xeroClient = await getXeroClient(req);
      const response = await xeroClient.accountingApi.getInvoices(
        req.session.tenantId,
        undefined, // ifModifiedSince
        undefined, // where
        undefined, // order
        undefined, // ids
        undefined, // invoiceNumbers
        [customerId], // contactIDs
        ['AUTHORISED', 'PAID', 'SUBMITTED'] // statuses
      );
      
      customerInvoices = response.body.invoices || [];
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(500).json({ error: 'Failed to fetch customer invoices from Xero' });
    }
    
    if (customerInvoices.length === 0) {
      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ error: 'No invoices found for this customer' });
    }
    
    // Filter invoices based on historical data preference
    let filteredInvoices = customerInvoices;
    if (!useHistoricalData) {
      const cutoffDate = moment().subtract(6, 'months');
      filteredInvoices = customerInvoices.filter(invoice => {
        const invoiceDate = moment(invoice.date);
        return invoiceDate.isAfter(cutoffDate);
      });
    }
    
    console.log(`Found ${filteredInvoices.length} invoices for matching`);
    
    // Find matches
    const matches = [];
    const matchThreshold = 50; // Minimum confidence score
    
    transactions.forEach(transaction => {
      filteredInvoices.forEach(invoice => {
        const confidence = calculateMatchConfidence(transaction, {
          amount: parseFloat(invoice.total),
          issueDate: invoice.date,
          dueDate: invoice.dueDate,
          reference: invoice.invoiceNumber
        });
        
        if (confidence >= matchThreshold) {
          matches.push({
            id: `${transaction.id}_${invoice.invoiceID}`,
            confidence,
            transaction: {
              id: transaction.id,
              amount: transaction.amount,
              date: transaction.date,
              reference: transaction.reference,
              description: transaction.description
            },
            invoice: {
              id: invoice.invoiceID,
              reference: invoice.invoiceNumber,
              amount: parseFloat(invoice.total),
              issueDate: invoice.date,
              dueDate: invoice.dueDate,
              status: invoice.status
            }
          });
        }
      });
    });
    
    // Sort matches by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    // Clean up uploaded file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    console.log(`Found ${matches.length} potential matches`);
    
    res.json({
      success: true,
      matches,
      summary: {
        transactionsProcessed: transactions.length,
        invoicesChecked: filteredInvoices.length,
        matchesFound: matches.length
      }
    });
    
  } catch (error) {
    console.error('Error in matchCustomerInvoices:', error);
    
    // Clean up uploaded file if it exists
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve a customer invoice match
const approveCustomerMatch = async (req, res) => {
  try {
    const { matchId } = req.body;
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' });
    }
    
    // Here you would typically:
    // 1. Update your database to record the match
    // 2. Create a payment record in Xero
    // 3. Update invoice status if needed
    
    console.log(`Match approved: ${matchId}`);
    
    res.json({
      success: true,
      message: 'Match approved successfully'
    });
    
  } catch (error) {
    console.error('Error in approveCustomerMatch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upload,
  parseCSV,
  matchCustomerInvoices,
  approveCustomerMatch
};