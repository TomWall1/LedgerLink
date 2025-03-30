import express from 'express';
import { protect as requireAuth } from '../middleware/auth.js';
import {
  getUserConnections,
  createConnection,
  getConnection,
  updateConnection,
  deleteConnection,
  linkXeroTenant,
  getXeroData
} from '../controllers/erpConnectionController.js';

const router = express.Router();

// Protect all routes
router.use(requireAuth);

// Get all connections & create new connection
router.route('/')
  .get(getUserConnections)
  .post(createConnection);

// Get, update, delete specific connection
router.route('/:id')
  .get(getConnection)
  .put(updateConnection)
  .delete(deleteConnection);

// Link Xero tenant to connection
router.post('/link-xero-tenant', linkXeroTenant);

// Get data from Xero connection
router.get('/:id/xero-data', getXeroData);

export default router;