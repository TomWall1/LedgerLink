import express from 'express';
import mongoose from 'mongoose';
import { upload, parseCSV, deleteFile } from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
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

// Get all transactions
router.get('/', protect, getTransactions);

// Upload transactions
router.post('/upload', protect, uploadTransactions);

// Match transactions with counterparties
router.get('/match', protect, matchTransactions);

// Match customer invoices with transactions from CSV upload
router.post('/match-customer-invoices', protect, upload.single('csvFile'), matchCustomerInvoices);

// Approve a customer invoice match
router.post('/approve-customer-match', protect, approveCustomerMatch);

// Get transaction by ID
router.get('/:id', protect, getTransaction);

// Update transaction
router.put('/:id', protect, updateTransaction);

// Delete transaction
router.delete('/:id', protect, deleteTransaction);

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
        matchStatus: 'MATCHED',
        counterpartyTransactionId: invoiceId,
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
        matchStatus: 'UNMATCHED',
        counterpartyTransactionId: null,
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