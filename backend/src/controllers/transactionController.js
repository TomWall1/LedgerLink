import Transaction from '../models/Transaction.js';
import Company from '../models/Company.js';
import CompanyLink from '../models/CompanyLink.js';

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

// @desc    Get a single transaction
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

    // Check if user has access to this transaction
    if (transaction.company.toString() !== req.user.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this transaction'
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

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    if (transaction.company.toString() !== req.user.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this transaction'
      });
    }

    // Update transaction
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user._id },
      { new: true, runValidators: true }
    );

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

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    if (transaction.company.toString() !== req.user.company.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this transaction'
      });
    }

    await transaction.remove();

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
