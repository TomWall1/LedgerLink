/**
 * ContactEmailOverride Model
 * Stores custom email addresses for ERP contacts that don't have emails in their source system
 * This allows users to manually add email addresses for sending invitations
 */

import mongoose from 'mongoose';

const contactEmailOverrideSchema = new mongoose.Schema({
  // User who created this override
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Company ID for multi-tenancy
  companyId: {
    type: String,
    required: true,
    index: true
  },
  
  // ERP connection identifier (e.g., Xero tenant ID)
  erpConnectionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Contact ID from the ERP system (e.g., Xero Contact ID)
  erpContactId: {
    type: String,
    required: true,
    index: true
  },
  
  // ERP system type (e.g., 'Xero', 'QuickBooks', 'Sage')
  erpType: {
    type: String,
    required: true,
    default: 'Xero'
  },
  
  // Contact name (for reference)
  contactName: {
    type: String,
    required: true
  },
  
  // Custom email address provided by the user
  customEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  
  // Whether this override is active
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one email override per contact per user
contactEmailOverrideSchema.index(
  { userId: 1, companyId: 1, erpConnectionId: 1, erpContactId: 1 },
  { unique: true }
);

// Index for quick lookups by ERP contact
contactEmailOverrideSchema.index(
  { erpConnectionId: 1, erpContactId: 1 }
);

const ContactEmailOverride = mongoose.model('ContactEmailOverride', contactEmailOverrideSchema);

export default ContactEmailOverride;
