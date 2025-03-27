import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Company link model schema
const CompanyLinkSchema = new mongoose.Schema({
  sourceCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  targetCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  linkType: {
    type: String,
    enum: ['customer', 'supplier', 'subsidiary', 'parent', 'affiliate'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create model if it doesn't exist
const CompanyLink = mongoose.models.CompanyLink || mongoose.model('CompanyLink', CompanyLinkSchema);

// Get all company links
router.get('/', async (req, res) => {
  try {
    const links = await CompanyLink.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Error fetching company links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company links'
    });
  }
});

// Create a new company link
router.post('/', async (req, res) => {
  try {
    const { sourceCompanyId, targetCompanyId, linkType, status } = req.body;
    
    // Validate required fields
    if (!sourceCompanyId || !targetCompanyId || !linkType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Check if link already exists
    const existingLink = await CompanyLink.findOne({
      sourceCompanyId,
      targetCompanyId,
      linkType
    });
    
    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'A link between these companies already exists'
      });
    }
    
    // Create new link
    const newLink = new CompanyLink({
      sourceCompanyId,
      targetCompanyId,
      linkType,
      status: status || 'active'
    });
    
    await newLink.save();
    
    res.status(201).json({
      success: true,
      link: newLink
    });
  } catch (error) {
    console.error('Error creating company link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create company link'
    });
  }
});

// Delete a company link
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid link ID'
      });
    }
    
    const deletedLink = await CompanyLink.findByIdAndDelete(id);
    
    if (!deletedLink) {
      return res.status(404).json({
        success: false,
        error: 'Company link not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Company link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete company link'
    });
  }
});

export default router;