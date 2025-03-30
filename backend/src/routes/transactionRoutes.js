import express from 'express';
import mongoose from 'mongoose';
import { upload, parseCSV, deleteFile } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getTransactions, 
  uploadTransactions, 
  matchTransactions, 
  getTransaction, 
  updateTransaction, 
  deleteTransaction,
  matchCustomerInvoices,
  approveCustomerMatch 
} from '../controllers/transactionController.js';

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
router.get('/', protect, getTransactions);

// Upload transactions
router.post('/upload', protect, uploadTransactions);

// Get transaction by ID
router.get('/:id', protect, getTransaction);

// Update transaction
router.put('/:id', protect, updateTransaction);

// Delete transaction
router.delete('/:id', protect, deleteTransaction);

// Match transactions with counterparties
router.get('/match', protect, matchTransactions);

// Match customer invoices with transactions from CSV upload
router.post('/match-customer-invoices', protect, upload.single('csvFile'), async (req, res) => {
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

    // Cleanup the temp file
    deleteFile(csvFile.path);

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
        if (confidence >= 0.5) {
          transaction.confidence = confidence;
          return true;
        }

        return false;
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
});

// Approve a customer invoice match
router.post('/approve-customer-match', protect, approveCustomerMatch);

// Approve a match (legacy endpoint)
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

// Reject a match (legacy endpoint)
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