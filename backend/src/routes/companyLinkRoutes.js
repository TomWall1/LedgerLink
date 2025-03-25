import express from 'express';
import { 
  createCompanyLink,
  getCompanyLinks,
  getCompanyLink,
  updateCompanyLink,
  deleteCompanyLink 
} from '../controllers/companyLinkController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(createCompanyLink) // Create a new company link request
  .get(getCompanyLinks); // Get all links for user's company

router.route('/:id')
  .get(getCompanyLink) // Get link by ID (with access control)
  .put(updateCompanyLink) // Update link status (with access control)
  .delete(admin, deleteCompanyLink); // Admin only: Delete link

export default router;
