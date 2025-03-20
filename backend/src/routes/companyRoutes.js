import express from 'express';
import { 
  getCompanyProfile, 
  updateCompanyProfile, 
  searchCompanies,
  getCompanyById 
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Company profile routes
router.route('/profile')
  .get(getCompanyProfile)
  .put(authorize('admin'), updateCompanyProfile);

// Search for companies
router.get('/search', searchCompanies);

// Get company by ID
router.get('/:id', getCompanyById);

export default router;
