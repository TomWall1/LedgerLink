import mongoose from 'mongoose';

const ERPConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['xero', 'csv'],
    default: 'csv',
  },
  connectionType: {
    type: String,
    required: true,
    enum: ['ar', 'ap', 'both'],
    default: 'both',
  },
  connectionName: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    default: null,
  },
  tenantName: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'disconnected', 'error'],
    default: 'active',
  },
  lastSyncedAt: {
    type: Date,
    default: null,
  },
  connectionDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
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

// Update the updatedAt field on save
ERPConnectionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Add unique compound index to prevent duplicate connections for the same company/provider/type
ERPConnectionSchema.index(
  { userId: 1, companyId: 1, provider: 1, connectionType: 1 },
  { unique: true }
);

const ERPConnection = mongoose.model('ERPConnection', ERPConnectionSchema);

export default ERPConnection;
