// backend/routes/coupa.js
// API routes for Coupa-NetSuite invoice comparison

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CoupaService = require('../services/coupaService');
const NetSuiteProcessor = require('../services/netsuiteProcessor');
const InvoiceMatchingEngine = require('../services/invoiceMatchingEngine');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/coupa/test-connection
 * Test Coupa API connection with provided credentials
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ 
        error: 'API URL and API Key are required' 
      });
    }

    const coupaService = new CoupaService(apiUrl, apiKey);
    const isConnected = await coupaService.testConnection();
    
    if (isConnected) {
      res.json({ 
        success: true, 
        message: 'Successfully connected to Coupa API' 
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to connect to Coupa API. Please check your credentials.' 
      });
    }
  } catch (error) {
    console.error('Coupa connection test error:', error);
    res.status(500).json({ 
      error: 'Connection test failed', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/fetch-invoices
 * Fetch invoices from Coupa API
 */
router.post('/fetch-invoices', async (req, res) => {
  try {
    const { apiUrl, apiKey, filters = {} } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ 
        error: 'API URL and API Key are required' 
      });
    }

    console.log('Fetching invoices from Coupa with filters:', filters);
    
    const coupaService = new CoupaService(apiUrl, apiKey);
    const invoices = await coupaService.getInvoices(filters);
    
    res.json({
      success: true,
      invoices,
      count: invoices.length,
      fetchedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error fetching Coupa invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices from Coupa', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/upload-netsuite
 * Upload and process NetSuite AR ledger CSV file
 */
router.post('/upload-netsuite', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing NetSuite file:', req.file.originalname);
    
    const netsuiteProcessor = new NetSuiteProcessor();
    const result = await netsuiteProcessor.processCSV(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      ...result
    });
    
  } catch (error) {
    console.error('Error processing NetSuite file:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process NetSuite file', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/compare-invoices
 * Compare Coupa invoices with NetSuite AR ledger
 */
router.post('/compare-invoices', async (req, res) => {
  try {
    const { 
      coupaConfig, 
      netsuiteFile, 
      matchingOptions = {} 
    } = req.body;
    
    // Validate inputs
    if (!coupaConfig || !coupaConfig.apiUrl || !coupaConfig.apiKey) {
      return res.status(400).json({ 
        error: 'Coupa API configuration is required' 
      });
    }
    
    if (!netsuiteFile) {
      return res.status(400).json({ 
        error: 'NetSuite file data is required' 
      });
    }

    console.log('Starting invoice comparison...');
    
    // Initialize services
    const coupaService = new CoupaService(coupaConfig.apiUrl, coupaConfig.apiKey);
    const matchingEngine = new InvoiceMatchingEngine(matchingOptions);
    
    // Fetch Coupa invoices
    console.log('Fetching invoices from Coupa...');
    const coupaInvoices = await coupaService.getInvoices(coupaConfig.filters || {});
    
    // Use provided NetSuite data (already processed)
    const netsuiteInvoices = netsuiteFile.invoices || [];
    
    console.log(`Comparing ${coupaInvoices.length} Coupa invoices with ${netsuiteInvoices.length} NetSuite invoices`);
    
    // Perform comparison
    const comparisonResults = matchingEngine.compareInvoices(coupaInvoices, netsuiteInvoices);
    
    // Generate enhanced summary
    const enhancedSummary = matchingEngine.generateSummary(comparisonResults);
    
    res.json({
      success: true,
      comparisonId: `comparison_${Date.now()}`,
      ...comparisonResults,
      enhancedSummary,
      processedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error comparing invoices:', error);
    res.status(500).json({ 
      error: 'Failed to compare invoices', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/full-comparison
 * Complete workflow: fetch from Coupa, process NetSuite file, and compare
 */
router.post('/full-comparison', upload.single('netsuiteFile'), async (req, res) => {
  try {
    const { 
      apiUrl, 
      apiKey, 
      coupaFilters,
      matchingOptions 
    } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ 
        error: 'Coupa API URL and API Key are required' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'NetSuite CSV file is required' 
      });
    }

    console.log('Starting full comparison workflow...');
    
    // Initialize services
    const coupaService = new CoupaService(apiUrl, apiKey);
    const netsuiteProcessor = new NetSuiteProcessor();
    const matchingEngine = new InvoiceMatchingEngine(JSON.parse(matchingOptions || '{}'));
    
    // Step 1: Process NetSuite file
    console.log('Step 1: Processing NetSuite file...');
    const netsuiteResult = await netsuiteProcessor.processCSV(req.file.path);
    
    // Step 2: Fetch Coupa invoices
    console.log('Step 2: Fetching Coupa invoices...');
    const coupaInvoices = await coupaService.getInvoices(JSON.parse(coupaFilters || '{}'));
    
    // Step 3: Compare invoices
    console.log('Step 3: Comparing invoices...');
    const comparisonResults = matchingEngine.compareInvoices(coupaInvoices, netsuiteResult.invoices);
    
    // Generate reports
    const enhancedSummary = matchingEngine.generateSummary(comparisonResults);
    const netSuiteSummary = netsuiteProcessor.generateSummary(netsuiteResult.invoices);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      comparisonId: `full_comparison_${Date.now()}`,
      netsuiteFile: {
        fileName: req.file.originalname,
        summary: netSuiteSummary,
        errors: netsuiteResult.errors
      },
      coupaData: {
        invoiceCount: coupaInvoices.length,
        fetchedAt: new Date()
      },
      comparison: comparisonResults,
      enhancedSummary,
      processedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error in full comparison:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Full comparison failed', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/suppliers
 * Get list of suppliers from Coupa
 */
router.post('/suppliers', async (req, res) => {
  try {
    const { apiUrl, apiKey } = req.body;
    
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ 
        error: 'API URL and API Key are required' 
      });
    }

    const coupaService = new CoupaService(apiUrl, apiKey);
    const suppliers = await coupaService.getSuppliers();
    
    res.json({
      success: true,
      suppliers,
      count: suppliers.length
    });
    
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suppliers', 
      details: error.message 
    });
  }
});

/**
 * POST /api/coupa/save-comparison
 * Save comparison results to database
 */
router.post('/save-comparison', async (req, res) => {
  try {
    const { comparisonResults, companyId, userId } = req.body;
    
    if (!comparisonResults) {
      return res.status(400).json({ 
        error: 'Comparison results are required' 
      });
    }

    // Here you would save to your MongoDB database
    // This is a placeholder for database integration
    const savedComparison = {
      _id: `comparison_${Date.now()}`,
      companyId,
      userId,
      ...comparisonResults,
      savedAt: new Date()
    };
    
    // TODO: Implement database saving logic
    // const db = req.app.locals.db;
    // await db.collection('invoice_comparisons').insertOne(savedComparison);
    
    res.json({
      success: true,
      comparisonId: savedComparison._id,
      message: 'Comparison results saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving comparison:', error);
    res.status(500).json({ 
      error: 'Failed to save comparison results', 
      details: error.message 
    });
  }
});

/**
 * GET /api/coupa/comparison-history
 * Get historical comparison results
 */
router.get('/comparison-history/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // TODO: Implement database query
    // const db = req.app.locals.db;
    // const comparisons = await db.collection('invoice_comparisons')
    //   .find({ companyId })
    //   .sort({ savedAt: -1 })
    //   .skip(parseInt(offset))
    //   .limit(parseInt(limit))
    //   .toArray();
    
    // Placeholder response
    const comparisons = [];
    
    res.json({
      success: true,
      comparisons,
      total: comparisons.length
    });
    
  } catch (error) {
    console.error('Error fetching comparison history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comparison history', 
      details: error.message 
    });
  }
});

/**
 * Error handling middleware for file uploads
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.' 
      });
    }
  }
  
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({ 
      error: 'Only CSV files are allowed. Please upload a .csv file.' 
    });
  }
  
  next(error);
});

module.exports = router;