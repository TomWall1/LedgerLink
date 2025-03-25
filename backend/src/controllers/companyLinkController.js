import CompanyLink from '../models/CompanyLink.js';
import Company from '../models/Company.js';

// @desc    Create a new company link request
// @route   POST /api/links
// @access  Private
export const createCompanyLink = async (req, res) => {
  try {
    const { targetCompanyId, linkNotes } = req.body;

    // Get source company from authenticated user
    const sourceCompanyId = req.user.company;

    // Check if companies exist
    const sourceCompany = await Company.findById(sourceCompanyId);
    const targetCompany = await Company.findById(targetCompanyId);

    if (!sourceCompany || !targetCompany) {
      return res.status(404).json({
        success: false,
        error: 'One or both companies not found'
      });
    }

    // Check if link already exists or is pending
    const existingLink = await CompanyLink.findOne({
      $or: [
        { sourceCompany: sourceCompanyId, targetCompany: targetCompanyId },
        { sourceCompany: targetCompanyId, targetCompany: sourceCompanyId }
      ]
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'A link or link request already exists between these companies',
        data: existingLink
      });
    }

    // Create new link request
    const companyLink = await CompanyLink.create({
      sourceCompany: sourceCompanyId,
      targetCompany: targetCompanyId,
      status: 'pending',
      linkNotes,
      requestedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: companyLink
    });
  } catch (error) {
    console.error('Error creating company link:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all company links relevant to user's company
// @route   GET /api/links
// @access  Private
export const getCompanyLinks = async (req, res) => {
  try {
    const userCompanyId = req.user.company;

    // Find all links where user's company is involved
    const companyLinks = await CompanyLink.find({
      $or: [
        { sourceCompany: userCompanyId },
        { targetCompany: userCompanyId }
      ]
    })
    .populate('sourceCompany', 'name')
    .populate('targetCompany', 'name')
    .populate('requestedBy', 'name email');

    res.json({
      success: true,
      count: companyLinks.length,
      data: companyLinks
    });
  } catch (error) {
    console.error('Error getting company links:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get a single company link
// @route   GET /api/links/:id
// @access  Private
export const getCompanyLink = async (req, res) => {
  try {
    const companyLink = await CompanyLink.findById(req.params.id)
      .populate('sourceCompany', 'name')
      .populate('targetCompany', 'name')
      .populate('requestedBy', 'name email');

    if (!companyLink) {
      return res.status(404).json({
        success: false,
        error: 'Company link not found'
      });
    }

    // Check if user has access to this link
    const userCompanyId = req.user.company.toString();
    const sourceCompanyId = companyLink.sourceCompany._id.toString();
    const targetCompanyId = companyLink.targetCompany._id.toString();

    if (userCompanyId !== sourceCompanyId && userCompanyId !== targetCompanyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this company link'
      });
    }

    res.json({
      success: true,
      data: companyLink
    });
  } catch (error) {
    console.error('Error getting company link:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update company link status (accept/reject/cancel)
// @route   PUT /api/links/:id
// @access  Private
export const updateCompanyLink = async (req, res) => {
  try {
    const { status, responseNotes } = req.body;

    // Find the link
    let companyLink = await CompanyLink.findById(req.params.id);

    if (!companyLink) {
      return res.status(404).json({
        success: false,
        error: 'Company link not found'
      });
    }

    // Check authorization - target company can update status to accept/reject
    // source company can update to cancel
    const userCompanyId = req.user.company.toString();
    const sourceCompanyId = companyLink.sourceCompany.toString();
    const targetCompanyId = companyLink.targetCompany.toString();

    if (status === 'accepted' || status === 'rejected') {
      // Only target company can accept/reject
      if (userCompanyId !== targetCompanyId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to accept/reject this link'
        });
      }
    } else if (status === 'cancelled') {
      // Only source company can cancel
      if (userCompanyId !== sourceCompanyId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to cancel this link'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be accepted, rejected, or cancelled'
      });
    }

    // Update link status
    companyLink = await CompanyLink.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        responseNotes: responseNotes || companyLink.responseNotes,
        respondedBy: req.user._id,
        respondedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
    .populate('sourceCompany', 'name')
    .populate('targetCompany', 'name')
    .populate('requestedBy', 'name email')
    .populate('respondedBy', 'name email');

    res.json({
      success: true,
      data: companyLink
    });
  } catch (error) {
    console.error('Error updating company link:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete a company link
// @route   DELETE /api/links/:id
// @access  Private (Admin only)
export const deleteCompanyLink = async (req, res) => {
  try {
    const companyLink = await CompanyLink.findById(req.params.id);

    if (!companyLink) {
      return res.status(404).json({
        success: false,
        error: 'Company link not found'
      });
    }

    // Only admin can delete links
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete company links'
      });
    }

    await companyLink.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting company link:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
