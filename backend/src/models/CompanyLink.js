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
  
  // ERP-specific fields for counterparty linking
  erpConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ERPConnection',
    default: null,
  },
  
  // The specific customer/vendor ID from the ERP
  erpContactId: {
    type: String,
    default: null,
  },
  
  // Store the ERP contact details for reference
  erpContactDetails: {
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
// Now includes ERP connection and contact ID for granular linking
CompanyLinkSchema.index(
  { 
    requestingCompany: 1, 
    targetCompany: 1,
    erpConnection: 1,
    erpContactId: 1
  },
  { unique: true }
);

// Index for efficient queries
CompanyLinkSchema.index({ requestingCompany: 1, status: 1 });
CompanyLinkSchema.index({ targetCompany: 1, status: 1 });
CompanyLinkSchema.index({ erpConnection: 1 });

// Virtual to determine if this is an ERP-specific link
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
