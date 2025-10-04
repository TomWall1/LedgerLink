import jwt from 'jsonwebtoken';
import User from '../models/User.js';
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

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name: name || companyName, // Use companyName as fallback for name
      email,
      password,
      company: companyName
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          companyName: user.company,
          companyId: user._id.toString(),
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
      error: error.message
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
    const user = await User.findOne({ email }).select('+password');

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
        companyName: user.company,
        companyId: user._id.toString(),
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
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          companyName: user.company,
          companyId: user._id.toString(),
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
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.company = req.body.companyName || user.company;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          companyName: updatedUser.company,
          companyId: updatedUser._id.toString(),
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
    });

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
        companyName: user.company,
        companyId: user._id.toString(),
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
