import express from 'express';
import {
  importTransactions,
  getTransactions,
  getTransactionById,
  getMatchedTransactions,
  getUnmatchedTransactions,
  getTransactionsWithDiscrepancies,
  manuallyMatchTransactions
} from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Transaction routes
router.route('/')
  .get(getTransactions)
  .post(importTransactions);

// Get transaction by ID
router.get('/:id', getTransactionById);

// Get matched transactions
router.get('/status/matched', getMatchedTransactions);

// Get unmatched transactions
router.get('/status/unmatched', getUnmatchedTransactions);

// Get transactions with discrepancies
router.get('/status/discrepancies', getTransactionsWithDiscrepancies);

// Manually match transactions
router.post('/:id/match', authorize('admin'), manuallyMatchTransactions);

export default router;
