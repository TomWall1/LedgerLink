import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['reconciliation', 'matching', 'discrepancy', 'audit'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    enum: ['csv', 'pdf'],
    default: 'csv'
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'failed'],
    default: 'generating'
  },
  dateRange: {
    preset: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    displayLabel: { type: String }
  },
  parameters: {
    counterpartyId: { type: String }
  },
  fileSize: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date
  },
  error: {
    type: String
  },
  data: {
    matchRunsIncluded: { type: Number, default: 0 },
    totalPerfectMatches: { type: Number, default: 0 },
    totalMismatches: { type: Number, default: 0 },
    totalUnmatchedCompany1: { type: Number, default: 0 },
    totalUnmatchedCompany2: { type: Number, default: 0 },
    averageMatchRate: { type: Number, default: 0 },
    totals: {
      company1Total: { type: Number, default: 0 },
      company2Total: { type: Number, default: 0 },
      variance: { type: Number, default: 0 }
    },
    matchRunDetails: [{
      matchRunId: { type: mongoose.Schema.Types.ObjectId },
      matchRunDate: { type: Date },
      perfectMatchCount: { type: Number },
      mismatchCount: { type: Number },
      unmatchedCompany1Count: { type: Number },
      unmatchedCompany2Count: { type: Number },
      matchRate: { type: Number },
      company1Total: { type: Number },
      company2Total: { type: Number },
      variance: { type: Number }
    }]
  }
}, {
  timestamps: true
});

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ companyId: 1, type: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
