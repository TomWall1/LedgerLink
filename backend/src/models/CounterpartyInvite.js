import mongoose from 'mongoose';

const CounterpartyInviteSchema = new mongoose.Schema({
  // The company sending the invitation
  senderCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  
  // The user who initiated the invite
  senderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // ERP connection used for this invite
  erpConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ERPConnection',
    required: true,
  },
  
  // ERP system type (xero, quickbooks, etc.)
  erpType: {
    type: String,
    required: true,
    enum: ['xero', 'quickbooks', 'sage', 'netsuite', 'sap', 'dynamics'],
  },
  
  // The specific customer/vendor ID from the ERP
  erpContactId: {
    type: String,
    required: true,
  },
  
  // Customer/vendor details from ERP
  erpContactDetails: {
    name: { type: String, required: true },
    email: String,
    type: { type: String, enum: ['customer', 'vendor', 'both'], required: true },
    contactNumber: String,
    // Store additional ERP-specific metadata
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  
  // Recipient information
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  
  recipientCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null, // Will be set when recipient accepts
  },
  
  // Invitation details
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'cancelled'],
    default: 'pending',
  },
  
  relationshipType: {
    type: String,
    enum: ['customer', 'vendor', 'both'],
    required: true,
  },
  
  // Personal message from sender
  message: {
    type: String,
    maxlength: 500,
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now,
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      // Expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
  },
  
  respondedAt: {
    type: Date,
    default: null,
  },
  
  // Track email notifications
  remindersSent: {
    type: Number,
    default: 0,
  },
  
  lastReminderAt: {
    type: Date,
    default: null,
  },
});

// Indexes for efficient queries
CounterpartyInviteSchema.index({ senderCompany: 1, status: 1 });
CounterpartyInviteSchema.index({ recipientEmail: 1, status: 1 });
CounterpartyInviteSchema.index({ erpConnection: 1, erpContactId: 1 });
CounterpartyInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate unique invite code
CounterpartyInviteSchema.pre('save', async function(next) {
  if (!this.inviteCode) {
    // Generate a unique 8-character code
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };
    
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = generateCode();
      const existing = await mongoose.model('CounterpartyInvite').findOne({ inviteCode: code });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.inviteCode = code;
  }
  next();
});

// Check if invite is still valid
CounterpartyInviteSchema.methods.isValid = function() {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// =============================================================================
// UPDATED: Accept invitation with recipient's ERP contact linkage
// =============================================================================
CounterpartyInviteSchema.methods.accept = async function(acceptanceData) {
  // acceptanceData should contain:
  // {
  //   recipientCompanyId: ObjectId,
  //   recipientErpConnectionId: ObjectId,  // NEW: Required
  //   recipientErpContactId: String,       // NEW: Required
  //   recipientErpContactDetails: Object   // NEW: Optional but recommended
  // }
  
  if (!this.isValid()) {
    throw new Error('Invitation is no longer valid');
  }
  
  const { 
    recipientCompanyId, 
    recipientErpConnectionId, 
    recipientErpContactId,
    recipientErpContactDetails 
  } = acceptanceData;
  
  // Validate required fields
  if (!recipientCompanyId) {
    throw new Error('Recipient company ID is required');
  }
  
  if (!recipientErpConnectionId || !recipientErpContactId) {
    throw new Error('Recipient must select which contact in their ERP represents the sender');
  }
  
  this.status = 'accepted';
  this.recipientCompany = recipientCompanyId;
  this.respondedAt = new Date();
  
  // Create the company link after accepting - NOW WITH BOTH SIDES' ERP INFO
  const CompanyLink = mongoose.model('CompanyLink');
  
  // Check if link already exists
  const existingLink = await CompanyLink.findOne({
    $or: [
      { 
        requestingCompany: this.senderCompany, 
        targetCompany: recipientCompanyId,
        erpConnection: this.erpConnection,
        erpContactId: this.erpContactId
      },
      { 
        requestingCompany: recipientCompanyId, 
        targetCompany: this.senderCompany,
        targetErpConnection: recipientErpConnectionId,
        targetErpContactId: recipientErpContactId
      }
    ]
  });
  
  if (existingLink) {
    // Update existing link with recipient's ERP info if not already set
    if (!existingLink.targetErpConnection || !existingLink.targetErpContactId) {
      existingLink.targetErpConnection = recipientErpConnectionId;
      existingLink.targetErpContactId = recipientErpContactId;
      if (recipientErpContactDetails) {
        existingLink.targetErpContactDetails = recipientErpContactDetails;
      }
      await existingLink.save();
    }
  } else {
    // Create new link with BOTH sides' ERP information
    await CompanyLink.create({
      requestingCompany: this.senderCompany,
      targetCompany: recipientCompanyId,
      status: 'approved',
      relationshipType: this.relationshipType,
      
      // Sender's (requesting company) ERP info
      erpConnection: this.erpConnection,
      erpContactId: this.erpContactId,
      erpContactDetails: this.erpContactDetails,
      
      // Recipient's (target company) ERP info - NEW!
      targetErpConnection: recipientErpConnectionId,
      targetErpContactId: recipientErpContactId,
      targetErpContactDetails: recipientErpContactDetails || {},
      
      approvedAt: new Date(),
      fromInvite: this._id,
    });
  }
  
  await this.save();
  return this;
};

// Reject the invitation
CounterpartyInviteSchema.methods.reject = async function() {
  if (!this.isValid()) {
    throw new Error('Invitation is no longer valid');
  }
  
  this.status = 'rejected';
  this.respondedAt = new Date();
  await this.save();
  return this;
};

// Cancel the invitation (by sender)
CounterpartyInviteSchema.methods.cancel = async function() {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending invitations');
  }
  
  this.status = 'cancelled';
  await this.save();
  return this;
};

const CounterpartyInvite = mongoose.model('CounterpartyInvite', CounterpartyInviteSchema);

export default CounterpartyInvite;
