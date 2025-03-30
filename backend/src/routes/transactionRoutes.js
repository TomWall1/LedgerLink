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
router.post('/match-customer-invoices', protect, upload.single('csvFile'), matchCustomerInvoices);

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