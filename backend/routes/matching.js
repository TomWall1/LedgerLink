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
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.id || req.user._id,  // FIX: Add required companyId field
      userId: req.user.id || req.user._id,
      company1Name,
      company2Name,
      dateFormat1,
      dateFormat2,
      perfectMatches: matchingResults.perfectMatches || [],
      mismatches: matchingResults.mismatches || [],
      company1Unmatched: matchingResults.unmatchedItems?.company1 || [],
      company2Unmatched: matchingResults.unmatchedItems?.company2 || [],
      statistics: {
        totalCompany1: company1Data.length,
        totalCompany2: company2Data.length,
        perfectMatches: matchingResults.perfectMatches?.length || 0,
        mismatches: matchingResults.mismatches?.length || 0,
        company1Unmatched: matchingResults.unmatchedItems?.company1?.length || 0,
        company2Unmatched: matchingResults.unmatchedItems?.company2?.length || 0,
        matchRate: 0,
        totalAmount1: company1Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
        totalAmount2: company2Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      },
      metadata: {
        sourceType1: 'csv',
        sourceType2: 'csv',
        fileName1: company1File.originalname,
        fileName2: company2File.originalname,
        uploadedBy: req.user.id || req.user._id,
        processingTime,
        notes: req.body.notes
      }
    });
    
    // Calculate match rate
    const totalMatches = (matchingResults.perfectMatches?.length || 0) + (matchingResults.mismatches?.length || 0);
    const totalRecords = Math.max(company1Data.length, company2Data.length);
    matchingResultDoc.statistics.matchRate = totalRecords > 0 ? (totalMatches / totalRecords) * 100 : 0;
    
    // Save to database
    await matchingResultDoc.save();
    
    // Clean up uploaded files
    await cleanupFiles(uploadedFiles);
    
    // Return results
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      message: 'Files processed successfully',
      result: matchingResultDoc
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
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      companyId: req.user.id || req.user._id,  // FIX: Add required companyId field
      userId: req.user.id || req.user._id,
      company1Name: sourceType1 || 'Company 1',
      company2Name: sourceType2 || 'Company 2', 
      dateFormat1: dateFormat1 || 'DD/MM/YYYY',
      dateFormat2: dateFormat2 || 'DD/MM/YYYY',
      perfectMatches: matchingResults.perfectMatches || [],
      mismatches: matchingResults.mismatches || [],
      company1Unmatched: matchingResults.unmatchedItems?.company1 || [],
      company2Unmatched: matchingResults.unmatchedItems?.company2 || [],
      statistics: {
        totalCompany1: company1Data.length,
        totalCompany2: company2Data.length,
        perfectMatches: matchingResults.perfectMatches?.length || 0,
        mismatches: matchingResults.mismatches?.length || 0,
        company1Unmatched: matchingResults.unmatchedItems?.company1?.length || 0,
        company2Unmatched: matchingResults.unmatchedItems?.company2?.length || 0,
        matchRate: 0,
        totalAmount1: company1Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
        totalAmount2: company2Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      },
      metadata: {
        sourceType1,
        sourceType2,
        uploadedBy: req.user.id || req.user._id,
        processingTime,
        notes
      }
    });
    
    // Calculate match rate
    const totalMatches = (matchingResults.perfectMatches?.length || 0) + (matchingResults.mismatches?.length || 0);
    const totalRecords = Math.max(company1Data.length, company2Data.length);
    matchingResultDoc.statistics.matchRate = totalRecords > 0 ? (totalMatches / totalRecords) * 100 : 0;
    
    // Save to database
    await matchingResultDoc.save();
    
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      data: {
        results: matchingResultDoc
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
      userId: req.user.id || req.user._id
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
    const userId = req.user.id || req.user._id;
    
    const matchingHistory = await MatchingResult.find({ userId })
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
      userId: req.user.id || req.user._id
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
      userId: req.user.id || req.user._id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ error: 'Matching result not found' });
    }
    
    // Create CSV content
    let csvContent = 'Category,Company1_Transaction,Company1_Amount,Company1_Date,Company2_Transaction,Company2_Amount,Company2_Date,Status\n';
    
    // Add perfect matches
    matchingResult.perfectMatches.forEach(match => {
      csvContent += `Perfect Match,"${match.company1Transaction?.transactionNumber || ''}","${match.company1Transaction?.amount || ''}","${match.company1Transaction?.date || ''}","${match.company2Transaction?.transactionNumber || ''}","${match.company2Transaction?.amount || ''}","${match.company2Transaction?.date || ''}",Matched\n`;
    });
    
    // Add mismatches
    matchingResult.mismatches.forEach(match => {
      csvContent += `Mismatch,"${match.company1Transaction?.transactionNumber || ''}","${match.company1Transaction?.amount || ''}","${match.company1Transaction?.date || ''}","${match.company2Transaction?.transactionNumber || ''}","${match.company2Transaction?.amount || ''}","${match.company2Transaction?.date || ''}",Mismatched\n`;
    });
    
    // Add unmatched items
    matchingResult.company1Unmatched.forEach(item => {
      csvContent += `Unmatched (${matchingResult.company1Name}),"${item.transactionNumber || ''}","${item.amount || ''}","${item.date || ''}","","","",No Match\n`;
    });
    
    matchingResult.company2Unmatched.forEach(item => {
      csvContent += `Unmatched (${matchingResult.company2Name}),"","","","${item.transactionNumber || ''}","${item.amount || ''}","${item.date || ''}",No Match\n`;
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