import CompanyLink from '../models/CompanyLink.js';
import Company from '../models/Company.js';

// @desc    Request a company link
// @route   POST /api/links
// @access  Private (Admin only)
export const requestCompanyLink = async (req, res) => {
  try {
    const { targetCompanyId, relationshipType } = req.body;

    // Validate inputs
    if (!targetCompanyId || !relationshipType) {
      return res.status(400).json({
        success: false,
        error: 'Please provide target company ID and relationship type',
      });
    }

    // Check if target company exists
    const targetCompany = await Company.findById(targetCompanyId);
    if (!targetCompany) {
      return res.status(404).json({
        success: false,
        error: 'Target company not found',
      });
    }

    // Check if link already exists
    const existingLink = await CompanyLink.findOne({
      $or: [
        {
          requestingCompany: req.user.company,
          targetCompany: targetCompanyId,
        },
        {
          requestingCompany: targetCompanyId,
          targetCompany: req.user.company,
        },
      ],
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'A link with this company already exists',
        data: existingLink,
      });
    }

    // Create new company link
    const companyLink = await CompanyLink.create({
      requestingCompany: req.user.company,
      targetCompany: targetCompanyId,
      relationshipType,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: companyLink,
    });
  } catch (error) {
    console.error('Request company link error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error requesting company link',
    });
  }
};

// @desc    Update company link status
// @route   PUT /api/links/:id
// @access  Private (Admin only)
export const updateLinkStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (approved or rejected)',
      });
    }

    // Find the link
    const link = await CompanyLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        error: 'Company link not found',
      });
    }

    // Ensure the user's company is the target company
    if (link.targetCompany.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this link',
      });
    }

    // Update link status
    link.status = status;
    if (status === 'approved') {
      link.approvedAt = new Date();
    }

    await link.save();

    res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error('Update link status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating link status',
    });
  }
};

// @desc    Get all company links
// @route   GET /api/links
// @access  Private
export const getCompanyLinks = async (req, res) => {
  try {
    // Find all links where the company is either requesting or target
    const links = await CompanyLink.find({
      $or: [
        { requestingCompany: req.user.company },
        { targetCompany: req.user.company },
      ],
    })
      .populate('requestingCompany', 'name taxId')
      .populate('targetCompany', 'name taxId');

    res.status(200).json({
      success: true,
      count: links.length,
      data: links,
    });
  } catch (error) {
    console.error('Get company links error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching company links',
    });
  }
};

// @desc    Get pending link requests
// @route   GET /api/links/pending
// @access  Private
export const getPendingLinkRequests = async (req, res) => {
  try {
    // Find all pending links where the company is the target
    const pendingLinks = await CompanyLink.find({
      targetCompany: req.user.company,
      status: 'pending',
    }).populate('requestingCompany', 'name taxId');

    res.status(200).json({
      success: true,
      count: pendingLinks.length,
      data: pendingLinks,
    });
  } catch (error) {
    console.error('Get pending link requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching pending link requests',
    });
  }
};

// @desc    Get approved links
// @route   GET /api/links/approved
// @access  Private
export const getApprovedLinks = async (req, res) => {
  try {
    // Find all approved links where the company is either requesting or target
    const approvedLinks = await CompanyLink.find({
      $or: [
        { requestingCompany: req.user.company },
        { targetCompany: req.user.company },
      ],
      status: 'approved',
    })
      .populate('requestingCompany', 'name taxId')
      .populate('targetCompany', 'name taxId');

    res.status(200).json({
      success: true,
      count: approvedLinks.length,
      data: approvedLinks,
    });
  } catch (error) {
    console.error('Get approved links error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching approved links',
    });
  }
};
