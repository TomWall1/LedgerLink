const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import route modules
const counterpartyRoutes = require('./routes/counterparty');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Register API routes
app.use('/api/counterparty', counterpartyRoutes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Utility function to parse files
const parseFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(filePath).toLowerCase();
    const results = [];

    if (ext === '.csv') {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          fs.unlinkSync(filePath); // Clean up uploaded file
          resolve(results);
        })
        .on('error', reject);
    } else if (ext === '.xlsx' || ext === '.xls') {
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        fs.unlinkSync(filePath); // Clean up uploaded file
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error('Unsupported file format'));
    }
  });
};

// Normalize data function
const normalizeData = (data, source) => {
  return data.map(record => {
    // Create a normalized object with standard field names
    const normalized = {
      invoiceNumber: '',
      amount: 0,
      date: '',
      vendor: '',
      status: '',
      source: source
    };

    // Find invoice number (case-insensitive)
    const invoiceFields = ['invoice_number', 'invoicenumber', 'invoice', 'inv_no', 'invoice_no', 'Invoice Number', 'Invoice ID'];
    for (const field of invoiceFields) {
      const value = record[field] || record[field.toUpperCase()] || record[field.toLowerCase()];
      if (value) {
        normalized.invoiceNumber = String(value).trim();
        break;
      }
    }

    // Find amount (case-insensitive)
    const amountFields = ['amount', 'total', 'invoice_amount', 'total_amount', 'Amount', 'Total', 'Invoice Amount'];
    for (const field of amountFields) {
      const value = record[field] || record[field.toUpperCase()] || record[field.toLowerCase()];
      if (value !== undefined && value !== '') {
        // Remove currency symbols and convert to number
        const cleanAmount = String(value).replace(/[$,]/g, '');
        const numAmount = parseFloat(cleanAmount);
        if (!isNaN(numAmount)) {
          normalized.amount = numAmount;
          break;
        }
      }
    }

    // Find date
    const dateFields = ['date', 'invoice_date', 'created_date', 'Date', 'Invoice Date', 'Created Date'];
    for (const field of dateFields) {
      const value = record[field] || record[field.toUpperCase()] || record[field.toLowerCase()];
      if (value) {
        normalized.date = String(value).trim();
        break;
      }
    }

    // Find vendor
    const vendorFields = ['vendor', 'supplier', 'vendor_name', 'supplier_name', 'Vendor', 'Supplier', 'Vendor Name'];
    for (const field of vendorFields) {
      const value = record[field] || record[field.toUpperCase()] || record[field.toLowerCase()];
      if (value) {
        normalized.vendor = String(value).trim();
        break;
      }
    }

    // Find status
    const statusFields = ['status', 'approval_status', 'ar_status', 'Status', 'Approval Status', 'AR Status'];
    for (const field of statusFields) {
      const value = record[field] || record[field.toUpperCase()] || record[field.toLowerCase()];
      if (value) {
        normalized.status = String(value).trim();
        break;
      }
    }

    return normalized;
  }).filter(record => record.invoiceNumber && record.amount > 0); // Only include records with valid invoice number and amount
};

// String similarity function for fuzzy matching
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Intelligent matching algorithm
const matchRecords = (coupaData, netsuiteData) => {
  const matched = [];
  const unmatchedCoupa = [...coupaData];
  const unmatchedNetsuite = [...netsuiteData];
  
  // First pass: Exact invoice number matches
  for (let i = unmatchedCoupa.length - 1; i >= 0; i--) {
    const coupaRecord = unmatchedCoupa[i];
    
    for (let j = unmatchedNetsuite.length - 1; j >= 0; j--) {
      const netsuiteRecord = unmatchedNetsuite[j];
      
      if (coupaRecord.invoiceNumber === netsuiteRecord.invoiceNumber) {
        matched.push({
          invoiceNumber: coupaRecord.invoiceNumber,
          coupaAmount: coupaRecord.amount,
          netsuiteAmount: netsuiteRecord.amount,
          difference: coupaRecord.amount - netsuiteRecord.amount,
          vendor: coupaRecord.vendor || netsuiteRecord.vendor,
          confidence: 1.0,
          matchType: 'exact_invoice'
        });
        
        unmatchedCoupa.splice(i, 1);
        unmatchedNetsuite.splice(j, 1);
        break;
      }
    }
  }
  
  // Second pass: Fuzzy invoice number + amount matching
  for (let i = unmatchedCoupa.length - 1; i >= 0; i--) {
    const coupaRecord = unmatchedCoupa[i];
    let bestMatch = null;
    let bestScore = 0;
    let bestIndex = -1;
    
    for (let j = 0; j < unmatchedNetsuite.length; j++) {
      const netsuiteRecord = unmatchedNetsuite[j];
      
      // Calculate match score based on multiple factors
      const invoiceSimilarity = calculateSimilarity(coupaRecord.invoiceNumber, netsuiteRecord.invoiceNumber);
      const amountDifference = Math.abs(coupaRecord.amount - netsuiteRecord.amount);
      const amountSimilarity = amountDifference < 0.01 ? 1 : (amountDifference < 1 ? 0.9 : (amountDifference < 10 ? 0.7 : 0.3));
      const vendorSimilarity = calculateSimilarity(coupaRecord.vendor, netsuiteRecord.vendor);
      
      // Weighted score calculation
      const totalScore = (invoiceSimilarity * 0.5) + (amountSimilarity * 0.3) + (vendorSimilarity * 0.2);
      
      // Only consider matches above threshold
      if (totalScore > 0.7 && totalScore > bestScore) {
        bestMatch = netsuiteRecord;
        bestScore = totalScore;
        bestIndex = j;
      }
    }
    
    if (bestMatch && bestScore > 0.7) {
      matched.push({
        invoiceNumber: coupaRecord.invoiceNumber,
        coupaAmount: coupaRecord.amount,
        netsuiteAmount: bestMatch.amount,
        difference: coupaRecord.amount - bestMatch.amount,
        vendor: coupaRecord.vendor || bestMatch.vendor,
        confidence: bestScore,
        matchType: 'fuzzy'
      });
      
      unmatchedCoupa.splice(i, 1);
      unmatchedNetsuite.splice(bestIndex, 1);
    }
  }
  
  return {
    matched,
    unmatchedCoupa,
    unmatchedNetsuite
  };
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LedgerLink API is running' });
});

// Coupa file upload
app.post('/api/coupa/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const data = await parseFile(req.file.path);
    const normalizedData = normalizeData(data, 'coupa');
    
    res.json({
      message: 'Coupa data uploaded successfully',
      data: normalizedData,
      count: normalizedData.length
    });
  } catch (error) {
    console.error('Error uploading Coupa file:', error);
    res.status(500).json({ error: 'Failed to process Coupa file: ' + error.message });
  }
});

// NetSuite file upload
app.post('/api/netsuite/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const data = await parseFile(req.file.path);
    const normalizedData = normalizeData(data, 'netsuite');
    
    res.json({
      message: 'NetSuite data uploaded successfully',
      data: normalizedData,
      count: normalizedData.length
    });
  } catch (error) {
    console.error('Error uploading NetSuite file:', error);
    res.status(500).json({ error: 'Failed to process NetSuite file: ' + error.message });
  }
});

// Match records
app.post('/api/match', (req, res) => {
  try {
    const { coupaData, netsuiteData } = req.body;
    
    if (!coupaData || !netsuiteData) {
      return res.status(400).json({ error: 'Both Coupa and NetSuite data are required' });
    }
    
    const results = matchRecords(coupaData, netsuiteData);
    
    res.json({
      message: 'Matching completed successfully',
      ...results,
      summary: {
        totalCoupaRecords: coupaData.length,
        totalNetsuiteRecords: netsuiteData.length,
        matchedRecords: results.matched.length,
        unmatchedCoupaRecords: results.unmatchedCoupa.length,
        unmatchedNetsuiteRecords: results.unmatchedNetsuite.length,
        matchRate: ((results.matched.length / coupaData.length) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('Error matching records:', error);
    res.status(500).json({ error: 'Failed to match records: ' + error.message });
  }
});

// Export to CSV
app.post('/api/export/csv', async (req, res) => {
  try {
    const { matched, unmatchedCoupa, unmatchedNetsuite } = req.body;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reconciliation-${timestamp}.csv`;
    const filepath = path.join(uploadsDir, filename);
    
    // Prepare data for CSV export
    const csvData = [];
    
    // Add matched records
    matched.forEach(record => {
      csvData.push({
        Type: 'Matched',
        InvoiceNumber: record.invoiceNumber,
        CoupaAmount: record.coupaAmount,
        NetSuiteAmount: record.netsuiteAmount,
        Difference: record.difference,
        Vendor: record.vendor,
        Confidence: (record.confidence * 100).toFixed(1) + '%',
        Status: Math.abs(record.difference) < 0.01 ? 'Perfect Match' : 'Amount Variance'
      });
    });
    
    // Add unmatched Coupa records
    unmatchedCoupa.forEach(record => {
      csvData.push({
        Type: 'Unmatched Coupa',
        InvoiceNumber: record.invoiceNumber,
        CoupaAmount: record.amount,
        NetSuiteAmount: '',
        Difference: '',
        Vendor: record.vendor,
        Confidence: '',
        Status: 'Unmatched'
      });
    });
    
    // Add unmatched NetSuite records
    unmatchedNetsuite.forEach(record => {
      csvData.push({
        Type: 'Unmatched NetSuite',
        InvoiceNumber: record.invoiceNumber,
        CoupaAmount: '',
        NetSuiteAmount: record.amount,
        Difference: '',
        Vendor: record.vendor,
        Confidence: '',
        Status: 'Unmatched'
      });
    });
    
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'Type', title: 'Record Type' },
        { id: 'InvoiceNumber', title: 'Invoice Number' },
        { id: 'CoupaAmount', title: 'Coupa Amount' },
        { id: 'NetSuiteAmount', title: 'NetSuite Amount' },
        { id: 'Difference', title: 'Difference' },
        { id: 'Vendor', title: 'Vendor' },
        { id: 'Confidence', title: 'Match Confidence' },
        { id: 'Status', title: 'Status' }
      ]
    });
    
    await csvWriter.writeRecords(csvData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up the file after download
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
    
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV: ' + error.message });
  }
});

// Export to Excel
app.post('/api/export/excel', async (req, res) => {
  try {
    const { matched, unmatchedCoupa, unmatchedNetsuite } = req.body;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reconciliation-${timestamp}.xlsx`;
    const filepath = path.join(uploadsDir, filename);
    
    // Create workbook with multiple sheets
    const workbook = xlsx.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Coupa-NetSuite Reconciliation Summary'],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Metric', 'Count', 'Percentage'],
      ['Total Coupa Records', matched.length + unmatchedCoupa.length, '100%'],
      ['Matched Records', matched.length, ((matched.length / (matched.length + unmatchedCoupa.length)) * 100).toFixed(1) + '%'],
      ['Unmatched Coupa', unmatchedCoupa.length, ((unmatchedCoupa.length / (matched.length + unmatchedCoupa.length)) * 100).toFixed(1) + '%'],
      ['Unmatched NetSuite', unmatchedNetsuite.length, 'N/A'],
      [''],
      ['Amount Analysis'],
      ['Perfect Matches', matched.filter(m => Math.abs(m.difference) < 0.01).length],
      ['Amount Variances', matched.filter(m => Math.abs(m.difference) >= 0.01).length],
      ['Total Variance Amount', '$' + matched.reduce((sum, m) => sum + Math.abs(m.difference), 0).toFixed(2)]
    ];
    
    const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Matched records sheet
    if (matched.length > 0) {
      const matchedSheet = xlsx.utils.json_to_sheet(matched.map(record => ({
        'Invoice Number': record.invoiceNumber,
        'Coupa Amount': record.coupaAmount,
        'NetSuite Amount': record.netsuiteAmount,
        'Difference': record.difference,
        'Vendor': record.vendor,
        'Match Confidence': (record.confidence * 100).toFixed(1) + '%',
        'Status': Math.abs(record.difference) < 0.01 ? 'Perfect Match' : 'Amount Variance'
      })));
      xlsx.utils.book_append_sheet(workbook, matchedSheet, 'Matched Records');
    }
    
    // Unmatched Coupa sheet
    if (unmatchedCoupa.length > 0) {
      const unmatchedCoupaSheet = xlsx.utils.json_to_sheet(unmatchedCoupa.map(record => ({
        'Invoice Number': record.invoiceNumber,
        'Amount': record.amount,
        'Date': record.date,
        'Vendor': record.vendor,
        'Status': record.status
      })));
      xlsx.utils.book_append_sheet(workbook, unmatchedCoupaSheet, 'Unmatched Coupa');
    }
    
    // Unmatched NetSuite sheet
    if (unmatchedNetsuite.length > 0) {
      const unmatchedNetsuiteSheet = xlsx.utils.json_to_sheet(unmatchedNetsuite.map(record => ({
        'Invoice Number': record.invoiceNumber,
        'Amount': record.amount,
        'Date': record.date,
        'Vendor': record.vendor,
        'Status': record.status
      })));
      xlsx.utils.book_append_sheet(workbook, unmatchedNetsuiteSheet, 'Unmatched NetSuite');
    }
    
    // Write file
    xlsx.writeFile(workbook, filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up the file after download
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export Excel: ' + error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`LedgerLink API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
