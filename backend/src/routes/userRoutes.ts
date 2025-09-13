import { Router } from 'express';
import { userController } from '../controllers/userController';
import { validate, commonSchemas, userSchemas } from '../middleware/validation';
import { authenticate, authorize, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get(
  '/profile',
  asyncHandler(userController.getProfile)
);

// Update current user profile
router.put(
  '/profile',
  validate(userSchemas.updateProfile),
  asyncHandler(userController.updateProfile)
);

// Upload profile avatar
router.post(
  '/profile/avatar',
  asyncHandler(userController.uploadAvatar)
);

// Delete profile avatar
router.delete(
  '/profile/avatar',
  asyncHandler(userController.deleteAvatar)
);

// Get user settings
router.get(
  '/settings',
  asyncHandler(userController.getSettings)
);

// Update user settings
router.put(
  '/settings',
  asyncHandler(userController.updateSettings)
);

// Get user notifications
router.get(
  '/notifications',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(userController.getNotifications)
);

// Mark notification as read
router.put(
  '/notifications/:id/read',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.markNotificationRead)
);

// Mark all notifications as read
router.put(
  '/notifications/read-all',
  asyncHandler(userController.markAllNotificationsRead)
);

// Delete notification
router.delete(
  '/notifications/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.deleteNotification)
);

// Get user API keys
router.get(
  '/api-keys',
  asyncHandler(userController.getApiKeys)
);

// Create API key
router.post(
  '/api-keys',
  asyncHandler(userController.createApiKey)
);

// Revoke API key
router.delete(
  '/api-keys/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.revokeApiKey)
);

// Admin only routes
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Get all users (admin only)
router.get(
  '/',
  validate({ query: commonSchemas.pagination }),
  asyncHandler(userController.getUsers)
);

// Get user by ID (admin only)
router.get(
  '/:id',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.getUserById)
);

// Update user role (admin only)
router.put(
  '/:id/role',
  validate({
    params: commonSchemas.id,
    body: userSchemas.updateRole.body,
  }),
  asyncHandler(userController.updateUserRole)
);

// Deactivate user (admin only)
router.put(
  '/:id/deactivate',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.deactivateUser)
);

// Reactivate user (admin only)
router.put(
  '/:id/activate',
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.activateUser)
);

// Delete user (super admin only)
router.delete(
  '/:id',
  authorize('SUPER_ADMIN'),
  validate({ params: commonSchemas.id }),
  asyncHandler(userController.deleteUser)
);

export { router as userRoutes };