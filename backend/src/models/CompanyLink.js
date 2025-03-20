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
CompanyLinkSchema.index(
  { requestingCompany: 1, targetCompany: 1 },
  { unique: true }
);

const CompanyLink = mongoose.model('CompanyLink', CompanyLinkSchema);

export default CompanyLink;
