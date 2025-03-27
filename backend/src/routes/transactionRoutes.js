import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Transaction model schema
const TransactionSchema = new mongoose.Schema({
  reference: String,
  description: String,
  amount: Number,
  date: Date,
  source: String,
  status: {
    type: String,
    enum: ['pending', 'matched', 'approved', 'rejected'],
    default: 'pending'
  },
  matchedInvoiceId: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Create model if it doesn't exist
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { status, source } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (status) query.status = status;
    if (source) query.source = source;
    
    // If user is authenticated, only show their transactions
    if (req.user) {
      query.userId = req.user._id;
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// Find potential matches for an invoice
router.post('/find-matches', async (req, res) => {
  try {
    const { invoice, criteria } = req.body;
    
    if (!invoice) {
      return res.status(400).json({
        success: false,
        error: 'Invoice data is required'
      });
    }
    
    // Default criteria if not provided
    const matchingCriteria = criteria || {
      matchByAmount: true,
      matchByDate: true,
      dateToleranceDays: 7,
      matchByReference: true,
      partialReferenceMatch: true,
      matchByDescription: false
    };
    
    // Get transactions that could potentially match
    const query = {
      status: 'pending' // Only look at unmatched transactions
    };
    
    // Filter by amount if required
    if (matchingCriteria.matchByAmount) {
      // Allow for small rounding differences
      const invoiceAmount = invoice.Total || invoice.amount;
      query.amount = {
        $gte: invoiceAmount * 0.99, // 1% tolerance
        $lte: invoiceAmount * 1.01
      };
    }
    
    // Filter by date if required
    if (matchingCriteria.matchByDate) {
      const invoiceDate = new Date(invoice.Date || invoice.date);
      const tolerance = matchingCriteria.dateToleranceDays || 7;
      
      // Create date range
      const startDate = new Date(invoiceDate);
      startDate.setDate(startDate.getDate() - tolerance);
      
      const endDate = new Date(invoiceDate);
      endDate.setDate(endDate.getDate() + tolerance);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Fetch potential matches
    const potentialMatches = await Transaction.find(query);
    
    // For each match, calculate a confidence score
    const scoredMatches = potentialMatches.map(transaction => {
      let score = 0;
      
      // Score based on amount (exact match is best)
      if (matchingCriteria.matchByAmount) {
        const invoiceAmount = invoice.Total || invoice.amount;
        const amountDiff = Math.abs(transaction.amount - invoiceAmount) / invoiceAmount;
        score += (1 - amountDiff) * 0.5; // Weight amount as 50% of score
      }
      
      // Score based on date proximity
      if (matchingCriteria.matchByDate) {
        const invoiceDate = new Date(invoice.Date || invoice.date);
        const transDate = new Date(transaction.date);
        const daysDiff = Math.abs((transDate - invoiceDate) / (1000 * 60 * 60 * 24));
        const tolerance = matchingCriteria.dateToleranceDays || 7;
        
        score += (1 - (daysDiff / tolerance)) * 0.3; // Weight date as 30% of score
      }
      
      // Score based on reference match
      if (matchingCriteria.matchByReference && transaction.reference && (invoice.InvoiceNumber || invoice.reference)) {
        const invoiceRef = (invoice.InvoiceNumber || invoice.reference || '').toString().toLowerCase();
        const transRef = transaction.reference.toString().toLowerCase();
        
        if (matchingCriteria.partialReferenceMatch) {
          // Check if one contains the other
          if (transRef.includes(invoiceRef) || invoiceRef.includes(transRef)) {
            score += 0.15; // Weight reference as 15% of score
          }
        } else {
          // Exact match only
          if (transRef === invoiceRef) {
            score += 0.15;
          }
        }
      }
      
      // Score based on description match
      if (matchingCriteria.matchByDescription && transaction.description && 
          (invoice.Reference || invoice.Description || invoice.description)) {
        const invoiceDesc = (invoice.Reference || invoice.Description || invoice.description || '').toString().toLowerCase();
        const transDesc = transaction.description.toString().toLowerCase();
        
        // Simple check if one contains parts of the other
        const words = invoiceDesc.split(/\s+/).filter(w => w.length > 3);
        const foundWords = words.filter(word => transDesc.includes(word)).length;
        
        if (words.length > 0) {
          score += (foundWords / words.length) * 0.05; // Weight description as 5% of score
        }
      }
      
      return {
        ...transaction.toObject(),
        confidence: Math.min(Math.max(score, 0), 1) // Ensure score is between 0 and 1
      };
    });
    
    // Sort by confidence score, highest first
    const sortedMatches = scoredMatches.sort((a, b) => b.confidence - a.confidence);
    
    // Only return matches with at least minimal confidence
    const minConfidence = 0.3; // 30% confidence minimum
    const matches = sortedMatches.filter(match => match.confidence >= minConfidence);
    
    res.json({
      success: true,
      matches: matches.slice(0, 10) // Limit to top 10 matches
    });
  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find potential matches'
    });
  }
});

// Approve a match
router.post('/approve-match', async (req, res) => {
  try {
    const { invoiceId, transactionId } = req.body;
    
    if (!invoiceId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID and transaction ID are required'
      });
    }
    
    // Update transaction status
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: 'matched',
        matchedInvoiceId: invoiceId,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error approving match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve match'
    });
  }
});

// Reject a match
router.post('/reject-match', async (req, res) => {
  try {
    const { invoiceId, transactionId } = req.body;
    
    if (!invoiceId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Invoice ID and transaction ID are required'
      });
    }
    
    // Update transaction status
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status: 'rejected',
        matchedInvoiceId: invoiceId,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error rejecting match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject match'
    });
  }
});

export default router;