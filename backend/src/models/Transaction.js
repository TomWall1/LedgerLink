import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  transactionNumber: {
    type: String,
    required: true,
    trim: true,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['INVOICE', 'CREDIT_NOTE', 'PAYMENT', 'BILL', 'BILL_PAYMENT', 'OTHER'],
  },
  amount: {
    type: Number,
    required: true,
  },
  issueDate: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'VOIDED', 'DELETED'],
  },
  reference: {
    type: String,
    trim: true,
  },
  counterparty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  },
  counterpartyTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  },
  matchStatus: {
    type: String,
    enum: ['UNMATCHED', 'MATCHED', 'PARTIALLY_MATCHED', 'DISCREPANCY'],
    default: 'UNMATCHED',
  },
  discrepancies: [{
    field: String,
    company1Value: mongoose.Schema.Types.Mixed,
    company2Value: mongoose.Schema.Types.Mixed,
  }],
  source: {
    type: String,
    enum: ['XERO', 'CSV', 'MANUAL', 'API'],
    required: true,
  },
  sourceId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a compound index for company and transaction number
TransactionSchema.index(
  { company: 1, transactionNumber: 1 },
  { unique: true }
);

// Update the updatedAt field on save
TransactionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
