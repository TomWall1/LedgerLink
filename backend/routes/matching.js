const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const fs = require('fs').promises;
const path = require('path');
const { matchRecords } = require('../utils/matching');
const MatchingResult = require('../models/MatchingResult');
const { requireAuth } = require('../middleware/auth');

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
 * Parse CSV file and return JSON data
 */
const parseCSV = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      csv.parse(fileContent, {
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
    
    // Get date formats from request or use defaults
    const dateFormat1 = req.body.dateFormat1 || 'DD/MM/YYYY';
    const dateFormat2 = req.body.dateFormat2 || 'DD/MM/YYYY';
    
    console.log('Processing CSV files:', {
      company1: company1File.originalname,
      company2: company2File.originalname,
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
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.companyId || req.user.id,
      counterpartyId: req.body.counterpartyId,
      dateFormat1,
      dateFormat2,
      ...matchingResults,
      metadata: {
        sourceType1: 'csv',
        sourceType2: 'csv',
        fileName1: company1File.originalname,
        fileName2: company2File.originalname,
        uploadedBy: req.user.id,
        processingTime,
        notes: req.body.notes
      }
    });
    
    // Calculate statistics
    matchingResultDoc.calculateStatistics();
    
    // Save to database
    await matchingResultDoc.save();
    
    // Clean up uploaded files
    await cleanupFiles(uploadedFiles);
    
    // Return results
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      results: {
        perfectMatches: matchingResults.perfectMatches,
        mismatches: matchingResults.mismatches,
        unmatchedItems: matchingResults.unmatchedItems,
        totals: matchingResults.totals,
        statistics: matchingResultDoc.statistics,
        processingTime
      }
    });
    
  } catch (error) {
    console.error('Matching error:', error);
    
    // Clean up files on error
    await cleanupFiles(uploadedFiles);
    
    res.status(500).json({
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
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.companyId || req.user.id,
      counterpartyId,
      dateFormat1: dateFormat1 || 'DD/MM/YYYY',
      dateFormat2: dateFormat2 || 'DD/MM/YYYY',
      ...matchingResults,
      metadata: {
        sourceType1,
        sourceType2,
        uploadedBy: req.user.id,
        processingTime,
        notes
      }
    });
    
    // Calculate statistics
    matchingResultDoc.calculateStatistics();
    
    // Save to database
    await matchingResultDoc.save();
    
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      results: {
        perfectMatches: matchingResults.perfectMatches,
        mismatches: matchingResults.mismatches,
        unmatchedItems: matchingResults.unmatchedItems,
        totals: matchingResults.totals,
        statistics: matchingResultDoc.statistics,
        processingTime
      }
    });
    
  } catch (error) {
    console.error('ERP matching error:', error);
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
      companyId: req.user.companyId || req.user.id
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
 * @desc    Get matching history for the current company
 * @access  Private
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const companyId = req.user.companyId || req.user.id;
    
    const matchingHistory = await MatchingResult.getRecentMatches(
      companyId, 
      parseInt(limit)
    );
    
    const stats = await MatchingResult.getCompanyStatistics(companyId);
    
    res.json({
      history: matchingHistory,
      statistics: stats[0] || {
        totalRuns: 0,
        avgMatchRate: 0,
        totalPerfectMatches: 0,
        totalMismatches: 0,
        lastRun: null
      }
    });
    
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
      companyId: req.user.companyId || req.user.id
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
      companyId: req.user.companyId || req.user.id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ error: 'Matching result not found' });
    }
    
    // Create CSV content
    let csvContent = 'Category,Company1_Transaction,Company1_Amount,Company1_Date,Company2_Transaction,Company2_Amount,Company2_Date,Status\n';
    
    // Add perfect matches
    matchingResult.perfectMatches.forEach(match => {
      csvContent += `Perfect Match,${match.company1.transactionNumber},${match.company1.amount},${match.company1.date || ''},${match.company2.transactionNumber},${match.company2.amount},${match.company2.date || ''},Matched\n`;
    });
    
    // Add mismatches
    matchingResult.mismatches.forEach(match => {
      csvContent += `Mismatch,${match.company1.transactionNumber},${match.company1.amount},${match.company1.date || ''},${match.company2.transactionNumber},${match.company2.amount},${match.company2.date || ''},Mismatched\n`;
    });
    
    // Add unmatched items
    matchingResult.unmatchedItems.company1.forEach(item => {
      csvContent += `Unmatched (Company1),${item.transactionNumber},${item.amount},${item.date || ''},,,No Match\n`;
    });
    
    matchingResult.unmatchedItems.company2.forEach(item => {
      csvContent += `Unmatched (Company2),,,,${item.transactionNumber},${item.amount},${item.date || ''},No Match\n`;
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

module.exports = router;
