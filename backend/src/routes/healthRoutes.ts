import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', asyncHandler(healthController.basicHealth));

// Detailed health check
router.get('/detailed', asyncHandler(healthController.detailedHealth));

// Readiness check
router.get('/ready', asyncHandler(healthController.readinessCheck));

// Liveness check
router.get('/live', asyncHandler(healthController.livenessCheck));

// Database health
router.get('/database', asyncHandler(healthController.databaseHealth));

// Redis health
router.get('/redis', asyncHandler(healthController.redisHealth));

// External services health
router.get('/services', asyncHandler(healthController.servicesHealth));

// System metrics
router.get('/metrics', asyncHandler(healthController.systemMetrics));

export { router as healthRoutes };