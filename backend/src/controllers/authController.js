import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import crypto from 'crypto';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { email, password, companyName, name } = req.body;

    console.log('Registration attempt:', { email, companyName, name });

    // Validate required fields
    if (!email || !password || !companyName) {
      return res.status(400).json({
        error: 'Please provide email, password, and company name'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    // Find or create company
    let company = await Company.findOne({ name: companyName });
    
    if (!company) {
      console.log('Creating new company:', companyName);
      company = await Company.create({
        name: companyName
      });
      console.log('Company created with ID:', company._id);
    } else {
      console.log('Found existing company:', company._id);
    }

    // Create user with company reference
    const user = await User.create({
      name: name || companyName, // Use companyName as fallback for name
      email,
      password,
      company: company._id // Use the ObjectId, not the name
    });

    console.log('User created successfully:', user._id);

    if (user) {
      // Populate company data for response
      await user.populate('company');
      
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          companyName: user.company.name,
          companyId: user.company._id.toString(),
          role: user.role
        }
      });
    } else {
      res.status(400).json({
        error: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      error: error.message || 'Registration failed'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password').populate('company');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        companyName: user.company?.name || 'Unknown',
        companyId: user.company?._id?.toString() || user._id.toString(),
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // User is already available in req.user from the auth middleware
    const user = await User.findById(req.user._id).populate('company');
    
    if (user) {
      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          companyName: user.company?.name || 'Unknown',
          companyId: user.company?._id?.toString() || user._id.toString(),
          role: user.role
        }
      });
    } else {
      res.status(404).json({
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('company');

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      // If updating company name, find or create the new company
      if (req.body.companyName && req.body.companyName !== user.company?.name) {
        let company = await Company.findOne({ name: req.body.companyName });
        
        if (!company) {
          company = await Company.create({
            name: req.body.companyName
          });
        }
        
        user.company = company._id;
      }
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      await updatedUser.populate('company');

      res.json({
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          companyName: updatedUser.company?.name || 'Unknown',
          companyId: updatedUser.company?._id?.toString() || updatedUser._id.toString(),
          role: updatedUser.role
        }
      });
    } else {
      res.status(404).json({
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

// @desc    Get current logged in user (alias for getUserProfile)
// @route   GET /api/auth/me
// @access  Private
export const getMe = getUserProfile;

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return res.status(200).json({
        message: 'If your email exists in our system, you will receive password reset instructions.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash the token and set it in the user model
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry to 10 minutes
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    console.log(`Password reset requested for ${email}. Reset URL: ${resetUrl}`);

    res.status(200).json({
      message: 'If your email exists in our system, you will receive password reset instructions.',
      // For development only - remove in production
      resetUrl,
      resetToken
    });

  } catch (error) {
    console.error('Error in forgotPassword:', error);

    // If there's an error, make sure to clear the reset token fields
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      error: 'Error processing password reset'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).populate('company');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token or token has expired'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Return token so user can be immediately logged in
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        companyName: user.company?.name || 'Unknown',
        companyId: user.company?._id?.toString() || user._id.toString(),
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      error: error.message
    });
  }
};
