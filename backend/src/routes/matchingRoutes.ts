import { Router } from 'express';
import { matchingController } from '../controllers/matchingController';
import { validate, commonSchemas, matchingSchemas, fileSchemas } from '../middleware/validation';
import { authenticate, requirePermission, optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { upload } from '../middleware/upload';

const router = Router();

// CSV matching for non-authenticated users (demo functionality)
router.post(
  '/csv-demo',
  optionalAuthenticate,
  upload.fields([
    { name: 'file1', maxCount: 1 },
    { name: 'file2', maxCount: 1 },
  ]),
  validate(fileSchemas.csvUpload),
  asyncHandler(matchingController.csvDemo)
);

// All other routes require authentication
router.use(authenticate);

// Matching Sessions
router.get(
  '/sessions',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(matchingController.getMatchingSessions)
);

router.post(
  '/sessions',
  requirePermission('MANAGE_MATCHING'),
  validate(matchingSchemas.createSession),
  asyncHandler(matchingController.createMatchingSession)
);

router.get(
  '/sessions/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.getMatchingSession)
);

router.put(
  '/sessions/:id',
  requirePermission('MANAGE_MATCHING'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.updateMatchingSession)
);

router.delete(
  '/sessions/:id',
  requirePermission('MANAGE_MATCHING'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.deleteMatchingSession)
);

// Matching Session Actions
router.post(
  '/sessions/:id/start',
  requirePermission('MANAGE_MATCHING'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.startMatching)
);

router.post(
  '/sessions/:id/stop',
  requirePermission('MANAGE_MATCHING'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.stopMatching)
);

router.get(
  '/sessions/:id/status',
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.getMatchingStatus)
);

router.get(
  '/sessions/:id/progress',
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.getMatchingProgress)
);

// Match Results
router.get(
  '/sessions/:id/results',
  validate({
    params: commonSchemas.id,
    query: commonSchemas.pagination,
  }),
  asyncHandler(matchingController.getMatchResults)
);

router.get(
  '/sessions/:sessionId/results/:resultId',
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.getMatchResult)
);

router.put(
  '/sessions/:sessionId/results/:resultId/review',
  requirePermission('REVIEW_MATCHES'),
  validate({
    params: commonSchemas.id,
    body: matchingSchemas.reviewMatch.body,
  }),
  asyncHandler(matchingController.reviewMatchResult)
);

router.post(
  '/sessions/:id/approve-all',
  requirePermission('APPROVE_MATCHES'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.approveAllMatches)
);

router.post(
  '/sessions/:id/reject-all',
  requirePermission('APPROVE_MATCHES'),
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.rejectAllMatches)
);

// CSV Upload for matching
router.post(
  '/upload-csv',
  requirePermission('UPLOAD_FILES'),
  upload.single('file'),
  validate(fileSchemas.csvUpload),
  asyncHandler(matchingController.uploadCSV)
);

// Bulk operations
router.post(
  '/bulk-review',
  requirePermission('REVIEW_MATCHES'),
  asyncHandler(matchingController.bulkReviewMatches)
);

router.post(
  '/bulk-approve',
  requirePermission('APPROVE_MATCHES'),
  asyncHandler(matchingController.bulkApproveMatches)
);

router.post(
  '/bulk-reject',
  requirePermission('APPROVE_MATCHES'),
  asyncHandler(matchingController.bulkRejectMatches)
);

// Export results
router.get(
  '/sessions/:id/export',
  validate({ params: commonSchemas.id }),
  asyncHandler(matchingController.exportMatchResults)
);

// Matching rules and configuration
router.get(
  '/rules',
  asyncHandler(matchingController.getMatchingRules)
);

router.put(
  '/rules',
  requirePermission('MANAGE_MATCHING'),
  asyncHandler(matchingController.updateMatchingRules)
);

// AI matching suggestions
router.post(
  '/ai-suggest',
  requirePermission('USE_AI_MATCHING'),
  asyncHandler(matchingController.getAISuggestions)
);

// Statistics and analytics
router.get(
  '/statistics',
  validate({ query: commonSchemas.dateRange }),
  asyncHandler(matchingController.getMatchingStatistics)
);

router.get(
  '/confidence-distribution',
  validate({ query: commonSchemas.dateRange }),
  asyncHandler(matchingController.getConfidenceDistribution)
);

export { router as matchingRoutes };