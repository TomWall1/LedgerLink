import Company from '../models/Company.js';
import CompanyLink from '../models/CompanyLink.js';

// @desc    Get company profile
// @route   GET /api/companies/profile
// @access  Private
export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching company profile',
    });
  }
};

// @desc    Update company profile
// @route   PUT /api/companies/profile
// @access  Private (Admin only)
export const updateCompanyProfile = async (req, res) => {
  try {
    const { name, address } = req.body;

    const company = await Company.findById(req.user.company);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Update fields
    company.name = name || company.name;
    if (address) {
      company.address = {
        ...company.address,
        ...address,
      };
    }

    const updatedCompany = await company.save();

    res.status(200).json({
      success: true,
      data: updatedCompany,
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating company profile',
    });
  }
};

// @desc    Search for companies by name or tax ID
// @route   GET /api/companies/search
// @access  Private
export const searchCompanies = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 3 characters',
      });
    }

    // Search by name or tax ID, excluding the current company
    const companies = await Company.find({
      $and: [
        { _id: { $ne: req.user.company } }, // Exclude current company
        {
          $or: [
            { name: { $regex: query, $options: 'i' } }, // Case-insensitive name search
            { taxId: { $regex: query, $options: 'i' } }, // Case-insensitive tax ID search
          ],
        },
      ],
    }).select('name taxId address');

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching companies',
    });
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).select('name taxId address');

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Check if there's an existing link
    const link = await CompanyLink.findOne({
      $or: [
        { requestingCompany: req.user.company, targetCompany: company._id },
        { requestingCompany: company._id, targetCompany: req.user.company },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        link: link ? link.toObject() : null,
      },
    });
  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching company',
    });
  }
};
