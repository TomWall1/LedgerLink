/**
 * Counterparty Model
 * 
 * This represents a business relationship between companies for invoice reconciliation.
 * Think of it as a "business contact" that you exchange invoices with - either a 
 * customer (who owes you money) or a vendor (who you owe money to).
 */

const mongoose = require('mongoose');

const counterpartySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot be longer than 200 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  type: {
    type: String,
    enum: ['customer', 'vendor'],
    required: [true, 'Counterparty type is required']
  },
  
  // Relationship Management
  primaryUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Primary user is required'],
    index: true
  },
  primaryCompanyName: {
    type: String,
    required: [true, 'Primary company name is required'],
    trim: true
  },
  
  // Connection Status
  status: {
    type: String,
    enum: ['invited', 'pending', 'linked', 'unlinked', 'suspended'],
    default: 'invited'
  },
  
  // Invitation System
  invitationToken: {
    type: String,
    unique: true,
    sparse: true // Only require uniqueness for non-null values
  },
  invitationSentAt: {
    type: Date,
    default: Date.now
  },
  invitationExpiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  invitationAcceptedAt: {
    type: Date,
    default: null
  },
  
  // Linked User (when they accept invitation)
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // System Integration
  linkedSystem: {
    type: String,
    enum: ['xero', 'quickbooks', 'csv', 'manual', null],
    default: null
  },
  systemConnectionId: {
    type: String,
    default: null
  },
  systemTenantId: {
    type: String,
    default: null
  },
  
  // Matching Settings
  matchingEnabled: {
    type: Boolean,
    default: true
  },
  autoMatchingEnabled: {
    type: Boolean,
    default: false
  },
  matchingTolerances: {
    amountTolerance: {
      type: Number,
      default: 0.01, // $0.01 tolerance
      min: 0
    },
    dateTolerance: {
      type: Number,
      default: 0, // 0 days tolerance
      min: 0
    }
  },
  
  // Statistics and Metrics
  statistics: {
    totalTransactions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalMatches: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    matchRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastMatchedAt: {
      type: Date,
      default: null
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Contact Information
  contactInfo: {
    phone: {
      type: String,
      trim: true,
      maxlength: [50, 'Phone number cannot be longer than 50 characters']
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website URL cannot be longer than 200 characters']
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot be longer than 50 characters']
    }
  },
  
  // Preferences
  preferences: {
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'],
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'AUD',
      maxlength: [3, 'Currency code must be 3 characters']
    },
    timezone: {
      type: String,
      default: 'Australia/Sydney'
    },
    notifications: {
      emailMatches: {
        type: Boolean,
        default: true
      },
      emailSummaries: {
        type: Boolean,
        default: true
      },
      emailDiscrepancies: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Security and Compliance
  permissions: {
    canViewMatches: {
      type: Boolean,
      default: true
    },
    canRunMatches: {
      type: Boolean,
      default: false // Only primary user can run matches by default
    },
    canExportData: {
      type: Boolean,
      default: true
    },
    canViewReports: {
      type: Boolean,
      default: true
    }
  },
  
  // Administrative
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be longer than 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be longer than 50 characters']
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Soft Delete
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
counterpartySchema.index({ primaryUserId: 1, status: 1 });
counterpartySchema.index({ email: 1 });
counterpartySchema.index({ linkedUserId: 1 }, { sparse: true });
counterpartySchema.index({ invitationToken: 1 }, { sparse: true });
counterpartySchema.index({ createdAt: -1 });
counterpartySchema.index({ 'statistics.lastActivityAt': -1 });

// Compound indexes
counterpartySchema.index({ primaryUserId: 1, type: 1, status: 1 });
counterpartySchema.index({ primaryUserId: 1, isActive: 1 });

// Virtual fields
counterpartySchema.virtual('isLinked').get(function() {
  return this.status === 'linked' && this.linkedUserId != null;
});

counterpartySchema.virtual('isExpired').get(function() {
  if (this.status !== 'invited') return false;
  return new Date() > this.invitationExpiresAt;
});

counterpartySchema.virtual('daysUntilExpiry').get(function() {
  if (this.status !== 'invited') return null;
  const now = new Date();
  const expiry = this.invitationExpiresAt;
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
counterpartySchema.methods.updateActivity = function() {
  this.statistics.lastActivityAt = new Date();
  return this.save();
};

counterpartySchema.methods.updateMatchingStats = function(totalTransactions, matches, totalAmount) {
  this.statistics.totalTransactions += totalTransactions;
  this.statistics.totalMatches += matches;
  this.statistics.totalAmount += totalAmount;
  this.statistics.matchRate = this.statistics.totalTransactions > 0 
    ? (this.statistics.totalMatches / this.statistics.totalTransactions) * 100 
    : 0;
  this.statistics.lastMatchedAt = new Date();
  this.statistics.lastActivityAt = new Date();
  return this.save();
};

counterpartySchema.methods.generateInvitationToken = function() {
  const crypto = require('crypto');
  this.invitationToken = crypto.randomBytes(32).toString('hex');
  this.invitationSentAt = new Date();
  this.invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return this.invitationToken;
};

counterpartySchema.methods.acceptInvitation = function(userId) {
  this.status = 'linked';
  this.linkedUserId = userId;
  this.invitationAcceptedAt = new Date();
  this.invitationToken = undefined; // Clear the token
  this.lastModifiedBy = userId;
  return this.save();
};

counterpartySchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  delete obj.invitationToken;
  delete obj.systemConnectionId;
  delete obj.systemTenantId;
  return obj;
};

// Static methods
counterpartySchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { primaryUserId: userId },
      { linkedUserId: userId }
    ],
    isActive: true
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query).sort({ 'statistics.lastActivityAt': -1 });
};

counterpartySchema.statics.findByInvitationToken = function(token) {
  return this.findOne({
    invitationToken: token,
    status: 'invited',
    invitationExpiresAt: { $gt: new Date() },
    isActive: true
  });
};

counterpartySchema.statics.getStatsByUser = function(userId) {
  return this.aggregate([
    {
      $match: {
        primaryUserId: new mongoose.Types.ObjectId(userId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTransactions: { $sum: '$statistics.totalTransactions' },
        totalMatches: { $sum: '$statistics.totalMatches' },
        totalAmount: { $sum: '$statistics.totalAmount' }
      }
    }
  ]);
};

// Pre-save middleware
counterpartySchema.pre('save', function(next) {
  // Update lastModifiedBy if not set
  if (this.isModified() && !this.lastModifiedBy) {
    // This will be set by the route handler
  }
  
  // Validate business logic
  if (this.type === 'customer' && this.status === 'linked' && !this.linkedUserId) {
    return next(new Error('Linked customers must have a linkedUserId'));
  }
  
  next();
});

// Pre-find middleware to exclude deleted records by default
counterpartySchema.pre(/^find/, function() {
  if (!this.getQuery().includeDeleted) {
    this.where({ isActive: true });
  }
});

module.exports = mongoose.model('Counterparty', counterpartySchema);