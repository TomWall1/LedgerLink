import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validate } from '../middleware/validation';
import { authSchemas } from '../middleware/validation';
import { loginLimiter, passwordResetLimiter, emailVerificationLimiter } from '../middleware/rateLimiter';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.post(
  '/register',
  validate(authSchemas.register),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  loginLimiter,
  validate(authSchemas.login),
  asyncHandler(authController.login)
);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(authSchemas.forgotPassword),
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(authSchemas.resetPassword),
  asyncHandler(authController.resetPassword)
);

router.get(
  '/verify-email/:token',
  emailVerificationLimiter,
  asyncHandler(authController.verifyEmail)
);

router.post(
  '/resend-verification',
  emailVerificationLimiter,
  optionalAuthenticate,
  asyncHandler(authController.resendVerification)
);

// Protected routes
router.post(
  '/refresh',
  asyncHandler(authController.refreshToken)
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

router.post(
  '/change-password',
  authenticate,
  validate(authSchemas.changePassword),
  asyncHandler(authController.changePassword)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser)
);

router.post(
  '/logout-all',
  authenticate,
  asyncHandler(authController.logoutAll)
);

export { router as authRoutes };