/**
 * Enhanced Matching Routes with Counterparty Integration
 * 
 * This handles CSV upload and matching operations with full counterparty
 * relationship tracking and statistics updates.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const fs = require('fs').promises;
const path = require('path');
const { matchRecords } = require('../utils/matching');
const MatchingResult = require('../models/MatchingResult');
const Counterparty = require('../models/Counterparty');

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
 * Update counterparty statistics after matching
 */
const updateCounterpartyStats = async (counterpartyId, matchingResult) => {
  if (!counterpartyId) return;

  try {
    const counterparty = await Counterparty.findById(counterpartyId);
    if (!counterparty) return;

    const totalTransactions = matchingResult.statistics.totalRecords || 0;
    const matches = matchingResult.statistics.perfectMatches + matchingResult.statistics.mismatches;
    const totalAmount = matchingResult.statistics.totalAmount || 0;

    await counterparty.updateMatchingStats(totalTransactions, matches, totalAmount);
    
    console.log(`✅ Updated stats for counterparty ${counterparty.name}`);
  } catch (error) {
    console.error('Error updating counterparty stats:', error);
  }
};

/**
 * @route   POST /api/matching/upload-and-match
 * @desc    Upload two CSV files and run matching algorithm with counterparty tracking
 * @access  Private (Authentication handled by server.js middleware)
 */
router.post('/upload-and-match', upload.fields([
  { name: 'company1File', maxCount: 1 },
  { name: 'company2File', maxCount: 1 }
]), async (req, res) => {
  const uploadedFiles = [];
  
  try {
    // Validate files were uploaded
    if (!req.files || !req.files.company1File || !req.files.company2File) {
      return res.status(400).json({ 
        success: false,
        message: 'Both company1File and company2File are required' 
      });
    }
    
    const company1File = req.files.company1File[0];
    const company2File = req.files.company2File[0];
    uploadedFiles.push(company1File.path, company2File.path);
    
    // Get parameters from request
    const {
      dateFormat1 = 'DD/MM/YYYY',
      dateFormat2 = 'DD/MM/YYYY',
      company1Name = 'Company 1',
      company2Name = 'Company 2',
      counterpartyId,
      notes
    } = req.body;
    
    console.log('Processing CSV files:', {
      company1: company1File.originalname,
      company2: company2File.originalname,
      company1Name,
      company2Name,
      counterpartyId,
      dateFormat1,
      dateFormat2
    });
    
    // Validate counterparty if provided
    let counterparty = null;
    if (counterpartyId) {
      counterparty = await Counterparty.findOne({
        _id: counterpartyId,
        $or: [
          { primaryUserId: req.user.id },
          { linkedUserId: req.user.id }
        ],
        isActive: true
      });
      
      if (!counterparty) {
        return res.status(400).json({
          success: false,
          message: 'Invalid counterparty selected'
        });
      }
    }
    
    // Parse CSV files
    const company1Data = await parseCSV(company1File.path);
    const company2Data = await parseCSV(company2File.path);
    
    console.log('Parsed CSV data:', {
      company1Records: company1Data.length,
      company2Records: company2Data.length
    });
    
    if (company1Data.length === 0 || company2Data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV files cannot be empty'
      });
    }
    
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
    
    // Calculate statistics
    const statistics = {
      totalCompany1: company1Data.length,
      totalCompany2: company2Data.length,
      perfectMatches: matchingResults.perfectMatches.length,
      mismatches: matchingResults.mismatches.length,
      company1Unmatched: matchingResults.unmatchedItems.company1.length,
      company2Unmatched: matchingResults.unmatchedItems.company2.length,
      totalAmount1: company1Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      totalAmount2: company2Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      matchRate: ((matchingResults.perfectMatches.length + matchingResults.mismatches.length) / (company1Data.length + company2Data.length)) * 100
    };
    
    statistics.totalRecords = statistics.totalCompany1 + statistics.totalCompany2;
    statistics.totalAmount = statistics.totalAmount1 + statistics.totalAmount2;
    statistics.matchedAmount = matchingResults.perfectMatches.reduce((sum, match) => 
      sum + (parseFloat(match.company1.amount) || 0), 0
    );
    statistics.varianceAmount = Math.abs(statistics.totalAmount1 - statistics.totalAmount2);
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      userId: req.user.id,
      company1Name,
      company2Name,
      counterpartyId: counterparty?._id,
      dateFormat1,
      dateFormat2,
      perfectMatches: matchingResults.perfectMatches,
      mismatches: matchingResults.mismatches,
      company1Unmatched: matchingResults.unmatchedItems.company1,
      company2Unmatched: matchingResults.unmatchedItems.company2,
      statistics,
      metadata: {
        sourceType1: 'csv',
        sourceType2: 'csv',
        fileName1: company1File.originalname,
        fileName2: company2File.originalname,
        uploadedBy: req.user.id,
        processingTime,
        notes,
        counterpartyName: counterparty?.name
      }
    });
    
    // Save to database
    await matchingResultDoc.save();
    
    // Update counterparty statistics
    if (counterparty) {
      await updateCounterpartyStats(counterparty._id, matchingResultDoc);
    }
    
    // Clean up uploaded files
    await cleanupFiles(uploadedFiles);
    
    console.log(`✅ Matching completed: ${statistics.perfectMatches} perfect matches, ${statistics.mismatches} mismatches`);
    
    // Return results
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      message: 'Matching completed successfully',
      result: {
        _id: matchingResultDoc._id,
        company1Name: matchingResultDoc.company1Name,
        company2Name: matchingResultDoc.company2Name,
        counterparty: counterparty ? {
          _id: counterparty._id,
          name: counterparty.name,
          type: counterparty.type
        } : null,
        statistics: matchingResultDoc.statistics,
        createdAt: matchingResultDoc.createdAt,
        metadata: matchingResultDoc.metadata
      }
    });
    
  } catch (error) {
    console.error('Matching error:', error);
    
    // Clean up files on error
    await cleanupFiles(uploadedFiles);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process matching',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/matching/match-from-erp
 * @desc    Run matching using ERP data (Xero, QuickBooks, etc.) with counterparty tracking
 * @access  Private (Authentication handled by server.js middleware)
 */
router.post('/match-from-erp', async (req, res) => {
  try {
    const { 
      company1Data, 
      company2Data, 
      dateFormat1 = 'DD/MM/YYYY', 
      dateFormat2 = 'DD/MM/YYYY',
      company1Name = 'Company 1',
      company2Name = 'Company 2',
      sourceType1 = 'erp',
      sourceType2 = 'erp',
      counterpartyId,
      notes
    } = req.body;
    
    // Validate input
    if (!company1Data || !company2Data) {
      return res.status(400).json({ 
        success: false,
        message: 'Both company1Data and company2Data are required' 
      });
    }
    
    // Validate counterparty if provided
    let counterparty = null;
    if (counterpartyId) {
      counterparty = await Counterparty.findOne({
        _id: counterpartyId,
        $or: [
          { primaryUserId: req.user.id },
          { linkedUserId: req.user.id }
        ],
        isActive: true
      });
      
      if (!counterparty) {
        return res.status(400).json({
          success: false,
          message: 'Invalid counterparty selected'
        });
      }
    }
    
    console.log('Running ERP data matching:', {
      company1Records: company1Data.length,
      company2Records: company2Data.length,
      sourceType1,
      sourceType2,
      counterpartyId
    });
    
    // Record start time
    const startTime = Date.now();
    
    // Run matching algorithm
    const matchingResults = await matchRecords(
      company1Data,
      company2Data,
      dateFormat1,
      dateFormat2,
      [] // Historical data can be added later
    );
    
    const processingTime = Date.now() - startTime;
    
    // Calculate statistics (similar to CSV upload)
    const statistics = {
      totalCompany1: company1Data.length,
      totalCompany2: company2Data.length,
      perfectMatches: matchingResults.perfectMatches.length,
      mismatches: matchingResults.mismatches.length,
      company1Unmatched: matchingResults.unmatchedItems.company1.length,
      company2Unmatched: matchingResults.unmatchedItems.company2.length,
      totalAmount1: company1Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      totalAmount2: company2Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
      matchRate: ((matchingResults.perfectMatches.length + matchingResults.mismatches.length) / (company1Data.length + company2Data.length)) * 100
    };
    
    statistics.totalRecords = statistics.totalCompany1 + statistics.totalCompany2;
    statistics.totalAmount = statistics.totalAmount1 + statistics.totalAmount2;
    statistics.matchedAmount = matchingResults.perfectMatches.reduce((sum, match) => 
      sum + (parseFloat(match.company1.amount) || 0), 0
    );
    statistics.varianceAmount = Math.abs(statistics.totalAmount1 - statistics.totalAmount2);
    
    // Create matching result document
    const matchingResultDoc = new MatchingResult({
      userId: req.user.id,
      company1Name,
      company2Name,
      counterpartyId: counterparty?._id,
      dateFormat1,
      dateFormat2,
      perfectMatches: matchingResults.perfectMatches,
      mismatches: matchingResults.mismatches,
      company1Unmatched: matchingResults.unmatchedItems.company1,
      company2Unmatched: matchingResults.unmatchedItems.company2,
      statistics,
      metadata: {
        sourceType1,
        sourceType2,
        uploadedBy: req.user.id,
        processingTime,
        notes,
        counterpartyName: counterparty?.name
      }
    });
    
    // Save to database
    await matchingResultDoc.save();
    
    // Update counterparty statistics
    if (counterparty) {
      await updateCounterpartyStats(counterparty._id, matchingResultDoc);
    }
    
    res.json({
      success: true,
      matchId: matchingResultDoc._id,
      message: 'ERP matching completed successfully',
      result: {
        _id: matchingResultDoc._id,
        company1Name: matchingResultDoc.company1Name,
        company2Name: matchingResultDoc.company2Name,
        counterparty: counterparty ? {
          _id: counterparty._id,
          name: counterparty.name,
          type: counterparty.type
        } : null,
        statistics: matchingResultDoc.statistics,
        createdAt: matchingResultDoc.createdAt,
        metadata: matchingResultDoc.metadata
      }
    });
    
  } catch (error) {
    console.error('ERP matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process ERP matching',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/matching/results/:matchId
 * @desc    Get specific matching result by ID with counterparty information
 * @access  Private (Authentication handled by server.js middleware)
 */
router.get('/results/:matchId', async (req, res) => {
  try {
    const matchingResult = await MatchingResult.findOne({
      _id: req.params.matchId,
      userId: req.user.id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ 
        success: false,
        message: 'Matching result not found' 
      });
    }
    
    // Add counterparty information if available
    let counterparty = null;
    if (matchingResult.counterpartyId) {
      counterparty = await Counterparty.findById(matchingResult.counterpartyId)
        .select('name email type status statistics');
    }
    
    const result = matchingResult.toObject();
    result.counterparty = counterparty;
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching matching result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matching result',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/matching/history
 * @desc    Get matching history for the current user with counterparty information
 * @access  Private (Authentication handled by server.js middleware)
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const matchingHistory = await MatchingResult.find({
      userId: req.user.id
    })
    .populate('counterpartyId', 'name email type status')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('company1Name company2Name statistics createdAt metadata counterpartyId');
    
    // Calculate overall statistics
    const allResults = await MatchingResult.find({ userId: req.user.id });
    const totalRuns = allResults.length;
    const avgMatchRate = totalRuns > 0 
      ? allResults.reduce((sum, result) => sum + result.statistics.matchRate, 0) / totalRuns 
      : 0;
    const totalPerfectMatches = allResults.reduce((sum, result) => sum + result.statistics.perfectMatches, 0);
    const totalMismatches = allResults.reduce((sum, result) => sum + result.statistics.mismatches, 0);
    const lastRun = totalRuns > 0 ? allResults[0].createdAt : null;
    
    res.json({
      success: true,
      data: matchingHistory,
      statistics: {
        totalRuns,
        avgMatchRate,
        totalPerfectMatches,
        totalMismatches,
        lastRun
      }
    });
    
  } catch (error) {
    console.error('Error fetching matching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matching history',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/matching/results/:matchId
 * @desc    Delete a matching result
 * @access  Private (Authentication handled by server.js middleware)
 */
router.delete('/results/:matchId', async (req, res) => {
  try {
    const result = await MatchingResult.findOneAndDelete({
      _id: req.params.matchId,
      userId: req.user.id
    });
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Matching result not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Matching result deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting matching result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete matching result',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/matching/export/:matchId
 * @desc    Export matching results to CSV
 * @access  Private (Authentication handled by server.js middleware)
 */
router.post('/export/:matchId', async (req, res) => {
  try {
    const matchingResult = await MatchingResult.findOne({
      _id: req.params.matchId,
      userId: req.user.id
    });
    
    if (!matchingResult) {
      return res.status(404).json({ 
        success: false,
        message: 'Matching result not found' 
      });
    }
    
    // Create CSV content
    let csvContent = 'Category,Company1_Transaction,Company1_Amount,Company1_Date,Company2_Transaction,Company2_Amount,Company2_Date,Status,Confidence\n';
    
    // Add perfect matches
    matchingResult.perfectMatches.forEach(match => {
      const c1 = match.company1Transaction || match.company1;
      const c2 = match.company2Transaction || match.company2;
      csvContent += `Perfect Match,"${c1.transaction_number || c1.transactionNumber || ''}",${c1.amount},"${c1.issue_date || c1.date || ''}","${c2.transaction_number || c2.transactionNumber || ''}",${c2.amount},"${c2.issue_date || c2.date || ''}",Matched,${match.confidence || 100}\n`;
    });
    
    // Add mismatches
    matchingResult.mismatches.forEach(match => {
      const c1 = match.company1Transaction || match.company1;
      const c2 = match.company2Transaction || match.company2;
      csvContent += `Mismatch,"${c1.transaction_number || c1.transactionNumber || ''}",${c1.amount},"${c1.issue_date || c1.date || ''}","${c2.transaction_number || c2.transactionNumber || ''}",${c2.amount},"${c2.issue_date || c2.date || ''}",Mismatched,${match.confidence || 0}\n`;
    });
    
    // Add unmatched items from company1
    matchingResult.company1Unmatched.forEach(item => {
      csvContent += `Unmatched (${matchingResult.company1Name}),"${item.transaction_number || item.transactionNumber || ''}",${item.amount},"${item.issue_date || item.date || ''}","","","",No Match,0\n`;
    });
    
    // Add unmatched items from company2
    matchingResult.company2Unmatched.forEach(item => {
      csvContent += `Unmatched (${matchingResult.company2Name}),"","","","${item.transaction_number || item.transactionNumber || ''}",${item.amount},"${item.issue_date || item.date || '"}",No Match,0\n`;
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="matching_results_${req.params.matchId}.csv"`);
    
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting matching result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export matching result',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/matching/counterparties/search
 * @desc    Search counterparties for matching operations
 * @access  Private (Authentication handled by server.js middleware)
 */
router.get('/counterparties/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    const query = {
      $or: [
        { primaryUserId: req.user.id },
        { linkedUserId: req.user.id }
      ],
      status: 'linked',
      isActive: true
    };
    
    if (type) {
      query.type = type;
    }
    
    if (q) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      });
    }
    
    const counterparties = await Counterparty.find(query)
      .select('name email type statistics')
      .sort({ 'statistics.lastActivityAt': -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: counterparties
    });
    
  } catch (error) {
    console.error('Error searching counterparties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search counterparties',
      error: error.message
    });
  }
});

module.exports = router;