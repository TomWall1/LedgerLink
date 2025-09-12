const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Helper function to parse dates based on format
const parseDate = (dateString, format) => {
  if (!dateString) return null;
  
  // Try parsing with the specified format first
  let date = moment(dateString, format, true);
  
  // If that fails, try common formats
  if (!date.isValid()) {
    const commonFormats = [
      'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD',
      'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY',
      'YYYY/MM/DD', 'DD/MM/YY', 'MM/DD/YY'
    ];
    
    for (const fmt of commonFormats) {
      date = moment(dateString, fmt, true);
      if (date.isValid()) break;
    }
  }
  
  return date.isValid() ? date.toDate() : null;
};

// Helper function to identify CSV columns
const identifyColumns = (headers) => {
  const columnMap = {};
  
  // Define possible column names for each data type
  const columnMappings = {
    amount: ['amount', 'value', 'total', 'payment_amount', 'sum', 'cost', 'price'],
    date: ['date', 'transaction_date', 'invoice_date', 'payment_date', 'created_date', 'timestamp'],
    reference: ['reference', 'transaction_number', 'id', 'invoice_number', 'ref', 'transaction_id'],
    description: ['description', 'memo', 'note', 'particulars', 'details', 'comment']
  };
  
  // Find the best match for each column type
  for (const [type, possibleNames] of Object.entries(columnMappings)) {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim().replace(/[\s_-]/g, '');
      const found = possibleNames.find(name => 
        normalizedHeader.includes(name.replace(/[\s_-]/g, '')) ||
        name.replace(/[\s_-]/g, '').includes(normalizedHeader)
      );
      
      if (found) {
        columnMap[type] = header;
        break;
      }
    }
  }
  
  return columnMap;
};

// Helper function to calculate match confidence
const calculateMatchConfidence = (transaction, invoice) => {
  let confidence = 0;
  
  // Amount matching (50% weight)
  const amountDiff = Math.abs(transaction.amount - invoice.amount);
  const amountTolerance = Math.max(invoice.amount * 0.01, 0.01); // 1% or 1 cent tolerance
  
  if (amountDiff <= amountTolerance) {
    confidence += 50;
  } else if (amountDiff <= invoice.amount * 0.05) { // 5% tolerance
    confidence += 30;
  } else if (amountDiff <= invoice.amount * 0.10) { // 10% tolerance
    confidence += 15;
  }
  
  // Date proximity (30% weight)
  if (transaction.date && invoice.issueDate) {
    const daysDiff = Math.abs(moment(transaction.date).diff(moment(invoice.issueDate), 'days'));
    
    if (daysDiff <= 7) {
      confidence += 30;
    } else if (daysDiff <= 14) {
      confidence += 20;
    } else if (daysDiff <= 30) {
      confidence += 10;
    }
  }
  
  // Reference matching (20% weight)
  if (transaction.reference && invoice.reference) {
    const transRef = transaction.reference.toLowerCase().replace(/[^a-z0-9]/g, '');
    const invRef = invoice.reference.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (transRef.includes(invRef) || invRef.includes(transRef)) {
      confidence += 20;
    } else if (transRef && invRef) {
      // Check for partial matches
      const commonChars = transRef.split('').filter(char => invRef.includes(char)).length;
      const similarity = commonChars / Math.max(transRef.length, invRef.length);
      
      if (similarity > 0.5) {
        confidence += 10;
      }
    }
  }
  
  return Math.min(confidence, 100); // Cap at 100%
};

// Route to match customer invoices with CSV transactions
router.post('/match-customer-invoices', upload.single('file'), async (req, res) => {
  try {
    const { customerId, dateFormat, useHistoricalData } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    console.log('Processing file:', file.filename, 'for customer:', customerId);
    console.log('Date format:', dateFormat, 'Use historical:', useHistoricalData);
    
    // Get customer invoices from Xero
    const xeroResponse = await fetch(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/xero/customers/${customerId}/invoices`, {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });
    
    if (!xeroResponse.ok) {
      throw new Error('Failed to fetch customer invoices from Xero');
    }
    
    const xeroInvoices = await xeroResponse.json();
    console.log('Fetched', xeroInvoices.length, 'invoices from Xero');
    
    // Parse CSV file
    const transactions = [];
    const filePath = file.path;
    
    return new Promise((resolve, reject) => {
      let headers = [];
      let isFirstRow = true;
      
      fs.createReadStream(filePath)
        .pipe(csv({ skipEmptyLines: true }))
        .on('headers', (headerList) => {
          headers = headerList;
          console.log('CSV headers:', headers);
        })
        .on('data', (row) => {
          if (isFirstRow) {
            isFirstRow = false;
            return; // Skip header row if it contains header names
          }
          
          // Identify column mappings
          const columnMap = identifyColumns(headers);
          console.log('Column mappings:', columnMap);
          
          // Extract transaction data
          const transaction = {
            amount: parseFloat(row[columnMap.amount]) || 0,
            date: parseDate(row[columnMap.date], dateFormat),
            reference: row[columnMap.reference] || '',
            description: row[columnMap.description] || '',
            rawData: row
          };
          
          if (transaction.amount > 0) {
            transactions.push(transaction);
          }
        })
        .on('end', () => {
          console.log('Parsed', transactions.length, 'transactions from CSV');
          
          // Find potential matches
          const matches = [];
          
          transactions.forEach((transaction, transIndex) => {
            xeroInvoices.forEach((invoice) => {
              const confidence = calculateMatchConfidence(transaction, {
                amount: parseFloat(invoice.total),
                issueDate: new Date(invoice.date || invoice.dateString),
                dueDate: new Date(invoice.dueDate || invoice.dueDateString),
                reference: invoice.reference || invoice.invoiceNumber
              });
              
              // Only include matches with reasonable confidence
              if (confidence >= 30) {
                matches.push({
                  id: `match-${transIndex}-${invoice.invoiceID}`,
                  confidence: confidence,
                  transaction: transaction,
                  invoice: {
                    id: invoice.invoiceID,
                    type: invoice.type,
                    amount: parseFloat(invoice.total),
                    issueDate: invoice.date || invoice.dateString,
                    dueDate: invoice.dueDate || invoice.dueDateString,
                    status: invoice.status,
                    reference: invoice.reference || invoice.invoiceNumber
                  }
                });
              }
            });
          });
          
          // Sort matches by confidence (highest first)
          matches.sort((a, b) => b.confidence - a.confidence);
          
          console.log('Found', matches.length, 'potential matches');
          
          // Clean up uploaded file
          fs.unlinkSync(filePath);
          
          res.json({
            success: true,
            matches: matches,
            summary: {
              transactionsProcessed: transactions.length,
              invoicesChecked: xeroInvoices.length,
              matchesFound: matches.length
            }
          });
          
          resolve();
        })
        .on('error', (error) => {
          console.error('Error parsing CSV:', error);
          
          // Clean up uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          res.status(500).json({ error: 'Error parsing CSV file: ' + error.message });
          reject(error);
        });
    });
    
  } catch (error) {
    console.error('Error in match-customer-invoices:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Route to approve a match
router.post('/approve-customer-match', async (req, res) => {
  try {
    const { matchId } = req.body;
    
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' });
    }
    
    // Here you would typically:
    // 1. Update your database to record the approved match
    // 2. Optionally update the invoice status in Xero
    // 3. Create an audit trail
    
    console.log('Approved match:', matchId);
    
    res.json({ 
      success: true, 
      message: 'Match approved successfully',
      matchId: matchId 
    });
    
  } catch (error) {
    console.error('Error approving match:', error);
    res.status(500).json({ error: 'Failed to approve match' });
  }
});

module.exports = router;