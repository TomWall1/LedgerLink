// backend/models/coupaNetsuiteSchemas.js
// MongoDB schemas for Coupa-NetSuite invoice comparison

const mongoose = require('mongoose');

/**
 * Schema for storing Coupa invoices
 */
const CoupaInvoiceSchema = new mongoose.Schema({
  // Coupa-specific fields
  coupaId: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  
  // Invoice details
  invoiceNumber: { type: String, required: true, index: true },
  poNumber: { type: String, index: true },
  supplierName: { type: String, required: true, index: true },
  supplierId: { type: String },
  
  // Financial data
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Dates
  invoiceDate: { type: Date, index: true },
  createdAt: { type: Date, index: true },
  updatedAt: { type: Date },
  dueDate: { type: Date },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED', 'DISPUTED'],
    default: 'DRAFT',
    index: true
  },
  approvalStatus: { 
    type: String, 
    enum: ['PENDING_BUYER', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REQUIRES_APPROVAL', 'UNKNOWN'],
    default: 'UNKNOWN',
    index: true
  },
  
  // Additional data
  description: { type: String },
  rawData: { type: mongoose.Schema.Types.Mixed }, // Store original Coupa response
  
  // Processing metadata
  fetchedAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'coupa_invoices'
});

/**
 * Schema for storing NetSuite AR ledger data
 */
const NetSuiteInvoiceSchema = new mongoose.Schema({
  // Internal identification
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  uploadId: { type: String, required: true, index: true }, // Links to specific upload batch
  lineNumber: { type: Number }, // Original line number in CSV
  
  // Invoice details
  invoiceNumber: { type: String, required: true, index: true },
  poNumber: { type: String, index: true },
  supplierName: { type: String, required: true, index: true },
  
  // Financial data
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  
  // Dates
  invoiceDate: { type: Date, index: true },
  dueDate: { type: Date },
  
  // NetSuite specific fields
  status: { 
    type: String, 
    enum: ['OPEN', 'PAID', 'PARTIAL', 'PENDING', 'APPROVED', 'REJECTED', 'VOIDED', 'CANCELLED', 'UNKNOWN'],
    default: 'UNKNOWN',
    index: true
  },
  paymentStatus: { type: String },
  class: { type: String },
  department: { type: String },
  location: { type: String },
  
  // Additional data
  description: { type: String },
  processingNotes: [{ type: String }], // Any issues during processing
  
  // Processing metadata
  source: { type: String, default: 'NetSuite' },
  processedAt: { type: Date, default: Date.now },
  fileName: { type: String } // Original filename
}, {
  timestamps: true,
  collection: 'netsuite_invoices'
});

/**
 * Schema for storing comparison results
 */
const InvoiceComparisonSchema = new mongoose.Schema({
  // Identification
  comparisonId: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Source data references
  coupaFetchId: { type: String }, // Reference to Coupa fetch batch
  netsuiteUploadId: { type: String }, // Reference to NetSuite upload batch
  
  // Comparison metadata
  comparisonTimestamp: { type: Date, default: Date.now },
  matchingOptions: {
    amountTolerance: { type: Number, default: 0.01 },
    dateTolerance: { type: Number, default: 3 },
    fuzzyThreshold: { type: Number, default: 0.8 }
  },
  
  // Summary statistics
  summary: {
    totalCoupa: { type: Number, required: true },
    totalNetSuite: { type: Number, required: true },
    matched: { type: Number, required: true },
    approvedInCoupa: { type: Number, default: 0 },
    pendingApproval: { type: Number, default: 0 },
    notInCoupa: { type: Number, default: 0 },
    inCoupaNotNetSuite: { type: Number, default: 0 },
    disputed: { type: Number, default: 0 },
    matchRate: { type: Number }, // Percentage
    approvalRate: { type: Number }, // Percentage
    discrepancyRate: { type: Number } // Percentage
  },
  
  // Detailed results (stored as references for large datasets)
  matches: [{
    matchId: { type: String, required: true },
    coupaInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoupaInvoice' },
    netsuiteInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'NetSuiteInvoice' },
    matchType: { 
      type: String, 
      enum: ['INVOICE_NUMBER', 'PO_NUMBER', 'FUZZY'],
      required: true 
    },
    confidence: { type: Number, min: 0, max: 1 },
    discrepancies: [{
      field: { type: String },
      coupaValue: { type: mongoose.Schema.Types.Mixed },
      netsuiteValue: { type: mongoose.Schema.Types.Mixed },
      difference: { type: mongoose.Schema.Types.Mixed }
    }],
    category: { 
      type: String,
      enum: ['approvedInCoupa', 'pendingApproval', 'notInCoupa', 'inCoupaNotNetSuite', 'disputed'],
      required: true
    },
    matchedAt: { type: Date, default: Date.now }
  }],
  
  // Category breakdowns (for quick access)
  categories: {
    approvedInCoupa: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceMatch' }],
    pendingApproval: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceMatch' }],
    notInCoupa: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NetSuiteInvoice' }],
    inCoupaNotNetSuite: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoupaInvoice' }],
    disputed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceMatch' }]
  },
  
  // Export tracking
  exports: [{
    exportId: { type: String },
    category: { type: String },
    format: { type: String, enum: ['CSV', 'JSON', 'PDF'] },
    exportedAt: { type: Date, default: Date.now },
    exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['PROCESSING', 'COMPLETED', 'FAILED', 'ARCHIVED'],
    default: 'PROCESSING'
  },
  
  // Error handling
  errors: [{
    errorType: { type: String },
    errorMessage: { type: String },
    errorTimestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  collection: 'invoice_comparisons'
});

/**
 * Schema for tracking file uploads and processing batches
 */
const ProcessingBatchSchema = new mongoose.Schema({
  // Identification
  batchId: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Batch type and source
  batchType: { 
    type: String, 
    enum: ['COUPA_FETCH', 'NETSUITE_UPLOAD', 'COMPARISON'],
    required: true 
  },
  source: { 
    type: String, 
    enum: ['COUPA_API', 'NETSUITE_CSV', 'MANUAL'],
    required: true 
  },
  
  // File information (for uploads)
  originalFileName: { type: String },
  fileSize: { type: Number },
  filePath: { type: String },
  
  // Processing statistics
  totalRecords: { type: Number, default: 0 },
  processedRecords: { type: Number, default: 0 },
  errorRecords: { type: Number, default: 0 },
  
  // Processing status
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  // Processing details
  startedAt: { type: Date },
  completedAt: { type: Date },
  processingDuration: { type: Number }, // milliseconds
  
  // Configuration used
  processingConfig: {
    fieldMappings: { type: mongoose.Schema.Types.Mixed },
    validationRules: { type: mongoose.Schema.Types.Mixed },
    filters: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Error tracking
  errors: [{
    lineNumber: { type: Number },
    errorType: { type: String },
    errorMessage: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed }
  }],
  
  // Results summary
  summary: {
    successRate: { type: Number },
    totalAmount: { type: Number },
    dateRange: {
      earliest: { type: Date },
      latest: { type: Date }
    },
    suppliers: { type: Number },
    currencies: [{ type: String }]
  }
}, {
  timestamps: true,
  collection: 'processing_batches'
});

/**
 * Schema for storing Coupa API configuration per company
 */
const CoupaConfigSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  
  // API Configuration
  apiUrl: { type: String, required: true },
  apiKey: { type: String, required: true }, // Should be encrypted
  
  // Connection status
  isActive: { type: Boolean, default: true },
  lastConnectionTest: { type: Date },
  connectionStatus: { 
    type: String, 
    enum: ['CONNECTED', 'DISCONNECTED', 'ERROR'],
    default: 'DISCONNECTED'
  },
  
  // Sync settings
  autoSync: { type: Boolean, default: false },
  syncFrequency: { 
    type: String, 
    enum: ['HOURLY', 'DAILY', 'WEEKLY', 'MANUAL'],
    default: 'MANUAL'
  },
  lastSyncAt: { type: Date },
  nextSyncAt: { type: Date },
  
  // Default filters for fetching invoices
  defaultFilters: {
    dateRange: { type: Number, default: 30 }, // days
    suppliers: [{ type: String }],
    statuses: [{ type: String }],
    maxRecords: { type: Number, default: 1000 }
  },
  
  // Field mappings and customizations
  fieldMappings: { type: mongoose.Schema.Types.Mixed },
  
  // Error tracking
  connectionErrors: [{
    errorMessage: { type: String },
    errorTimestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  collection: 'coupa_configs'
});

/**
 * Schema for audit trail and activity logging
 */
const ActivityLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Activity details
  activityType: { 
    type: String, 
    enum: [
      'COUPA_CONNECTION_TEST',
      'COUPA_INVOICE_FETCH',
      'NETSUITE_FILE_UPLOAD',
      'INVOICE_COMPARISON',
      'RESULTS_EXPORT',
      'CONFIG_UPDATE',
      'USER_LOGIN',
      'ERROR_OCCURRED'
    ],
    required: true
  },
  
  activityDescription: { type: String, required: true },
  
  // Related entities
  relatedEntities: {
    batchId: { type: String },
    comparisonId: { type: String },
    invoiceId: { type: String },
    fileName: { type: String }
  },
  
  // Activity metadata
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Results
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  
  // Timing
  duration: { type: Number }, // milliseconds
  
  // User agent and IP (for security)
  userAgent: { type: String },
  ipAddress: { type: String }
}, {
  timestamps: true,
  collection: 'activity_logs'
});

// Indexes for performance
CoupaInvoiceSchema.index({ companyId: 1, invoiceNumber: 1 });
CoupaInvoiceSchema.index({ companyId: 1, status: 1, invoiceDate: -1 });
CoupaInvoiceSchema.index({ companyId: 1, supplierName: 1, amount: 1 });

NetSuiteInvoiceSchema.index({ companyId: 1, uploadId: 1 });
NetSuiteInvoiceSchema.index({ companyId: 1, invoiceNumber: 1 });
NetSuiteInvoiceSchema.index({ companyId: 1, supplierName: 1, amount: 1 });

InvoiceComparisonSchema.index({ companyId: 1, comparisonTimestamp: -1 });
InvoiceComparisonSchema.index({ comparisonId: 1 });

ProcessingBatchSchema.index({ companyId: 1, batchType: 1, status: 1 });
ProcessingBatchSchema.index({ batchId: 1 });

ActivityLogSchema.index({ companyId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, activityType: 1 });

// Create models
const CoupaInvoice = mongoose.model('CoupaInvoice', CoupaInvoiceSchema);
const NetSuiteInvoice = mongoose.model('NetSuiteInvoice', NetSuiteInvoiceSchema);
const InvoiceComparison = mongoose.model('InvoiceComparison', InvoiceComparisonSchema);
const ProcessingBatch = mongoose.model('ProcessingBatch', ProcessingBatchSchema);
const CoupaConfig = mongoose.model('CoupaConfig', CoupaConfigSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

/**
 * Helper functions for database operations
 */
class CoupaNetSuiteDatabase {
  
  /**
   * Save Coupa invoices to database
   */
  static async saveCoupaInvoices(companyId, invoices, batchId) {
    const results = {
      saved: 0,
      updated: 0,
      errors: []
    };

    for (const invoice of invoices) {
      try {
        const existingInvoice = await CoupaInvoice.findOne({
          companyId,
          coupaId: invoice.coupaId
        });

        if (existingInvoice) {
          // Update existing invoice
          await CoupaInvoice.updateOne(
            { _id: existingInvoice._id },
            { ...invoice, lastSyncAt: new Date() }
          );
          results.updated++;
        } else {
          // Create new invoice
          await CoupaInvoice.create({
            ...invoice,
            companyId,
            fetchedAt: new Date(),
            lastSyncAt: new Date()
          });
          results.saved++;
        }
      } catch (error) {
        results.errors.push({
          invoiceId: invoice.coupaId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Save NetSuite invoices to database
   */
  static async saveNetSuiteInvoices(companyId, invoices, uploadId, fileName) {
    const results = {
      saved: 0,
      errors: []
    };

    for (const invoice of invoices) {
      try {
        await NetSuiteInvoice.create({
          ...invoice,
          companyId,
          uploadId,
          fileName,
          processedAt: new Date()
        });
        results.saved++;
      } catch (error) {
        results.errors.push({
          lineNumber: invoice.lineNumber,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Save comparison results to database
   */
  static async saveComparisonResults(companyId, userId, comparisonResults, batchInfo) {
    try {
      const comparison = new InvoiceComparison({
        comparisonId: comparisonResults.comparisonId || `comparison_${Date.now()}`,
        companyId,
        userId,
        coupaFetchId: batchInfo.coupaFetchId,
        netsuiteUploadId: batchInfo.netsuiteUploadId,
        comparisonTimestamp: comparisonResults.timestamp,
        summary: comparisonResults.summary,
        matchingOptions: batchInfo.matchingOptions || {},
        status: 'COMPLETED'
      });

      await comparison.save();
      return comparison;
    } catch (error) {
      console.error('Error saving comparison results:', error);
      throw error;
    }
  }

  /**
   * Get comparison history for a company
   */
  static async getComparisonHistory(companyId, limit = 10, offset = 0) {
    try {
      const comparisons = await InvoiceComparison
        .find({ companyId })
        .sort({ comparisonTimestamp: -1 })
        .skip(offset)
        .limit(limit)
        .populate('userId', 'name email')
        .lean();

      const total = await InvoiceComparison.countDocuments({ companyId });

      return {
        comparisons,
        total,
        hasMore: (offset + limit) < total
      };
    } catch (error) {
      console.error('Error fetching comparison history:', error);
      throw error;
    }
  }

  /**
   * Clean up old data (for maintenance)
   */
  static async cleanupOldData(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Remove old processing batches
      const batchResult = await ProcessingBatch.deleteMany({
        completedAt: { $lt: cutoffDate },
        status: 'COMPLETED'
      });

      // Remove old activity logs
      const logResult = await ActivityLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      // Archive old comparisons instead of deleting
      await InvoiceComparison.updateMany(
        { 
          comparisonTimestamp: { $lt: cutoffDate },
          status: { $ne: 'ARCHIVED' }
        },
        { status: 'ARCHIVED' }
      );

      return {
        batchesRemoved: batchResult.deletedCount,
        logsRemoved: logResult.deletedCount,
        comparisonsArchived: await InvoiceComparison.countDocuments({ status: 'ARCHIVED' })
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(companyId) {
    try {
      const stats = await Promise.all([
        // Total invoices processed this month
        CoupaInvoice.countDocuments({
          companyId,
          fetchedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }),
        
        // Total comparisons this month
        InvoiceComparison.countDocuments({
          companyId,
          comparisonTimestamp: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }),
        
        // Latest comparison
        InvoiceComparison.findOne({ companyId })
          .sort({ comparisonTimestamp: -1 })
          .lean(),
          
        // Processing errors this week
        ProcessingBatch.countDocuments({
          companyId,
          status: 'FAILED',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        invoicesThisMonth: stats[0],
        comparisonsThisMonth: stats[1],
        latestComparison: stats[2],
        errorsThisWeek: stats[3]
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = {
  CoupaInvoice,
  NetSuiteInvoice,
  InvoiceComparison,
  ProcessingBatch,
  CoupaConfig,
  ActivityLog,
  CoupaNetSuiteDatabase
};