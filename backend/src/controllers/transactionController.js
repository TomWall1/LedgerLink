import Transaction from '../models/Transaction.js';
import Company from '../models/Company.js';
import CompanyLink from '../models/CompanyLink.js';
import ERPConnection from '../models/ERPConnection.js';
import { tokenStore } from '../utils/tokenStore.js';
import { parseCSV, parseCSVBuffer } from './fileController.js';

// @desc    Upload transactions (bulk create)
// @route   POST /api/transactions/upload
// @access  Private
export const uploadTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    const companyId = req.user.company;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of transactions'
      });
    }

    // Add company ID to each transaction
    const transactionsWithCompany = transactions.map(transaction => ({
      ...transaction,
      company: companyId,
      uploadedBy: req.user._id
    }));

    // Create the transactions
    const createdTransactions = await Transaction.insertMany(transactionsWithCompany);

    res.status(201).json({
      success: true,
      count: createdTransactions.length,
      data: createdTransactions
    });
  } catch (error) {
    console.error('Error uploading transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get company transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    // Get the user's company ID
    const companyId = req.user.company;

    // Build query based on filters
    const queryFilters = { company: companyId };

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      queryFilters.transactionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      queryFilters.transactionDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      queryFilters.transactionDate = { $lte: new Date(req.query.endDate) };
    }

    // Add transaction type filter if provided
    if (req.query.transactionType) {
      queryFilters.transactionType = req.query.transactionType;
    }

    // Add status filter if provided
    if (req.query.status) {
      queryFilters.status = req.query.status;
    }

    // Add amount range filter if provided
    if (req.query.minAmount || req.query.maxAmount) {
      queryFilters.amount = {};
      if (req.query.minAmount) {
        queryFilters.amount.$gte = parseFloat(req.query.minAmount);
      }
      if (req.query.maxAmount) {
        queryFilters.amount.$lte = parseFloat(req.query.maxAmount);
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const transactions = await Transaction.find(queryFilters)
      .skip(skip)
      .limit(limit)
      .sort({ transactionDate: -1 });

    // Get total count for pagination
    const total = await Transaction.countDocuments(queryFilters);

    res.json({
      success: true,
      count: transactions.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Match transactions with counterparties
// @route   GET /api/transactions/match
// @access  Private
export const matchTransactions = async (req, res) => {
  try {
    const companyId = req.user.company;
    
    // Get all active company links
    const companyLinks = await CompanyLink.find({
      $or: [
        { sourceCompany: companyId },
        { targetCompany: companyId }
      ],
      status: 'accepted'
    });
    
    if (companyLinks.length === 0) {
      return res.json({
        success: true,
        message: 'No active company links found for matching',
        data: []
      });
    }
    
    // Extract linked company IDs
    const linkedCompanyIds = companyLinks.map(link => {
      return link.sourceCompany.toString() === companyId.toString() 
        ? link.targetCompany 
        : link.sourceCompany;
    });
    
    // Get company's transactions
    const companyTransactions = await Transaction.find({ company: companyId });
    
    // Get counterparty transactions
    const counterpartyTransactions = await Transaction.find({
      company: { $in: linkedCompanyIds }
    });
    
    // Match transactions based on reference numbers and amounts
    const matchedTransactions = [];
    
    companyTransactions.forEach(transaction => {
      // Look for potential matches
      const matches = counterpartyTransactions.filter(counterpartyTx => {
        // Match by reference number
        if (transaction.referenceNumber && 
            counterpartyTx.referenceNumber && 
            transaction.referenceNumber === counterpartyTx.referenceNumber) {
          return true;
        }
        
        // Match by amount (opposite sign) and date proximity
        if (Math.abs(transaction.amount + counterpartyTx.amount) < 0.01) { // Small tolerance for floating point
          // Check if dates are within 5 days of each other
          const dateDiff = Math.abs(
            new Date(transaction.transactionDate) - new Date(counterpartyTx.transactionDate)
          ) / (1000 * 60 * 60 * 24); // Convert to days
          
          if (dateDiff <= 5) {
            return true;
          }
        }
        
        return false;
      });
      
      if (matches.length > 0) {
        matchedTransactions.push({
          companyTransaction: transaction,
          counterpartyTransactions: matches,
          matchConfidence: matches.length === 1 ? 'high' : 'medium'
        });
      }
    });
    
    res.json({
      success: true,
      count: matchedTransactions.length,
      data: matchedTransactions
    });
  } catch (error) {
    console.error('Error matching transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Match customer invoices with transactions from CSV
// @route   POST /api/transactions/match-customer-invoices
// @access  Private
export const matchCustomerInvoices = async (req, res) => {
  try {
    console.log('Starting customer invoice matching process');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('File info:', req.file ? { filename: req.file.filename, path: req.file.path, size: req.file.size } : 'No file found');
    
    // Extract data from the request
    const { customerInvoices, dateFormat, customerId, useHistoricalData } = req.body;
    const csvFile = req.file;

    if (!customerInvoices || !csvFile) {
      console.log('Missing required data. CustomerInvoices:', !!customerInvoices, 'CSV File:', !!csvFile);
      return res.status(400).json({
        success: false,
        error: 'Missing required data: customer invoices or CSV file'
      });
    }

    // Parse the customer invoices JSON
    let invoices;
    try {
      invoices = JSON.parse(customerInvoices);
      console.log(`Successfully parsed ${invoices.length} customer invoices`);
      console.log('Invoice sample:', invoices.slice(0, 2));
    } catch (error) {
      console.error('Error parsing customer invoices JSON:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid customer invoices format'
      });
    }

    // Get the format of the date in the CSV (default to MM/DD/YYYY if not specified)
    const csvDateFormat = dateFormat || 'MM/DD/YYYY';
    console.log('Using date format for CSV parsing:', csvDateFormat);

    // Parse the CSV file
    console.log('Starting CSV parsing with file path:', csvFile.path);
    const csvTransactions = await parseCSV(csvFile.path, csvDateFormat);
    console.log(`CSV parsing complete: ${csvTransactions.length} valid transactions found`);

    if (csvTransactions.length === 0) {
      console.log('No valid transactions found in CSV file');
      return res.status(400).json({
        success: false,
        error: 'No valid transactions found in the CSV file. Please check your file format and make sure it contains the required columns.'
      });
    }

    // Match each invoice with potential CSV transactions
    const potentialMatches = [];
    const unmatchedInvoices = [];

    console.log('Starting improved invoice matching process');
    
    // Process each AR invoice
    for (const invoice of invoices) {
      // Log invoice details
      console.log('Processing invoice:', { 
        InvoiceID: invoice.InvoiceID, 
        InvoiceNumber: invoice.InvoiceNumber, 
        Total: invoice.Total,
        Date: invoice.Date
      });
      
      // Find potential matches for this invoice
      const matches = csvTransactions
        .map(transaction => {
          // Calculate various match criteria
          const amountMatch = Math.abs(parseFloat(invoice.Total) - parseFloat(transaction.amount)) < 0.01;
          
          // Calculate date match score based on proximity
          let dateScore = 0;
          let dateDiff = 999; // Default to a large number if dates can't be compared
          
          if (invoice.Date && transaction.date) {
            const invoiceDate = new Date(invoice.Date);
            const transactionDate = new Date(transaction.date);
            
            // Ensure both dates are valid
            if (!isNaN(invoiceDate.getTime()) && !isNaN(transactionDate.getTime())) {
              dateDiff = Math.abs(invoiceDate - transactionDate) / (1000 * 60 * 60 * 24); // Convert to days
              
              // Score based on date proximity (full score if within 2 days, partial if within 7)
              if (dateDiff <= 2) {
                dateScore = 1.0;
              } else if (dateDiff <= 7) {
                dateScore = 0.5;
              }
            }
          }
          
          // Calculate reference match score
          let referenceScore = 0;
          let referenceDetails = '';
          
          if (invoice.InvoiceNumber && transaction.reference) {
            const invoiceNum = String(invoice.InvoiceNumber).toLowerCase().trim();
            const reference = String(transaction.reference).toLowerCase().trim();
            
            // Exact match
            if (invoiceNum === reference) {
              referenceScore = 1.0;
              referenceDetails = 'exact';
            }
            // Partial match - invoice number contained in reference
            else if (reference.includes(invoiceNum)) {
              referenceScore = 0.8;
              referenceDetails = 'invoice in reference';
            }
            // Partial match - reference contained in invoice number
            else if (invoiceNum.includes(reference)) {
              referenceScore = 0.6;
              referenceDetails = 'reference in invoice';
            }
            // Try partial match with only numbers (remove letters)
            else {
              const invoiceNumeric = invoiceNum.replace(/\D/g, '');
              const referenceNumeric = reference.replace(/\D/g, '');
              
              if (invoiceNumeric && referenceNumeric && 
                  (invoiceNumeric === referenceNumeric || 
                   referenceNumeric.includes(invoiceNumeric) || 
                   invoiceNumeric.includes(referenceNumeric))) {
                referenceScore = 0.4;
                referenceDetails = 'numeric match';
              }
            }
          }
          
          // Also try to match by transaction number if different from reference
          if (referenceScore === 0 && invoice.InvoiceNumber && transaction.transactionNumber) {
            const invoiceNum = String(invoice.InvoiceNumber).toLowerCase().trim();
            const transactionNum = String(transaction.transactionNumber).toLowerCase().trim();
            
            // Follow the same pattern as reference matching
            if (invoiceNum === transactionNum) {
              referenceScore = 0.9; // Slightly lower than direct reference match
              referenceDetails = 'exact txn';
            } else if (transactionNum.includes(invoiceNum)) {
              referenceScore = 0.7;
              referenceDetails = 'invoice in txn';
            } else if (invoiceNum.includes(transactionNum)) {
              referenceScore = 0.5;
              referenceDetails = 'txn in invoice';
            }
          }
          
          // Calculate overall match confidence using weighted criteria
          // Amount is 50%, Date is 30%, Reference is 20%
          const amountWeight = 0.5;
          const dateWeight = 0.3;
          const referenceWeight = 0.2;
          
          const confidence = 
            (amountMatch ? amountWeight : 0) + 
            (dateScore * dateWeight) + 
            (referenceScore * referenceWeight);
            
          // Enhance the transaction object with matching metadata
          return {
            ...transaction,
            confidence,
            matchDetails: {
              amountMatch,
              dateScore,
              dateDiff,
              referenceScore,
              referenceDetails
            }
          };
        })
        .filter(transaction => transaction.confidence >= 0.5) // Only keep matches with confidence >= 50%
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence (highest first)
      
      if (matches.length > 0) {
        console.log(`Found ${matches.length} potential matches for invoice ${invoice.InvoiceNumber}`);
        potentialMatches.push({
          invoice,
          matches: matches.map(match => ({
            id: match.transactionNumber, // Use transaction number as ID for CSV
            reference: match.reference,
            amount: match.amount,
            date: match.date,
            description: match.description || '',
            confidence: match.confidence,
            matchDetails: match.matchDetails,
            source: 'CSV'
          }))
        });
      } else {
        console.log(`No matches found for invoice ${invoice.InvoiceNumber}`);
        unmatchedInvoices.push(invoice);
      }
    }

    console.log(`Matching complete: Found potential matches for ${potentialMatches.length} invoices, with ${unmatchedInvoices.length} unmatched invoices`);
    
    // Find potential date discrepancies (matches where date is off but amount matches)
    const dateDiscrepancies = potentialMatches
      .filter(match => {
        const bestMatch = match.matches[0];
        return bestMatch.matchDetails.amountMatch && bestMatch.matchDetails.dateScore < 1.0;
      });
      
    console.log(`Found ${dateDiscrepancies.length} matches with date discrepancies`);

    res.status(200).json({
      success: true,
      count: potentialMatches.length,
      data: potentialMatches,
      unmatchedInvoices: unmatchedInvoices,
      dateDiscrepancies: dateDiscrepancies.length
    });
  } catch (error) {
    console.error('Error matching customer invoices with CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing match request',
      message: error.message
    });
  }
};

// @desc    Approve a customer invoice match
// @route   POST /api/transactions/approve-customer-match
// @access  Private
export const approveCustomerMatch = async (req, res) => {
  try {
    const { invoiceId, transactionId } = req.body;
    
    if (!invoiceId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID and transaction ID are required'
      });
    }
    
    // If this is a database transaction, find and update
    let updatedTransaction;
    try {
      updatedTransaction = await Transaction.findByIdAndUpdate(
        transactionId,
        {
          status: 'matched',
          matchedInvoiceId: invoiceId,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      // If the ID isn't a valid MongoDB ID, transactionId might be a CSV reference
      console.log('Transaction not found in DB, treating as CSV reference');
      
      // For CSV transactions, we'll just record it in a temporary store or create a new record
      // This is a simplified approach - in production, you'd likely want to store this match permanently
      updatedTransaction = {
        id: transactionId,
        status: 'matched',
        matchedInvoiceId: invoiceId,
        source: 'CSV',
        updatedAt: new Date()
      };
    }
    
    res.json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error approving customer match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve match',
      message: error.message
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};