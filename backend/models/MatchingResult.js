import mongoose from 'mongoose';

// Define the invoice subdocument schema explicitly
const invoiceSchema = new mongoose.Schema({
  transactionNumber: { type: String },
  type: { type: String },
  amount: { type: Number },
  date: { type: Date },
  dueDate: { type: Date },
  status: { type: String },
  reference: { type: String }
}, { _id: false }); // _id: false means don't create an _id for each subdocument

// Define the historical match schema (extends invoice schema with payment info)
const historicalMatchSchema = new mongoose.Schema({
  transactionNumber: { type: String },
  type: { type: String },
  amount: { type: Number },
  date: { type: Date },
  dueDate: { type: Date },
  status: { type: String },
  reference: { type: String },
  payment_date: { type: Date },
  is_paid: { type: Boolean },
  is_voided: { type: Boolean }
}, { _id: false });

const matchingResultSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  counterpartyId: {
    type: String,
    index: true
  },
  matchRunDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  dateFormat1: {
    type: String,
    default: 'DD/MM/YYYY'
  },
  dateFormat2: {
    type: String,
    default: 'DD/MM/YYYY'
  },
  perfectMatches: [{
    company1: { type: invoiceSchema },
    company2: { type: invoiceSchema }
  }],
  mismatches: [{
    company1: { type: invoiceSchema },
    company2: { type: invoiceSchema }
  }],
  unmatchedItems: {
    company1: [{ type: invoiceSchema }],
    company2: [{ type: invoiceSchema }]
  },
  historicalInsights: [{
    apItem: { type: invoiceSchema },
    historicalMatch: { type: historicalMatchSchema },
    insight: {
      type: {
        type: { type: String },
        message: { type: String },
        severity: {
          type: String,
          enum: ['info', 'warning', 'error']
        }
      }
    }
  }],
  dateMismatches: [{
    company1: { type: invoiceSchema },
    company2: { type: invoiceSchema },
    mismatchType: { type: String },
    company1Date: { type: Date },
    company2Date: { type: Date },
    daysDifference: { type: Number }
  }],
  totals: {
    company1Total: { type: Number },
    company2Total: { type: Number },
    variance: { type: Number }
  },
  statistics: {
    perfectMatchCount: { type: Number },
    mismatchCount: { type: Number },
    unmatchedCompany1Count: { type: Number },
    unmatchedCompany2Count: { type: Number },
    matchRate: { type: Number }, // Percentage
    processingTime: { type: Number } // milliseconds
  },
  metadata: {
    sourceType1: {
      type: String,
      enum: ['csv', 'xero', 'quickbooks', 'manual', 'other']
    },
    sourceType2: {
      type: String,
      enum: ['csv', 'xero', 'quickbooks', 'manual', 'other']
    },
    fileName1: { type: String },
    fileName2: { type: String },
    uploadedBy: { type: String },
    notes: { type: String }
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
matchingResultSchema.index({ companyId: 1, matchRunDate: -1 });
matchingResultSchema.index({ companyId: 1, counterpartyId: 1, matchRunDate: -1 });
matchingResultSchema.index({ 'metadata.uploadedBy': 1, matchRunDate: -1 });

// Add a method to calculate match statistics
matchingResultSchema.methods.calculateStatistics = function() {
  const totalCompany1 = this.perfectMatches.length + this.mismatches.length + this.unmatchedItems.company1.length;
  const totalCompany2 = this.perfectMatches.length + this.mismatches.length + this.unmatchedItems.company2.length;
  const totalItems = Math.max(totalCompany1, totalCompany2);
  
  this.statistics = {
    perfectMatchCount: this.perfectMatches.length,
    mismatchCount: this.mismatches.length,
    unmatchedCompany1Count: this.unmatchedItems.company1.length,
    unmatchedCompany2Count: this.unmatchedItems.company2.length,
    matchRate: totalItems > 0 ? (this.perfectMatches.length / totalItems) * 100 : 0,
    processingTime: this.metadata.processingTime || 0
  };
  
  return this.statistics;
};

// Add a static method to get recent matches for a company
matchingResultSchema.statics.getRecentMatches = function(companyId, limit = 10) {
  return this.find({ companyId })
    .sort({ matchRunDate: -1 })
    .limit(limit)
    .select('-unmatchedItems -mismatches') // Exclude large arrays for list view
    .exec();
};

// Add a static method to get match statistics for a company
matchingResultSchema.statics.getCompanyStatistics = function(companyId) {
  return this.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: '$companyId',
        totalRuns: { $sum: 1 },
        avgMatchRate: { $avg: '$statistics.matchRate' },
        totalPerfectMatches: { $sum: '$statistics.perfectMatchCount' },
        totalMismatches: { $sum: '$statistics.mismatchCount' },
        lastRun: { $max: '$matchRunDate' }
      }
    }
  ]);
};

const MatchingResult = mongoose.model('MatchingResult', matchingResultSchema);

export default MatchingResult;
