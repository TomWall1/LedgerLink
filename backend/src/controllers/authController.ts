import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { cacheUtils } from '../config/redis';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthController {
  // Generate JWT tokens
  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const payload = { userId, email, role };
    
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
    
    // Parse expiration time
    const expiresIn = this.parseExpirationTime(config.jwt.expiresIn);
    
    return { accessToken, refreshToken, expiresIn };
  }
  
  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/(\d+)([smhd])/);
    if (!match) return 3600; // Default 1 hour
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return 3600;
    }
  }
  
  // Register new user
  public register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, companyName, inviteToken } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, true, 'USER_EXISTS');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    let companyId: string | undefined;
    
    // Handle company creation or invitation
    if (inviteToken) {
      // TODO: Handle invitation logic
      // const invitation = await prisma.invitation.findUnique({ where: { token: inviteToken } });
      // companyId = invitation?.companyId;
    } else if (companyName) {
      // Create new company
      const company = await prisma.company.create({
        data: {
          name: companyName,
          slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        },
      });
      companyId = company.id;
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        companyId,
        emailVerificationToken,
        role: companyId ? 'ADMIN' : 'USER', // First user in company becomes admin
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        companyId: true,
        createdAt: true,
      },
    });
    
    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    
    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);
    
    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user,
        tokens,
      },
    });
  };
  
  // Login user
  public login = async (req: Request, res: Response): Promise<void> => {
    const { email, password, rememberMe } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
    }
    
    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 401, true, 'ACCOUNT_DEACTIVATED');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, true, 'INVALID_CREDENTIALS');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);
    
    // Cache user data
    await cacheUtils.set(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions: user.permissions.map(p => p.permission.name),
    }, rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60); // 30 days if remember me, else 24 hours
    
    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          company: user.company,
          permissions: user.permissions.map(p => p.permission.name),
          lastLoginAt: user.lastLoginAt,
        },
        tokens,
      },
    });
  };
  
  // Refresh access token
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError('Refresh token required', 401, true, 'REFRESH_TOKEN_REQUIRED');
    }
    
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });
      
      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
      }
      
      // Generate new tokens
      const tokens = this.generateTokens(user.id, user.email, user.role);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
      
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
    }
  };
  
  // Logout user
  public logout = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('User logged out', {
      userId,
      ip: req.ip,
    });
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  };
  
  // Logout from all devices
  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    
    // Clear all user caches (in a real app, you'd maintain a blacklist of tokens)
    await cacheUtils.clearPattern(`user:${userId}*`);
    
    logger.info('User logged out from all devices', {
      userId,
      ip: req.ip,
    });
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  };
  
  // Get current user
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
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
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        permissions: {
          include: {
            permission: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: {
        user: {
          ...user,
          permissions: user.permissions.map(p => p.permission),
        },
      },
    });
  };
  
  // Forgot password
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
      return;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });
    
    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);
    
    logger.info('Password reset requested', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
    });
    
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  };
  
  // Reset password
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });
    
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, true, 'INVALID_RESET_TOKEN');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${user.id}`);
    
    logger.info('Password reset completed', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  };
  
  // Change password
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('User not found', 404, true, 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400, true, 'INVALID_CURRENT_PASSWORD');
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${userId}`);
    
    logger.info('Password changed', {
      userId,
      ip: req.ip,
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  };
  
  // Verify email
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });
    
    if (!user) {
      throw new AppError('Invalid verification token', 400, true, 'INVALID_VERIFICATION_TOKEN');
    }
    
    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });
    
    // Clear user cache
    await cacheUtils.del(`user:${user.id}`);
    
    logger.info('Email verified', {
      userId: user.id,
      email: user.email,
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  };
  
  // Resend verification email
  public resendVerification = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const userEmail = email || req.user?.email;
    
    if (!userEmail) {
      throw new AppError('Email address required', 400, true, 'EMAIL_REQUIRED');
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });
    
    if (!user) {
      // Don't reveal if user exists
      res.json({
        success: true,
        message: 'If an account with this email exists and is unverified, a verification email has been sent.',
      });
      return;
    }
    
    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400, true, 'EMAIL_ALREADY_VERIFIED');
    }
    
    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });
    
    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailVerificationToken);
    
    logger.info('Verification email resent', {
      userId: user.id,
      email: user.email,
    });
    
    res.json({
      success: true,
      message: 'Verification email sent',
    });
  };
}

export const authController = new AuthController();