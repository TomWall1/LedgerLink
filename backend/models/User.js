import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be longer than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  preferences: {
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY', 'DD.MM.YYYY'],
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'AUD'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },
  settings: {
    matchingRules: {
      dateToleranceDays: { type: Number, min: 0, max: 30, default: 7 },
      amountTolerancePercent: { type: Number, min: 0, max: 10, default: 2 },
      requireExactMatch: { type: Boolean, default: false },
      autoProcessMatches: { type: Boolean, default: true },
      confidenceThreshold: { type: Number, min: 50, max: 100, default: 85 },
      enableFuzzyMatching: { type: Boolean, default: true }
    },
    notifications: {
      emailMatches: { type: Boolean, default: true },
      emailDiscrepancies: { type: Boolean, default: true },
      emailSystemUpdates: { type: Boolean, default: true },
      emailReports: { type: Boolean, default: false },
      pushEnabled: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    timezone: this.timezone,
    companyName: this.companyName,
    lastLogin: this.lastLogin,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Don't include password in JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
