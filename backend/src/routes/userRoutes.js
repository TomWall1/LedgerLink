import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc Register new user
// @route POST /api/users/register
// @access Public
router.post('/register', registerUser);

// @desc Authenticate user & get token
// @route POST /api/users/login
// @access Public
router.post('/login', loginUser);

// @desc Get user profile
// @route GET /api/users/profile
// @access Private
router.get('/profile', protect, getUserProfile);

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
router.put('/profile', protect, updateUserProfile);

export default router;