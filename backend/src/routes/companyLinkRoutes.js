import express from 'express';
import {
  requestCompanyLink,
  updateLinkStatus,
  getCompanyLinks,
  getPendingLinkRequests,
  getApprovedLinks
} from '../controllers/companyLinkController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Company link routes
router.route('/')
  .get(getCompanyLinks)
  .post(authorize('admin'), requestCompanyLink);

// Get pending link requests
router.get('/pending', getPendingLinkRequests);

// Get approved links
router.get('/approved', getApprovedLinks);

// Update link status
router.put('/:id', authorize('admin'), updateLinkStatus);

export default router;
