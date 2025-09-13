import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { validate, commonSchemas, reportSchemas } from '../middleware/validation';
import { authenticate, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Report management
router.get(
  '/',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(reportController.getReports)
);

router.post(
  '/',
  requirePermission('GENERATE_REPORTS'),
  validate(reportSchemas.generate),
  asyncHandler(reportController.generateReport)
);

router.get(
  '/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.getReport)
);

router.delete(
  '/:id',
  requirePermission('MANAGE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.deleteReport)
);

// Report downloads
router.get(
  '/:id/download',
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.downloadReport)
);

router.get(
  '/:id/preview',
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.previewReport)
);

// Report sharing
router.post(
  '/:id/share',
  requirePermission('SHARE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.shareReport)
);

router.get(
  '/shared/:token',
  asyncHandler(reportController.getSharedReport)
);

// Scheduled reports
router.get(
  '/scheduled/list',
  asyncHandler(reportController.getScheduledReports)
);

router.post(
  '/:id/schedule',
  requirePermission('MANAGE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.scheduleReport)
);

router.delete(
  '/:id/schedule',
  requirePermission('MANAGE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.unscheduleReport)
);

// Report templates
router.get(
  '/templates/list',
  asyncHandler(reportController.getReportTemplates)
);

router.post(
  '/templates',
  requirePermission('MANAGE_REPORTS'),
  asyncHandler(reportController.createReportTemplate)
);

router.put(
  '/templates/:id',
  requirePermission('MANAGE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.updateReportTemplate)
);

router.delete(
  '/templates/:id',
  requirePermission('MANAGE_REPORTS'),
  validate({ params: commonSchemas.id }),
  asyncHandler(reportController.deleteReportTemplate)
);

// Report analytics
router.get(
  '/analytics/usage',
  requirePermission('VIEW_ANALYTICS'),
  validate({ query: commonSchemas.dateRange }),
  asyncHandler(reportController.getReportUsageAnalytics)
);

router.get(
  '/analytics/performance',
  requirePermission('VIEW_ANALYTICS'),
  validate({ query: commonSchemas.dateRange }),
  asyncHandler(reportController.getReportPerformanceAnalytics)
);

// Quick reports (pre-defined)
router.get(
  '/quick/reconciliation-summary',
  asyncHandler(reportController.getQuickReconciliationSummary)
);

router.get(
  '/quick/recent-matches',
  asyncHandler(reportController.getQuickRecentMatches)
);

router.get(
  '/quick/counterparty-breakdown',
  asyncHandler(reportController.getQuickCounterpartyBreakdown)
);

router.get(
  '/quick/discrepancy-summary',
  asyncHandler(reportController.getQuickDiscrepancySummary)
);

export { router as reportRoutes };