/**
 * Xero Connection Model
 * Stores Xero OAuth tokens and connection details for each user/company
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

const xeroConnectionSchema = new mongoose.Schema({
  // User/Company association
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Xero tenant/organization details
  tenantId: {
    type: String,
    required: true,
    unique: true
  },
  
  tenantName: {
    type: String,
    required: true
  },
  
  tenantType: {
    type: String,
    enum: ['ORGANISATION', 'PRACTICE'],
    default: 'ORGANISATION'
  },
  
  // OAuth tokens (encrypted)
  accessToken: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },
  
  refreshToken: {
    type: String,
    required: true,
    select: false
  },
  
  idToken: {
    type: String,
    select: false
  },
  
  // Token metadata
  tokenType: {
    type: String,
    default: 'Bearer'
  },
  
  expiresAt: {
    type: Date,
    required: true
  },
  
  // Connection status
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'error'],
    default: 'active'
  },
  
  // Last sync information
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  
  lastSyncStatus: {
    type: String,
    enum: ['success', 'error', 'partial'],
    default: 'success'
  },
  
  // FIXED: syncErrors as array of subdocuments with proper schema
  syncErrors: [{
    type: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Xero organization settings
  settings: {
    baseCurrency: String,
    countryCode: String,
    timezone: String,
    shortCode: String,
    organisationType: String
  },
  
  // Data counts for dashboard
  dataCounts: {
    invoices: {
      type: Number,
      default: 0
    },
    contacts: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.accessToken;
      delete ret.refreshToken;
      delete ret.idToken;
      return ret;
    }
  }
});

// Indexes
xeroConnectionSchema.index({ userId: 1, companyId: 1 });
xeroConnectionSchema.index({ tenantId: 1 }, { unique: true });
xeroConnectionSchema.index({ expiresAt: 1 });
xeroConnectionSchema.index({ status: 1 });

// Encryption setup
const ALGORITHM = 'aes-256-cbc';

// Ensure encryption key is properly formatted (32 bytes for aes-256)
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    console.warn('WARNING: No ENCRYPTION_KEY set in environment variables. Using temporary key.');
    return crypto.randomBytes(32);
  }
  
  // If the key is a hex string, convert it to buffer
  if (envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  
  // Otherwise, hash the key to get consistent 32 bytes
  return crypto.createHash('sha256').update(envKey).digest();
}

const ENCRYPTION_KEY = getEncryptionKey();

// Encrypt sensitive data before saving
xeroConnectionSchema.pre('save', function(next) {
  if (this.isModified('accessToken') && this.accessToken) {
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && this.refreshToken) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  if (this.isModified('idToken') && this.idToken) {
    this.idToken = encrypt(this.idToken);
  }
  next();
});

// Instance methods
xeroConnectionSchema.methods.getDecryptedTokens = function() {
  return {
    accessToken: this.accessToken ? decrypt(this.accessToken) : null,
    refreshToken: this.refreshToken ? decrypt(this.refreshToken) : null,
    idToken: this.idToken ? decrypt(this.idToken) : null
  };
};

xeroConnectionSchema.methods.isTokenExpired = function() {
  return new Date() >= this.expiresAt;
};

xeroConnectionSchema.methods.updateTokens = async function(tokens) {
  this.accessToken = tokens.access_token;
  this.refreshToken = tokens.refresh_token;
  if (tokens.id_token) this.idToken = tokens.id_token;
  
  // Calculate expiry time
  this.expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
  this.status = 'active';
  
  return await this.save();
};

xeroConnectionSchema.methods.markAsError = async function(error) {
  this.status = 'error';
  
  // FIXED: Properly format error for schema
  const errorMessage = typeof error === 'string' ? error : (error.message || String(error));
  
  this.syncErrors.push({
    type: errorMessage,
    timestamp: new Date()
  });
  
  // Keep only last 10 errors
  if (this.syncErrors.length > 10) {
    this.syncErrors = this.syncErrors.slice(-10);
  }
  
  return await this.save();
};

// Static methods
xeroConnectionSchema.statics.findActiveConnections = function() {
  return this.find({
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

xeroConnectionSchema.statics.findByUser = function(userId, companyId = null) {
  const query = { userId };
  if (companyId) query.companyId = companyId;
  return this.find(query);
};

// Utility functions for encryption/decryption using modern crypto methods
function encrypt(text) {
  if (!text) return text;
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher using the modern method
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV and encrypted data together (IV:encrypted)
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  // Split the IV and encrypted data
  const parts = encryptedData.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  // Create decipher using the modern method
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  // Decrypt the data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export default mongoose.model('XeroConnection', xeroConnectionSchema);
