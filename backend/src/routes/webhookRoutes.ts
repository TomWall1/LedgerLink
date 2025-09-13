import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import { authenticateApiKey } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { createActionLimiter } from '../middleware/rateLimiter';

const router = Router();

// Webhook rate limiter
const webhookLimiter = createActionLimiter({
  points: 100, // 100 requests
  duration: 60, // per minute
  keyPrefix: 'webhook',
});

// ERP system webhooks (public endpoints with API key auth)
router.post(
  '/xero',
  webhookLimiter,
  asyncHandler(webhookController.handleXeroWebhook)
);

router.post(
  '/quickbooks',
  webhookLimiter,
  asyncHandler(webhookController.handleQuickBooksWebhook)
);

router.post(
  '/sage',
  webhookLimiter,
  asyncHandler(webhookController.handleSageWebhook)
);

router.post(
  '/netsuite',
  webhookLimiter,
  asyncHandler(webhookController.handleNetSuiteWebhook)
);

// Stripe webhooks
router.post(
  '/stripe',
  webhookLimiter,
  asyncHandler(webhookController.handleStripeWebhook)
);

// Internal webhooks (require API key)
router.use(authenticateApiKey);

router.post(
  '/matching-completed',
  webhookLimiter,
  asyncHandler(webhookController.handleMatchingCompleted)
);

router.post(
  '/sync-completed',
  webhookLimiter,
  asyncHandler(webhookController.handleSyncCompleted)
);

router.post(
  '/report-generated',
  webhookLimiter,
  asyncHandler(webhookController.handleReportGenerated)
);

// Webhook management endpoints
router.get(
  '/subscriptions',
  asyncHandler(webhookController.getWebhookSubscriptions)
);

router.post(
  '/subscriptions',
  asyncHandler(webhookController.createWebhookSubscription)
);

router.put(
  '/subscriptions/:id',
  asyncHandler(webhookController.updateWebhookSubscription)
);

router.delete(
  '/subscriptions/:id',
  asyncHandler(webhookController.deleteWebhookSubscription)
);

// Webhook testing
router.post(
  '/test/:id',
  asyncHandler(webhookController.testWebhook)
);

export { router as webhookRoutes };