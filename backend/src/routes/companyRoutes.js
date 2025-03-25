import express from 'express';
import { 
  createCompany, 
  getCompanies, 
  getCompany,
  updateCompany,
  deleteCompany 
} from '../controllers/companyController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', createCompany); // Create new company - public for registration flow

// Protected routes
router.get('/', protect, getCompanies); // Get companies (admin: all, user: own company)

router.route('/:id')
  .get(protect, getCompany) // Get company by ID (with access control)
  .put(protect, updateCompany) // Update company (with access control)
  .delete(protect, admin, deleteCompany); // Admin only: Delete company

export default router;