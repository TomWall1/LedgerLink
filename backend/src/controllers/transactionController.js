import Transaction from '../models/Transaction.js';
import CompanyLink from '../models/CompanyLink.js';
import { matchTransactions } from '../utils/transactionMatcher.js';

// @desc    Import transactions (from CSV or Xero)
// @route   POST /api/transactions/import
// @access  Private
export const importTransactions = async (req, res) => {
  try {
    const { transactions, source } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid transactions array',
      });
    }

    const validSources = ['XERO', 'CSV', 'MANUAL', 'API'];
    if (!source || !validSources.includes(source)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid source',
      });
    }

    // Process each transaction
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const transaction of transactions) {
      try {
        // Check if transaction exists by company and transaction number
        const existingTransaction = await Transaction.findOne({
          company: req.user.company,
          transactionNumber: transaction.transactionNumber,
        });

        if (existingTransaction) {
          // Update existing transaction
          existingTransaction.transactionType = transaction.transactionType;
          existingTransaction.amount = transaction.amount;
          existingTransaction.issueDate = transaction.issueDate;
          existingTransaction.dueDate = transaction.dueDate;
          existingTransaction.status = transaction.status;
          existingTransaction.reference = transaction.reference;
          existingTransaction.source = source;
          existingTransaction.sourceId = transaction.sourceId || existingTransaction.sourceId;

          await existingTransaction.save();
          results.updated++;
        } else {
          // Create new transaction
          await Transaction.create({
            company: req.user.company,
            transactionNumber: transaction.transactionNumber,
            transactionType: transaction.transactionType,
            amount: transaction.amount,
            issueDate: transaction.issueDate,
            dueDate: transaction.dueDate,
            status: transaction.status,
            reference: transaction.reference,
            source,
            sourceId: transaction.sourceId,
          });
          results.created++;
        }
      } catch (error) {
        console.error('Transaction import error:', error);
        results.failed++;
        results.errors.push({
          transactionNumber: transaction.transactionNumber,
          error: error.message,
        });
      }
    }

    // After import, trigger matching process
    await matchWithLinkedCompanies(req.user.company);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Import transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error importing transactions',
    });
  }
};

// @desc    Get company's transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { status, type, startDate, endDate, matchStatus } = req.query;

    // Build query
    const query = { company: req.user.company };

    // Add filters if provided
    if (status) query.status = status;
    if (type) query.transactionType = type;
    if (matchStatus) query.matchStatus = matchStatus;

    // Date range filter
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ issueDate: -1 })
      .populate('counterparty', 'name taxId')
      .populate('counterpartyTransactionId');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching transactions',
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('counterparty', 'name taxId')
      .populate('counterpartyTransactionId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Ensure transaction belongs to user's company
    if (transaction.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching transaction',
    });
  }
};

// @desc    Get matched transactions
// @route   GET /api/transactions/matched
// @access  Private
export const getMatchedTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      company: req.user.company,
      matchStatus: { $in: ['MATCHED', 'PARTIALLY_MATCHED'] },
    })
      .sort({ issueDate: -1 })
      .populate('counterparty', 'name taxId')
      .populate('counterpartyTransactionId');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get matched transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching matched transactions',
    });
  }
};

// @desc    Get unmatched transactions
// @route   GET /api/transactions/unmatched
// @access  Private
export const getUnmatchedTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      company: req.user.company,
      matchStatus: 'UNMATCHED',
    })
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get unmatched transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching unmatched transactions',
    });
  }
};

// @desc    Get transactions with discrepancies
// @route   GET /api/transactions/discrepancies
// @access  Private
export const getTransactionsWithDiscrepancies = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      company: req.user.company,
      matchStatus: 'DISCREPANCY',
    })
      .sort({ issueDate: -1 })
      .populate('counterparty', 'name taxId')
      .populate('counterpartyTransactionId');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions with discrepancies error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching transactions with discrepancies',
    });
  }
};

// @desc    Manually match transactions
// @route   POST /api/transactions/:id/match
// @access  Private (Admin only)
export const manuallyMatchTransactions = async (req, res) => {
  try {
    const { counterpartyTransactionId } = req.body;

    if (!counterpartyTransactionId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide counterpartyTransactionId',
      });
    }

    // Get the transaction to match
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Ensure transaction belongs to user's company
    if (transaction.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to match this transaction',
      });
    }

    // Get the counterparty transaction
    const counterpartyTransaction = await Transaction.findById(counterpartyTransactionId);
    if (!counterpartyTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Counterparty transaction not found',
      });
    }

    // Check if companies are linked
    const isLinked = await CompanyLink.findOne({
      $or: [
        { requestingCompany: transaction.company, targetCompany: counterpartyTransaction.company },
        { requestingCompany: counterpartyTransaction.company, targetCompany: transaction.company },
      ],
      status: 'approved',
    });

    if (!isLinked) {
      return res.status(403).json({
        success: false,
        error: 'Companies are not linked',
      });
    }

    // Check for potential discrepancies
    const { isMatch, discrepancies } = matchTransactionPair(transaction, counterpartyTransaction);

    // Update both transactions
    transaction.counterparty = counterpartyTransaction.company;
    transaction.counterpartyTransactionId = counterpartyTransaction._id;
    transaction.matchStatus = isMatch ? 'MATCHED' : 'DISCREPANCY';
    transaction.discrepancies = discrepancies || [];

    counterpartyTransaction.counterparty = transaction.company;
    counterpartyTransaction.counterpartyTransactionId = transaction._id;
    counterpartyTransaction.matchStatus = isMatch ? 'MATCHED' : 'DISCREPANCY';
    counterpartyTransaction.discrepancies = discrepancies || [];

    await transaction.save();
    await counterpartyTransaction.save();

    res.status(200).json({
      success: true,
      data: {
        transaction,
        counterpartyTransaction,
        isMatch,
        discrepancies: discrepancies || [],
      },
    });
  } catch (error) {
    console.error('Manually match transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error matching transactions',
    });
  }
};

// Helper function to match transactions between linked companies
async function matchWithLinkedCompanies(companyId) {
  try {
    // Find all approved links for the company
    const links = await CompanyLink.find({
      $or: [
        { requestingCompany: companyId },
        { targetCompany: companyId },
      ],
      status: 'approved',
    });

    // For each linked company, match transactions
    for (const link of links) {
      const linkedCompanyId = link.requestingCompany.toString() === companyId.toString() 
        ? link.targetCompany 
        : link.requestingCompany;
      
      await matchTransactions(companyId, linkedCompanyId);
    }
  } catch (error) {
    console.error('Match with linked companies error:', error);
  }
}

// Helper function to match a pair of transactions
function matchTransactionPair(transaction1, transaction2) {
  const discrepancies = [];
  
  // Check amount (allowing for sign inversion between AR and AP)
  const amount1 = transaction1.amount;
  const amount2 = -transaction2.amount; // Invert for matching
  
  if (Math.abs(amount1 - amount2) > 0.01) {
    discrepancies.push({
      field: 'amount',
      company1Value: amount1,
      company2Value: -amount2, // Show original value
    });
  }
  
  // Check dates
  if (transaction1.issueDate && transaction2.issueDate) {
    const date1 = new Date(transaction1.issueDate).toISOString().split('T')[0];
    const date2 = new Date(transaction2.issueDate).toISOString().split('T')[0];
    
    if (date1 !== date2) {
      discrepancies.push({
        field: 'issueDate',
        company1Value: date1,
        company2Value: date2,
      });
    }
  }
  
  // Check due dates if both exist
  if (transaction1.dueDate && transaction2.dueDate) {
    const dueDate1 = new Date(transaction1.dueDate).toISOString().split('T')[0];
    const dueDate2 = new Date(transaction2.dueDate).toISOString().split('T')[0];
    
    if (dueDate1 !== dueDate2) {
      discrepancies.push({
        field: 'dueDate',
        company1Value: dueDate1,
        company2Value: dueDate2,
      });
    }
  }
  
  return {
    isMatch: discrepancies.length === 0,
    discrepancies: discrepancies.length > 0 ? discrepancies : null,
  };
}
