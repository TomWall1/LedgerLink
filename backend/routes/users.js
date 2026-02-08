import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (alias for /me route - returns data wrapped in 'user' for frontend compatibility)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return wrapped in 'user' property to match frontend expectations
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        timezone: user.timezone || 'America/New_York',
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, timezone } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = phone.trim();
    }
    if (timezone !== undefined) {
      user.timezone = timezone;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        timezone: user.timezone || 'America/New_York',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return settings with defaults for users who don't have them yet
    const defaults = {
      matchingRules: {
        dateToleranceDays: 7,
        amountTolerancePercent: 2,
        requireExactMatch: false,
        autoProcessMatches: true,
        confidenceThreshold: 85,
        enableFuzzyMatching: true
      },
      notifications: {
        emailMatches: true,
        emailDiscrepancies: true,
        emailSystemUpdates: true,
        emailReports: false,
        pushEnabled: false,
        weeklyDigest: true
      }
    };

    res.json({
      settings: {
        matchingRules: { ...defaults.matchingRules, ...(user.settings?.matchingRules?.toObject?.() || user.settings?.matchingRules || {}) },
        notifications: { ...defaults.notifications, ...(user.settings?.notifications?.toObject?.() || user.settings?.notifications || {}) }
      }
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { matchingRules, notifications } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = { matchingRules: {}, notifications: {} };
    }

    // Merge matching rules
    if (matchingRules) {
      if (matchingRules.dateToleranceDays !== undefined) {
        const val = Number(matchingRules.dateToleranceDays);
        if (val < 0 || val > 30) return res.status(400).json({ error: 'dateToleranceDays must be 0-30' });
        user.settings.matchingRules.dateToleranceDays = val;
      }
      if (matchingRules.amountTolerancePercent !== undefined) {
        const val = Number(matchingRules.amountTolerancePercent);
        if (val < 0 || val > 10) return res.status(400).json({ error: 'amountTolerancePercent must be 0-10' });
        user.settings.matchingRules.amountTolerancePercent = val;
      }
      if (matchingRules.confidenceThreshold !== undefined) {
        const val = Number(matchingRules.confidenceThreshold);
        if (val < 50 || val > 100) return res.status(400).json({ error: 'confidenceThreshold must be 50-100' });
        user.settings.matchingRules.confidenceThreshold = val;
      }
      if (matchingRules.requireExactMatch !== undefined) {
        user.settings.matchingRules.requireExactMatch = Boolean(matchingRules.requireExactMatch);
      }
      if (matchingRules.autoProcessMatches !== undefined) {
        user.settings.matchingRules.autoProcessMatches = Boolean(matchingRules.autoProcessMatches);
      }
      if (matchingRules.enableFuzzyMatching !== undefined) {
        user.settings.matchingRules.enableFuzzyMatching = Boolean(matchingRules.enableFuzzyMatching);
      }
    }

    // Merge notifications
    if (notifications) {
      const boolFields = ['emailMatches', 'emailDiscrepancies', 'emailSystemUpdates', 'emailReports', 'pushEnabled', 'weeklyDigest'];
      for (const field of boolFields) {
        if (notifications[field] !== undefined) {
          user.settings.notifications[field] = Boolean(notifications[field]);
        }
      }
    }

    await user.save();

    res.json({
      message: 'Settings updated successfully',
      settings: {
        matchingRules: user.settings.matchingRules,
        notifications: user.settings.notifications
      }
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedNewPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;
    
    // Validate input
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
