/**
 * CounterpartyInvitation Model
 * Stores invitation records for counterparty connections
 * Tracks invitation status, expiry, and linking information
 */

import mongoose from 'mongoose';

const counterpartyInvitationSchema = new mongoose.Schema({
  // Company that sent the invitation
  companyId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who sent the invitation
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Name of the customer/vendor in OUR system
  ourCustomerName: {
    type: String,
    required: true
  },
  
  // Name of THEIR company (initially same as ourCustomerName, they can update)
  theirCompanyName: {
    type: String,
    required: true
  },
  
  // Their ERP system type (initially 'UNKNOWN', updated when they accept)
  theirSystemType: {
    type: String,
    default: 'UNKNOWN',
    enum: ['UNKNOWN', 'Xero', 'QuickBooks', 'Sage', 'NetSuite', 'Other']
  },
  
  // Contact details
  theirContactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  theirContactName: {
    type: String,
    required: true
  },
  
  // Connection status
  connectionStatus: {
    type: String,
    required: true,
    default: 'PENDING',
    enum: ['PENDING', 'ACCEPTED', 'LINKED', 'DECLINED', 'EXPIRED']
  },
  
  // Secure invitation token
  linkToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Token expiry
  linkExpiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Custom matching rules (for future use)
  matchingRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Whether this invitation is active
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Relationship type
  relationshipType: {
    type: String,
    enum: ['customer', 'vendor', 'both'],
    default: 'customer'
  },
  
  // ERP connection details from invitation
  erpConnectionId: {
    type: String
  },
  
  erpContactId: {
    type: String
  },
  
  // Company name of the sender (stored at send time)
  senderCompanyName: {
    type: String,
    default: ''
  },

  // Custom invitation message
  invitationMessage: {
    type: String
  },
  
  // When they accepted (if applicable)
  acceptedAt: {
    type: Date
  },
  
  // When they linked their system (if applicable)
  linkedAt: {
    type: Date
  },

  // When they declined (if applicable)
  declinedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
counterpartyInvitationSchema.index({ companyId: 1, theirContactEmail: 1 });
counterpartyInvitationSchema.index({ companyId: 1, connectionStatus: 1 });
counterpartyInvitationSchema.index({ linkToken: 1, linkExpiresAt: 1 });

// Index for received invitations queries
counterpartyInvitationSchema.index({ theirContactEmail: 1, connectionStatus: 1, isActive: 1 });

// Index for finding invitations by customer name
counterpartyInvitationSchema.index({ 
  companyId: 1, 
  ourCustomerName: 1, 
  connectionStatus: 1 
});

const CounterpartyInvitation = mongoose.model('CounterpartyInvitation', counterpartyInvitationSchema);

export default CounterpartyInvitation;
