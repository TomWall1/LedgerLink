import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
  },
  taxId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values, making it optional but unique when provided
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  xeroTenantId: {
    type: String,
    default: null,
  },
  xeroConnected: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
CompanySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index on name for faster lookups during registration
CompanySchema.index({ name: 1 });

const Company = mongoose.model('Company', CompanySchema);

export default Company;
