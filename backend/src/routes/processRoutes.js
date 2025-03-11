import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Ensure upload directory exists
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const uploadDir = path.join(__dirname, '../../uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  }
} catch (error) {
  console.error('Error creating uploads directory:', error);
}

// Process CSV files
router.post('/upload', upload.fields([{ name: 'arFile', maxCount: 1 }, { name: 'apFile', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || (!req.files.arFile && !req.files.apFile)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process the uploaded files
    const arData = req.files.arFile ? await processCSV(req.files.arFile[0].path) : [];
    const apData = req.files.apFile ? await processCSV(req.files.apFile[0].path) : [];

    // For demo, we'll just return mock matching data
    const matchingResults = generateMockMatchingResults(arData, apData);
    
    res.json(matchingResults);
  } catch (error) {
    console.error('Error processing CSV files:', error);
    res.status(500).json({ error: 'Failed to process CSV files: ' + error.message });
  }
});

// Process CSV file content
async function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Generate mock matching results for demo purposes
function generateMockMatchingResults(arData, apData) {
  // In a real implementation, this would compare the data
  // and find matches and mismatches
  
  return {
    matches: [
      {
        arTransaction: {
          transaction_number: 'INV001',
          transaction_type: 'INVOICE',
          amount: 1000.00,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          status: 'open',
          reference: 'PO12345'
        },
        apTransaction: {
          transaction_number: 'INV001',
          transaction_type: 'INVOICE',
          amount: 1000.00,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          status: 'open',
          reference: 'PO12345'
        },
        status: 'MATCHED'
      }
    ],
    mismatches: [
      {
        arTransaction: {
          transaction_number: 'INV002',
          transaction_type: 'INVOICE',
          amount: 1500.00,
          issue_date: '2024-01-02',
          due_date: '2024-02-01',
          status: 'open',
          reference: 'PO12346'
        },
        apTransaction: {
          transaction_number: 'INV002',
          transaction_type: 'INVOICE',
          amount: 1450.00, // amount mismatch
          issue_date: '2024-01-02',
          due_date: '2024-02-01',
          status: 'open',
          reference: 'PO12346'
        },
        discrepancies: ['amount']
      }
    ],
    arOnly: [
      {
        transaction_number: 'INV003',
        transaction_type: 'INVOICE',
        amount: 2000.00,
        issue_date: '2024-01-05',
        due_date: '2024-02-04',
        status: 'open',
        reference: 'PO12347'
      }
    ],
    apOnly: [
      {
        transaction_number: 'INV004',
        transaction_type: 'INVOICE',
        amount: 1200.00,
        issue_date: '2024-01-10',
        due_date: '2024-02-09',
        status: 'open',
        reference: 'PO12348'
      }
    ],
    summary: {
      totalTransactions: 4,
      matchedCount: 1,
      mismatchCount: 1,
      arOnlyCount: 1,
      apOnlyCount: 1,
      matchedAmount: 1000.00,
      mismatchAmount: 1500.00,
      discrepancyAmount: 50.00
    }
  };
}

// Handle match data requests (used by frontend to get match results)
router.get('/match', (req, res) => {
  // In a real implementation, this would retrieve saved matching results
  // For now, return the mock data
  const mockResults = generateMockMatchingResults([], []);
  res.json(mockResults);
});

// API endpoint for match data
router.get('/match', (req, res) => {
  const mockResults = generateMockMatchingResults([], []);
  res.json(mockResults);
});

export default router;