import express from 'express';
import { 
  uploadTransactions,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  matchTransactions 
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(uploadTransactions) // Upload/create transactions
  .get(getTransactions); // Get transactions with filters

// Special route for matching transactions with counterparties
router.get('/match', matchTransactions);

router.route('/:id')
  .get(getTransaction) // Get transaction by ID
  .put(updateTransaction) // Update transaction
  .delete(deleteTransaction); // Delete transaction

export default router;
