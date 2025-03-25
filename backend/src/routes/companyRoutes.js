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

// All routes are protected
router.use(protect);

router.route('/')
  .post(createCompany) // Create new company
  .get(getCompanies); // Get companies (admin: all, user: own company)

router.route('/:id')
  .get(getCompany) // Get company by ID (with access control)
  .put(updateCompany) // Update company (with access control)
  .delete(admin, deleteCompany); // Admin only: Delete company

export default router;
