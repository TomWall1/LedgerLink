import Company from '../models/Company.js';

// @desc    Create a new company
// @route   POST /api/companies
// @access  Private
export const createCompany = async (req, res) => {
  try {
    const { name, address, taxId, industry } = req.body;

    // Create company
    const company = await Company.create({
      name,
      address,
      taxId,
      industry,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
export const getCompanies = async (req, res) => {
  try {
    // If admin, get all companies, otherwise get only user's company
    let companies;
    if (req.user.role === 'admin') {
      companies = await Company.find();
    } else {
      // Assuming user.company references the company ID
      companies = await Company.find({ _id: req.user.company });
    }

    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get a single company
// @route   GET /api/companies/:id
// @access  Private
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Check if user has access to this company
    if (req.user.role !== 'admin' && company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this company'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error getting company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Private
export const updateCompany = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Check if user has access to this company
    if (req.user.role !== 'admin' && company._id.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this company'
      });
    }

    company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
// @access  Private (Admin only)
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Only admin can delete companies
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete companies'
      });
    }

    await company.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
