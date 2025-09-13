import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';
import { cacheUtils } from '../config/redis';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        companyId?: string;
        permissions?: string[];
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  iat: number;
  exp: number;
}

// Extract token from request
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookies as fallback
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  
  return null;
};

// Verify JWT token
const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401, true, 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401, true, 'INVALID_TOKEN');
    }
    throw new AppError('Token verification failed', 401, true, 'TOKEN_VERIFICATION_FAILED');
  }
};

// Get user from cache or database
const getUser = async (userId: string) => {
  const cacheKey = `user:${userId}`;
  
  // Try to get from cache first
  let user = await cacheUtils.get(cacheKey);
  
  if (!user) {
    // Get from database
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        companyId: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    if (user) {
      // Cache user for 15 minutes
      await cacheUtils.set(cacheKey, user, 900);
    }
  }
  
  return user;
};

// Main authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AppError('Access token required', 401, true, 'TOKEN_REQUIRED');
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    // Get user details
    const user = await getUser(payload.userId);
    
    if (!user) {
      throw new AppError('User not found', 401, true, 'USER_NOT_FOUND');
    }
    
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, true, 'ACCOUNT_DEACTIVATED');
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions: user.permissions?.map(p => p.permission.name) || [],
    };
    
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      requestId: req.requestId,
    });
    
    next();
    
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next(error);
  }
};

// Optional authentication middleware
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const payload = verifyToken(token);
      const user = await getUser(payload.userId);
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          permissions: user.permissions?.map(p => p.permission.name) || [],
        };
      }
    }
    
    next();
    
  } catch (error) {
    // Don't throw error for optional authentication
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
    });
    
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, true, 'AUTHENTICATION_REQUIRED'));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        requestId: req.requestId,
      });
      
      return next(new AppError('Insufficient permissions', 403, true, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, true, 'AUTHENTICATION_REQUIRED'));
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));
    
    if (!hasPermission) {
      logger.warn('Permission check failed', {
        userId: req.user.id,
        userPermissions,
        requiredPermissions: permissions,
        requestId: req.requestId,
      });
      
      return next(new AppError('Insufficient permissions', 403, true, 'INSUFFICIENT_PERMISSIONS'));
    }
    
    next();
  };
};

// Company-based authorization middleware
export const requireSameCompany = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, true, 'AUTHENTICATION_REQUIRED'));
    }
    
    // Extract company ID from request params or body
    const requestCompanyId = req.params.companyId || req.body.companyId;
    
    if (requestCompanyId && req.user.companyId !== requestCompanyId) {
      logger.warn('Company access denied', {
        userId: req.user.id,
        userCompanyId: req.user.companyId,
        requestedCompanyId: requestCompanyId,
        requestId: req.requestId,
      });
      
      return next(new AppError('Access denied to this company data', 403, true, 'COMPANY_ACCESS_DENIED'));
    }
    
    next();
  };
};

// API key authentication middleware (for webhooks and integrations)
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AppError('API key required', 401, true, 'API_KEY_REQUIRED');
    }
    
    // Verify API key
    const keyRecord = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            companyId: true,
            isActive: true,
          },
        },
      },
    });
    
    if (!keyRecord || !keyRecord.user.isActive) {
      throw new AppError('Invalid API key', 401, true, 'INVALID_API_KEY');
    }
    
    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new AppError('API key has expired', 401, true, 'API_KEY_EXPIRED');
    }
    
    // Update last used
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });
    
    // Add user to request
    req.user = {
      id: keyRecord.user.id,
      email: keyRecord.user.email,
      role: keyRecord.user.role,
      companyId: keyRecord.user.companyId,
    };
    
    next();
    
  } catch (error) {
    next(error);
  }
};

export default authenticate;