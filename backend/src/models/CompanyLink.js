import mongoose from 'mongoose';

const CompanyLinkSchema = new mongoose.Schema({
  requestingCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  targetCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  relationshipType: {
    type: String,
    enum: ['customer', 'supplier', 'both'],
    required: true,
  },
  
  // =================================================================
  // ERP FIELDS FOR REQUESTING COMPANY (sender/inviter)
  // =================================================================
  erpConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ERPConnection',
    default: null,
  },
  
  // The specific customer/vendor ID from the requesting company's ERP
  erpContactId: {
    type: String,
    default: null,
  },
  
  // Store the ERP contact details for reference (requesting side)
  erpContactDetails: {
    name: String,
    email: String,
    type: { type: String, enum: ['customer', 'vendor', 'both'] },
    contactNumber: String,
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  
  // =================================================================
  // ERP FIELDS FOR TARGET COMPANY (recipient/invitee) - NEW!
  // =================================================================
  targetErpConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ERPConnection',
    default: null,
  },
  
  // The specific customer/vendor ID from the target company's ERP - NEW!
  targetErpContactId: {
    type: String,
    default: null,
  },
  
  // Store the target company's ERP contact details for reference - NEW!
  targetErpContactDetails: {
    name: String,
    email: String,
    type: { type: String, enum: ['customer', 'vendor', 'both'] },
    contactNumber: String,
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  
  // Track which invitation created this link
  fromInvite: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CounterpartyInvite',
    default: null,
  },
  
  // Permissions and visibility settings
  permissions: {
    viewTransactions: { type: Boolean, default: true },
    viewBalances: { type: Boolean, default: true },
    viewDocuments: { type: Boolean, default: true },
    initiateMatching: { type: Boolean, default: true },
  },
  
  // Stats tracking
  stats: {
    totalTransactions: { type: Number, default: 0 },
    matchedTransactions: { type: Number, default: 0 },
    lastMatchedAt: Date,
    matchRate: { type: Number, default: 0 },
  },
  
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
});

// Ensure companies cannot link to themselves
CompanyLinkSchema.pre('save', function (next) {
  if (this.requestingCompany.toString() === this.targetCompany.toString()) {
    next(new Error('A company cannot link to itself'));
  } else {
    this.updatedAt = new Date();
    next();
  }
});

// Create a compound index to ensure uniqueness of the company link
// Now includes BOTH sides' ERP connection and contact IDs for granular linking
CompanyLinkSchema.index(
  { 
    requestingCompany: 1, 
    targetCompany: 1,
    erpConnection: 1,
    erpContactId: 1,
    targetErpConnection: 1,
    targetErpContactId: 1
  },
  { unique: true }
);

// Index for efficient queries
CompanyLinkSchema.index({ requestingCompany: 1, status: 1 });
CompanyLinkSchema.index({ targetCompany: 1, status: 1 });
CompanyLinkSchema.index({ erpConnection: 1 });
CompanyLinkSchema.index({ targetErpConnection: 1 }); // NEW

// Virtual to determine if this is an ERP-specific link with BOTH sides connected
CompanyLinkSchema.virtual('isFullyLinked').get(function() {
  return !!this.erpConnection && !!this.erpContactId &&
         !!this.targetErpConnection && !!this.targetErpContactId;
});

// Virtual to determine if requesting side has ERP link (backward compatibility)
CompanyLinkSchema.virtual('isErpSpecific').get(function() {
  return !!this.erpConnection && !!this.erpContactId;
});

// Method to check if companies can view each other's data
CompanyLinkSchema.methods.canViewData = function(companyId) {
  const companyIdStr = companyId.toString();
  return (
    this.status === 'approved' &&
    (this.requestingCompany.toString() === companyIdStr ||
     this.targetCompany.toString() === companyIdStr)
  );
};

// Method to get the counterparty for a given company
CompanyLinkSchema.methods.getCounterparty = function(companyId) {
  const companyIdStr = companyId.toString();
  if (this.requestingCompany.toString() === companyIdStr) {
    return this.targetCompany;
  } else if (this.targetCompany.toString() === companyIdStr) {
    return this.requestingCompany;
  }
  return null;
};

// NEW: Method to get ERP contact info for a given company
CompanyLinkSchema.methods.getErpContactForCompany = function(companyId) {
  const companyIdStr = companyId.toString();
  
  if (this.requestingCompany.toString() === companyIdStr) {
    return {
      erpConnection: this.erpConnection,
      erpContactId: this.erpContactId,
      erpContactDetails: this.erpContactDetails
    };
  } else if (this.targetCompany.toString() === companyIdStr) {
    return {
      erpConnection: this.targetErpConnection,
      erpContactId: this.targetErpContactId,
      erpContactDetails: this.targetErpContactDetails
    };
  }
  return null;
};

// NEW: Method to get counterparty's ERP contact info
CompanyLinkSchema.methods.getCounterpartyErpContact = function(companyId) {
  const companyIdStr = companyId.toString();
  
  if (this.requestingCompany.toString() === companyIdStr) {
    // This is the requesting company, return target's ERP info
    return {
      erpConnection: this.targetErpConnection,
      erpContactId: this.targetErpContactId,
      erpContactDetails: this.targetErpContactDetails
    };
  } else if (this.targetCompany.toString() === companyIdStr) {
    // This is the target company, return requesting company's ERP info
    return {
      erpConnection: this.erpConnection,
      erpContactId: this.erpContactId,
      erpContactDetails: this.erpContactDetails
    };
  }
  return null;
};

// Update match statistics
CompanyLinkSchema.methods.updateMatchStats = async function(matched, total) {
  this.stats.matchedTransactions = matched;
  this.stats.totalTransactions = total;
  this.stats.matchRate = total > 0 ? (matched / total) * 100 : 0;
  this.stats.lastMatchedAt = new Date();
  await this.save();
  return this;
};

const CompanyLink = mongoose.model('CompanyLink', CompanyLinkSchema);

export default CompanyLink;
