import { Router } from 'express';
import { integrationController } from '../controllers/integrationController';
import { validate, commonSchemas, erpSchemas } from '../middleware/validation';
import { authenticate, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ERP Connections
router.get(
  '/erp-connections',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(integrationController.getERPConnections)
);

router.post(
  '/erp-connections',
  requirePermission('MANAGE_INTEGRATIONS'),
  validate(erpSchemas.createConnection),
  asyncHandler(integrationController.createERPConnection)
);

router.get(
  '/erp-connections/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.getERPConnection)
);

router.put(
  '/erp-connections/:id',
  requirePermission('MANAGE_INTEGRATIONS'),
  validate({
    params: commonSchemas.id,
    body: erpSchemas.updateConnection.body,
  }),
  asyncHandler(integrationController.updateERPConnection)
);

router.delete(
  '/erp-connections/:id',
  requirePermission('MANAGE_INTEGRATIONS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.deleteERPConnection)
);

// ERP Connection Actions
router.post(
  '/erp-connections/:id/sync',
  requirePermission('MANAGE_INTEGRATIONS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.syncERPConnection)
);

router.post(
  '/erp-connections/:id/test',
  requirePermission('MANAGE_INTEGRATIONS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.testERPConnection)
);

router.get(
  '/erp-connections/:id/sync-logs',
  validate({
    params: commonSchemas.id,
    query: commonSchemas.pagination,
  }),
  asyncHandler(integrationController.getERPSyncLogs)
);

// OAuth flows for different ERP systems
router.get(
  '/xero/auth',
  requirePermission('MANAGE_INTEGRATIONS'),
  asyncHandler(integrationController.initiateXeroAuth)
);

router.get(
  '/xero/callback',
  asyncHandler(integrationController.handleXeroCallback)
);

router.get(
  '/quickbooks/auth',
  requirePermission('MANAGE_INTEGRATIONS'),
  asyncHandler(integrationController.initiateQuickBooksAuth)
);

router.get(
  '/quickbooks/callback',
  asyncHandler(integrationController.handleQuickBooksCallback)
);

router.get(
  '/sage/auth',
  requirePermission('MANAGE_INTEGRATIONS'),
  asyncHandler(integrationController.initiateSageAuth)
);

router.get(
  '/sage/callback',
  asyncHandler(integrationController.handleSageCallback)
);

router.get(
  '/netsuite/auth',
  requirePermission('MANAGE_INTEGRATIONS'),
  asyncHandler(integrationController.initiateNetSuiteAuth)
);

router.get(
  '/netsuite/callback',
  asyncHandler(integrationController.handleNetSuiteCallback)
);

// Counterparty Links
router.get(
  '/counterparty-links',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(integrationController.getCounterpartyLinks)
);

router.post(
  '/counterparty-links',
  requirePermission('MANAGE_COUNTERPARTIES'),
  asyncHandler(integrationController.createCounterpartyLink)
);

router.get(
  '/counterparty-links/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.getCounterpartyLink)
);

router.put(
  '/counterparty-links/:id',
  requirePermission('MANAGE_COUNTERPARTIES'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.updateCounterpartyLink)
);

router.delete(
  '/counterparty-links/:id',
  requirePermission('MANAGE_COUNTERPARTIES'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.deleteCounterpartyLink)
);

// Counterparty invite flow
router.post(
  '/counterparty-links/:id/invite',
  requirePermission('MANAGE_COUNTERPARTIES'),
  validate({ params: commonSchemas.id }),
  asyncHandler(integrationController.sendCounterpartyInvite)
);

router.get(
  '/counterparty-links/accept/:token',
  asyncHandler(integrationController.acceptCounterpartyInvite)
);

router.post(
  '/counterparty-links/accept/:token',
  asyncHandler(integrationController.completeCounterpartyLink)
);

// Integration health and status
router.get(
  '/health',
  asyncHandler(integrationController.getIntegrationHealth)
);

router.get(
  '/supported-systems',
  asyncHandler(integrationController.getSupportedSystems)
);

export { router as integrationRoutes };