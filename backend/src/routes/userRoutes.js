import express from 'express';
import { 
  getUsers, 
  getCompanyUsers, 
  getUserById,
  updateUserProfile,
  updateUser,
  deleteUser 
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.use(protect);

router.route('/')
  .get(admin, getUsers); // Admin only: Get all users

router.get('/company', getCompanyUsers); // Get users from the same company

router.route('/profile')
  .put(updateUserProfile); // Update own profile

router.route('/:id')
  .get(getUserById)
  .put(admin, updateUser) // Admin only: Update any user
  .delete(admin, deleteUser); // Admin only: Delete user

export default router;
