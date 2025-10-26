import mongoose from 'mongoose';

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
    company1: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    },
    company2: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    }
  }],
  mismatches: [{
    company1: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    },
    company2: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    }
  }],
  unmatchedItems: {
    company1: [{
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    }],
    company2: [{
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    }]
  },
  historicalInsights: [{
    apItem: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    },
    historicalMatch: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String,
      payment_date: Date,
      is_paid: Boolean,
      is_voided: Boolean
    },
    insight: {
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['info', 'warning', 'error']
      }
    }
  }],
  dateMismatches: [{
    company1: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    },
    company2: {
      transactionNumber: String,
      type: String,
      amount: Number,
      date: Date,
      dueDate: Date,
      status: String,
      reference: String
    },
    mismatchType: String,
    company1Date: Date,
    company2Date: Date,
    daysDifference: Number
  }],
  totals: {
    company1Total: Number,
    company2Total: Number,
    variance: Number
  },
  statistics: {
    perfectMatchCount: Number,
    mismatchCount: Number,
    unmatchedCompany1Count: Number,
    unmatchedCompany2Count: Number,
    matchRate: Number, // Percentage
    processingTime: Number // milliseconds
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
    fileName1: String,
    fileName2: String,
    uploadedBy: String,
    notes: String
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
