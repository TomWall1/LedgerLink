// Matching routes - handles CSV uploads and ERP data matching
import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { promises as fs } from 'fs';
import path from 'path';
import { matchRecords } from '../utils/matchingEngine.js';
import MatchingResult from '../models/MatchingResult.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Transform matching results to match MongoDB schema
 * Strips out extra fields and ensures proper data types
 */
const transformForMongoDB = (item) => {
  if (!item) return null;
  
  return {
    transactionNumber: item.transactionNumber || '',
    type: item.type || '',
    amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
    date: item.date ? new Date(item.date) : null,
    dueDate: item.dueDate ? new Date(item.dueDate) : null,
    status: item.status || '',
    reference: item.reference || ''
  };
};

/**
 * Transform matching results array to MongoDB-compatible format
 */
const transformMatchingResults = (results) => {
  return {
    perfectMatches: (results.perfectMatches || []).map(match => ({
      company1: transformForMongoDB(match.company1),
      company2: transformForMongoDB(match.company2)
    })),
    mismatches: (results.mismatches || []).map(match => ({
      company1: transformForMongoDB(match.company1),
      company2: transformForMongoDB(match.company2)
    })),
    unmatchedItems: {
      company1: (results.unmatchedItems?.company1 || []).map(transformForMongoDB),
      company2: (results.unmatchedItems?.company2 || []).map(transformForMongoDB)
    },
    historicalInsights: (results.historicalInsights || []).map(insight => ({
      apItem: transformForMongoDB(insight.apItem),
      historicalMatch: {
        ...transformForMongoDB(insight.historicalMatch),
        payment_date: insight.historicalMatch?.payment_date ? new Date(insight.historicalMatch.payment_date) : null,
        is_paid: insight.historicalMatch?.is_paid || false,
        is_voided: insight.historicalMatch?.is_voided || false
      },
      insight: insight.insight
    })),
    dateMismatches: (results.dateMismatches || []).map(mismatch => ({
      company1: transformForMongoDB(mismatch.company1),
      company2: transformForMongoDB(mismatch.company2),
      mismatchType: mismatch.mismatchType || '',
      company1Date: mismatch.company1Date ? new Date(mismatch.company1Date) : null,
      company2Date: mismatch.company2Date ? new Date(mismatch.company2Date) : null,
      daysDifference: mismatch.daysDifference || 0
    })),
    totals: results.totals || {
      company1Total: 0,
      company2Total: 0,
      variance: 0
    }
  };
};

/**
 * Parse CSV file and return JSON data
 */
const parseCSV = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true,
        cast_date: false, // We'll handle dates in the matching algorithm
      }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
};

/**
 * Clean up uploaded files
 */
const cleanupFiles = async (files) => {
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (err) {
      console.error(`Failed to delete file ${file}:`, err);
    }
  }
};

/**
 * @route   POST /api/matching/upload-and-match
 * @desc    Upload two CSV files and run matching algorithm
 * @access  Private
 */
router.post('/upload-and-match', requireAuth, upload.fields([
  { name: 'company1File', maxCount: 1 },
  { name: 'company2File', maxCount: 1 }
]), async (req, res) => {
  const uploadedFiles = [];
  
  try {
    // Validate files were uploaded
    if (!req.files || !req.files.company1File || !req.files.company2File) {
      return res.status(400).json({ 
        error: 'Both company1File and company2File are required' 
      });
    }
    
    const company1File = req.files.company1File[0];
    const company2File = req.files.company2File[0];
    uploadedFiles.push(company1File.path, company2File.path);
    
    // Get additional parameters
    const company1Name = req.body.company1Name || 'Company 1';
    const company2Name = req.body.company2Name || 'Company 2';
    const dateFormat1 = req.body.dateFormat1 || 'DD/MM/YYYY';
    const dateFormat2 = req.body.dateFormat2 || 'DD/MM/YYYY';
    
    console.log('Processing CSV files:', {
      company1: company1File.originalname,
      company2: company2File.originalname,
      company1Name,
      company2Name,
      dateFormat1,
      dateFormat2
    });
    
    // Parse CSV files
    const company1Data = await parseCSV(company1File.path);
    const company2Data = await parseCSV(company2File.path);
    
    console.log('Parsed CSV data:', {
      company1Records: company1Data.length,
      company2Records: company2Data.length
    });
    
    // Record start time for performance tracking
    const startTime = Date.now();
    
    // Run matching algorithm
    const matchingResults = await matchRecords(
      company1Data,
      company2Data,
      dateFormat1,
      dateFormat2,
      [] // No historical data for now
    );
    
    const processingTime = Date.now() - startTime;
    
    // Transform results for MongoDB
    const transformedResults = transformMatchingResults(matchingResults);
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.id || req.user._id,
      dateFormat1,
      dateFormat2,
      ...transformedResults,
      statistics: {
        perfectMatchCount: transformedResults.perfectMatches.length,
        mismatchCount: transformedResults.mismatches.length,
        unmatchedCompany1Count: transformedResults.unmatchedItems.company1.length,
        unmatchedCompany2Count: transformedResults.unmatchedItems.company2.length,
        matchRate: 0,
        processingTime
      },
      metadata: {
        sourceType1: 'csv',
        sourceType2: 'csv',
        fileName1: company1File.originalname,
        fileName2: company2File.originalname,
        uploadedBy: req.user.id || req.user._id,
        notes: req.body.notes
      }
    });
    
    // Calculate match rate
    const totalRecords = Math.max(company1Data.length, company2Data.length);
    if (totalRecords > 0) {
      matchingResultDoc.statistics.matchRate = 
        (transformedResults.perfectMatches.length / totalRecords) * 100;
    }
    
    // Save to database
    await matchingResultDoc.save();
    
    // Clean up uploaded files
    await cleanupFiles(uploadedFiles);
    
    // Return results
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      message: 'Files processed successfully',
      data: {
        results: matchingResultDoc
      }
    });
    
  } catch (error) {
    console.error('Matching error:', error);
    
    // Clean up files on error
    await cleanupFiles(uploadedFiles);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process matching',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/matching/match-from-erp
 * @desc    Run matching using ERP data (Xero, QuickBooks, etc.)
 * @access  Private
 */
router.post('/match-from-erp', requireAuth, async (req, res) => {
  try {
    const { 
      company1Data, 
      company2Data, 
      dateFormat1, 
      dateFormat2,
      sourceType1,
      sourceType2,
      counterpartyId,
      notes
    } = req.body;
    
    // Validate input
    if (!company1Data || !company2Data) {
      return res.status(400).json({ 
        error: 'Both company1Data and company2Data are required' 
      });
    }
    
    console.log('Running ERP data matching:', {
      company1Records: company1Data.length,
      company2Records: company2Data.length,
      sourceType1,
      sourceType2
    });
    
    // Log a few sample records to debug the data
    console.log('Company2 sample data:', company2Data.slice(0, 3));
    
    // Record start time
    const startTime = Date.now();
    
    // Run matching algorithm
    const matchingResults = await matchRecords(
      company1Data,
      company2Data,
      dateFormat1 || 'DD/MM/YYYY',
      dateFormat2 || 'DD/MM/YYYY',
      [] // Historical data can be added later
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Matching complete, transforming results for MongoDB...');
    
    // Transform results for MongoDB
    const transformedResults = transformMatchingResults(matchingResults);
    
    console.log('✅ Transformation complete, creating document...');
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.id || req.user._id,
      counterpartyId,
      dateFormat1: dateFormat1 || 'DD/MM/YYYY',
      dateFormat2: dateFormat2 || 'DD/MM/YYYY',
      ...transformedResults,
      statistics: {
        perfectMatchCount: transformedResults.perfectMatches.length,
        mismatchCount: transformedResults.mismatches.length,
        unmatchedCompany1Count: transformedResults.unmatchedItems.company1.length,
        unmatchedCompany2Count: transformedResults.unmatchedItems.company2.length,
        matchRate: 0,
        processingTime
      },
      metadata: {
        sourceType1,
        sourceType2,
        uploadedBy: req.user.id || req.user._id,
        notes
      }
    });
    
    // Calculate match rate
    const totalRecords = Math.max(company1Data.length, company2Data.length);
    if (totalRecords > 0) {
      matchingResultDoc.statistics.matchRate = 
        (transformedResults.perfectMatches.length / totalRecords) * 100;
    }
    
    console.log('✅ Saving to database...');
    
    // Save to database
    await matchingResultDoc.save();
    
    console.log('✅ Saved successfully!');
    
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      data: {
        results: matchingResultDoc
      }
    });
    
  } catch (error) {
    console.error('ERP matching error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to process ERP matching',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/matching/results/:matchId
 * @desc    Get specific matching result by ID
 * @access  Private
 */
router.get('/results/:matchId', requireAuth, async (req, res) => {
  try {
    const matchingResult = await MatchingResult.findOne({
      _id: req.params.matchId,
      companyId: req.user.id || req.user._id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ error: 'Matching result not found' });
    }
    
    res.json(matchingResult);
    
  } catch (error) {
    console.error('Error fetching matching result:', error);
    res.status(500).json({
      error: 'Failed to fetch matching result',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/matching/history
 * @desc    Get matching history for the current user
 * @access  Private
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const companyId = req.user.id || req.user._id;
    
    const matchingHistory = await MatchingResult.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    res.json(matchingHistory);
    
  } catch (error) {
    console.error('Error fetching matching history:', error);
    res.status(500).json({
      error: 'Failed to fetch matching history',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/matching/results/:matchId
 * @desc    Delete a matching result
 * @access  Private
 */
router.delete('/results/:matchId', requireAuth, async (req, res) => {
  try {
    const result = await MatchingResult.findOneAndDelete({
      _id: req.params.matchId,
      companyId: req.user.id || req.user._id
    });
    
    if (!result) {
      return res.status(404).json({ error: 'Matching result not found' });
    }
    
    res.json({ success: true, message: 'Matching result deleted' });
    
  } catch (error) {
    console.error('Error deleting matching result:', error);
    res.status(500).json({
      error: 'Failed to delete matching result',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/matching/export/:matchId
 * @desc    Export matching results to CSV
 * @access  Private
 */
router.post('/export/:matchId', requireAuth, async (req, res) => {
  try {
    const matchingResult = await MatchingResult.findOne({
      _id: req.params.matchId,
      companyId: req.user.id || req.user._id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ error: 'Matching result not found' });
    }
    
    // Create CSV content
    let csvContent = 'Category,Company1_Transaction,Company1_Amount,Company1_Date,Company2_Transaction,Company2_Amount,Company2_Date,Status\n';
    
    // Add perfect matches
    matchingResult.perfectMatches.forEach(match => {
      csvContent += `Perfect Match,"${match.company1?.transactionNumber || ''}","${match.company1?.amount || ''}","${match.company1?.date || ''}","${match.company2?.transactionNumber || ''}","${match.company2?.amount || ''}","${match.company2?.date || ''}",Matched\n`;
    });
    
    // Add mismatches
    matchingResult.mismatches.forEach(match => {
      csvContent += `Mismatch,"${match.company1?.transactionNumber || ''}","${match.company1?.amount || ''}","${match.company1?.date || ''}","${match.company2?.transactionNumber || ''}","${match.company2?.amount || ''}","${match.company2?.date || ''}",Mismatched\n`;
    });
    
    // Add unmatched items
    matchingResult.unmatchedItems.company1.forEach(item => {
      csvContent += `Unmatched (Company 1),"${item.transactionNumber || ''}","${item.amount || ''}","${item.date || ''}","","","",No Match\n`;
    });
    
    matchingResult.unmatchedItems.company2.forEach(item => {
      csvContent += `Unmatched (Company 2),"","","","${item.transactionNumber || ''}","${item.amount || ''}","${item.date || ''}",No Match\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="matching_results_${req.params.matchId}.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting matching result:', error);
    res.status(500).json({
      error: 'Failed to export matching result',
      message: error.message
    });
  }
});

export default router;