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
    // Extract data from the request
    const { customerInvoices, dateFormat, customerId, useHistoricalData } = req.body;
    const csvFile = req.file;

    if (!customerInvoices || !csvFile) {
      return res.status(400).json({
        success: false,
        error: 'Missing required data: customer invoices or CSV file'
      });
    }

    // Parse the customer invoices JSON
    let invoices;
    try {
      invoices = JSON.parse(customerInvoices);
    } catch (error) {
      console.error('Error parsing customer invoices JSON:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid customer invoices format'
      });
    }

    // Parse the CSV file
    const csvTransactions = await parseCSV(csvFile.path, dateFormat || 'MM/DD/YYYY');

    if (csvTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid transactions found in the CSV file'
      });
    }

    // Match each invoice with potential CSV transactions
    const potentialMatches = [];

    invoices.forEach(invoice => {
      // Find potential matches for this invoice
      const matches = csvTransactions.filter(transaction => {
        // Match by amount
        const amountMatch = Math.abs(invoice.Total - transaction.amount) < 0.01;

        // Match by date proximity (within 7 days)
        let dateMatch = false;
        if (invoice.Date && transaction.date) {
          const dateDiff = Math.abs(
            new Date(invoice.Date) - new Date(transaction.date)
          ) / (1000 * 60 * 60 * 24); // Convert to days
          dateMatch = dateDiff <= 7;
        }

        // Match by reference/invoice number
        let referenceMatch = false;
        if (invoice.InvoiceNumber && transaction.reference) {
          referenceMatch = transaction.reference.includes(invoice.InvoiceNumber) ||
                           invoice.InvoiceNumber.includes(transaction.reference);
        }

        // Determine match confidence
        let confidence = 0;
        if (amountMatch) confidence += 0.5;
        if (dateMatch) confidence += 0.3;
        if (referenceMatch) confidence += 0.2;

        // Consider it a match if the confidence is at least 0.5 (amount + either date or reference)
        return confidence >= 0.5 ? (transaction.confidence = confidence, true) : false;
      });

      if (matches.length > 0) {
        potentialMatches.push({
          invoice,
          matches: matches.map(match => ({
            id: match.transactionNumber, // Use transaction number as ID for CSV
            reference: match.reference,
            amount: match.amount,
            date: match.date,
            description: match.description,
            confidence: match.confidence,
            source: 'CSV'
          }))
        });
      }
    });

    res.status(200).json({
      success: true,
      count: potentialMatches.length,
      data: potentialMatches
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