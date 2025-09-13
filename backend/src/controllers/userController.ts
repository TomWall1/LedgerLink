import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { cacheUtils } from '../config/redis';
import { generateFileUrl, validateImageFile } from '../middleware/upload';
import crypto from 'crypto';

class UserController {
  // Get current user profile
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            industry: true,
            size: true,
            country: true,
            timezone: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { user },
    });
  };
  
  // Update user profile
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { firstName, lastName, timezone, notifications } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        // Note: notifications would be stored in a separate settings table or JSON field
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('User profile updated', {
      userId,
      updatedFields: Object.keys(req.body),
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  };
  
  // Upload profile avatar
  public uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const file = req.file;
    
    if (!file) {
      throw new AppError('No file uploaded', 400, true, 'NO_FILE');
    }
    
    validateImageFile(file);
    
    const avatarUrl = generateFileUrl(req, file.path);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Note: avatar URL would be stored in user profile
        // For now, we'll just log it
      },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('Avatar uploaded', {
      userId,
      filename: file.filename,
      size: file.size,
    });
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl },
    });
  };
  
  // Delete profile avatar
  public deleteAvatar = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    // In a real implementation, you would delete the file and update the user record
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('Avatar deleted', { userId });
    
    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  };
  
  // Get user settings
  public getSettings = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    // In a real implementation, settings would be in a separate table
    const settings = {
      notifications: {
        email: true,
        browser: true,
        weekly: false,
      },
      privacy: {
        profileVisible: true,
        shareAnalytics: false,
      },
      matching: {
        autoApproveThreshold: 95,
        enableAIMatching: true,
        requireExactInvoiceNumber: false,
      },
    };
    
    res.json({
      success: true,
      data: { settings },
    });
  };
  
  // Update user settings
  public updateSettings = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const settings = req.body;
    
    // In a real implementation, you would validate and save settings
    
    logger.info('User settings updated', {
      userId,
      settingsKeys: Object.keys(settings),
    });
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
    });
  };
  
  // Get user notifications
  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);
    
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        unreadCount,
      },
    });
  };
  
  // Mark notification as read
  public markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: notificationId } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, true, 'NOTIFICATION_NOT_FOUND');
    }
    
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  };
  
  // Mark all notifications as read
  public markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  };
  
  // Delete notification
  public deleteNotification = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: notificationId } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });
    
    if (!notification) {
      throw new AppError('Notification not found', 404, true, 'NOTIFICATION_NOT_FOUND');
    }
    
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    
    res.json({
      success: true,
      message: 'Notification deleted',
    });
  };
  
  // Get user API keys
  public getApiKeys = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        // Don't return the actual key
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      success: true,
      data: { apiKeys },
    });
  };
  
  // Create API key
  public createApiKey = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { name, permissions = [], expiresAt } = req.body;
    
    // Generate API key
    const key = `ll_${crypto.randomBytes(32).toString('hex')}`;
    
    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        key: true, // Only return key on creation
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    
    logger.info('API key created', {
      userId,
      apiKeyId: apiKey.id,
      name,
    });
    
    res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: { apiKey },
    });
  };
  
  // Revoke API key
  public revokeApiKey = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id: apiKeyId } = req.params;
    
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId,
      },
    });
    
    if (!apiKey) {
      throw new AppError('API key not found', 404, true, 'API_KEY_NOT_FOUND');
    }
    
    await prisma.apiKey.delete({
      where: { id: apiKeyId },
    });
    
    logger.info('API key revoked', {
      userId,
      apiKeyId,
    });
    
    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  };
  
  // Admin routes
  
  // Get all users (admin only)
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          [String(sortBy)]: sortOrder as 'asc' | 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.user.count(),
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  };
  
  // Get user by ID (admin only)
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        permissions: {
          include: {
            permission: true,
          },
        },
        erpConnections: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { user },
    });
  };
  
  // Update user role (admin only)
  public updateUserRole = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.params;
    const { role } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('User role updated', {
      adminUserId: req.user!.id,
      targetUserId: userId,
      oldRole: user.role,
      newRole: role,
    });
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser },
    });
  };
  
  // Deactivate user (admin only)
  public deactivateUser = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    if (userId === req.user!.id) {
      throw new AppError('Cannot deactivate your own account', 400, true, 'CANNOT_DEACTIVATE_SELF');
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('User deactivated', {
      adminUserId: req.user!.id,
      targetUserId: userId,
    });
    
    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  };
  
  // Reactivate user (admin only)
  public activateUser = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    
    logger.info('User activated', {
      adminUserId: req.user!.id,
      targetUserId: userId,
    });
    
    res.json({
      success: true,
      message: 'User activated successfully',
    });
  };
  
  // Delete user (super admin only)
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    if (userId === req.user!.id) {
      throw new AppError('Cannot delete your own account', 400, true, 'CANNOT_DELETE_SELF');
    }
    
    // In a real implementation, you would handle cascading deletes carefully
    await prisma.user.delete({
      where: { id: userId },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('User deleted', {
      adminUserId: req.user!.id,
      targetUserId: userId,
      targetUserEmail: user.email,
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  };
}

export const userController = new UserController();