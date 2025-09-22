import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { redis } from '../config/redis';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

// Rate limiter configuration
const rateLimiterConfig = {
  storeClient: redis.isOpen ? redis : undefined,
  keyPrefix: 'rl_api',
  points: config.rateLimit.maxRequests, // Number of requests
  duration: config.rateLimit.windowMs / 1000, // Per duration in seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
};

// Create rate limiter instance
const rateLimiter = redis.isOpen 
  ? new RateLimiterRedis(rateLimiterConfig)
  : new RateLimiterMemory(rateLimiterConfig);

// Different rate limits for different endpoints
const endpointLimits = {
  // Authentication endpoints - more strict
  auth: new (redis.isOpen ? RateLimiterRedis : RateLimiterMemory)({
    ...rateLimiterConfig,
    keyPrefix: 'rl_auth',
    points: 5, // 5 requests
    duration: 900, // per 15 minutes
    blockDuration: 900, // block for 15 minutes
  }),
  
  // File upload endpoints - more strict
  upload: new (redis.isOpen ? RateLimiterRedis : RateLimiterMemory)({
    ...rateLimiterConfig,
    keyPrefix: 'rl_upload',
    points: 10, // 10 uploads
    duration: 3600, // per hour
    blockDuration: 3600, // block for 1 hour
  }),
  
  // Report generation - moderate
  reports: new (redis.isOpen ? RateLimiterRedis : RateLimiterMemory)({
    ...rateLimiterConfig,
    keyPrefix: 'rl_reports',
    points: 20, // 20 requests
    duration: 3600, // per hour
    blockDuration: 1800, // block for 30 minutes
  }),
  
  // API endpoints - standard
  api: rateLimiter,
};

// Get client IP address - improved to handle proxy headers properly
const getClientIP = (req: Request): string => {
  // Try multiple sources for the real IP address
  // Check standard proxy headers first
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  const xRealIP = req.headers['x-real-ip'] as string;
  const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
  
  // If behind a proxy, these headers contain the real client IP
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (original client)
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    const clientIP = ips[0];
    if (clientIP && clientIP !== 'unknown') {
      return clientIP;
    }
  }
  
  if (xRealIP && xRealIP !== 'unknown') {
    return xRealIP;
  }
  
  if (cfConnectingIP && cfConnectingIP !== 'unknown') {
    return cfConnectingIP;
  }
  
  // Fallback to Express's req.ip (works when trust proxy is set)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return req.ip;
  }
  
  // Legacy fallbacks (deprecated but kept for compatibility)
  if (req.connection?.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  if ((req as any).socket?.remoteAddress) {
    return (req as any).socket.remoteAddress;
  }
  
  // Final fallback
  return 'unknown';
};

// Get rate limiter key
const getRateLimiterKey = (req: Request): string => {
  const ip = getClientIP(req);
  const userId = req.user?.id;
  
  // Use user ID if authenticated, otherwise use IP
  return userId ? `user_${userId}` : `ip_${ip}`;
};

// Determine which rate limiter to use based on the route
const getRateLimiter = (req: Request) => {
  const path = req.path.toLowerCase();
  
  if (path.includes('/auth/')) {
    return endpointLimits.auth;
  }
  
  if (path.includes('/upload') || req.headers['content-type']?.includes('multipart/form-data')) {
    return endpointLimits.upload;
  }
  
  if (path.includes('/reports/')) {
    return endpointLimits.reports;
  }
  
  return endpointLimits.api;
};

// Main rate limiter middleware
export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = getRateLimiterKey(req);
    const limiter = getRateLimiter(req);
    
    const result = await limiter.consume(key);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': limiter.points.toString(),
      'X-RateLimit-Remaining': result.remainingPoints?.toString() || '0',
      'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString(),
    });
    
    next();
    
  } catch (rejRes: any) {
    // Rate limit exceeded
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    res.set({
      'Retry-After': secs.toString(),
      'X-RateLimit-Limit': rejRes.totalHits?.toString() || '0',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
    });
    
    logger.warn('Rate limit exceeded', {
      ip: getClientIP(req),
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      msBeforeNext: rejRes.msBeforeNext,
    });
    
    const error = new AppError(
      `Too many requests. Please try again in ${secs} seconds.`,
      429,
      true,
      'RATE_LIMIT_EXCEEDED',
      {
        retryAfter: secs,
        limit: rejRes.totalHits,
        resetTime: new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
      }
    );
    
    next(error);
  }
};

// Rate limiter for specific actions
export const createActionLimiter = (options: {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix: string;
}) => {
  const limiter = new (redis.isOpen ? RateLimiterRedis : RateLimiterMemory)({
    storeClient: redis.isOpen ? redis : undefined,
    keyPrefix: options.keyPrefix,
    points: options.points,
    duration: options.duration,
    blockDuration: options.blockDuration || options.duration,
  });
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = getRateLimiterKey(req);
      await limiter.consume(key);
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      const error = new AppError(
        `Action rate limit exceeded. Please try again in ${secs} seconds.`,
        429,
        true,
        'ACTION_RATE_LIMIT_EXCEEDED',
        { retryAfter: secs }
      );
      
      next(error);
    }
  };
};

// Specific rate limiters for sensitive actions
export const loginLimiter = createActionLimiter({
  points: 5, // 5 attempts
  duration: 900, // per 15 minutes
  blockDuration: 1800, // block for 30 minutes
  keyPrefix: 'rl_login',
});

export const passwordResetLimiter = createActionLimiter({
  points: 3, // 3 attempts
  duration: 3600, // per hour
  blockDuration: 3600, // block for 1 hour
  keyPrefix: 'rl_password_reset',
});

export const emailVerificationLimiter = createActionLimiter({
  points: 5, // 5 attempts
  duration: 3600, // per hour
  blockDuration: 3600, // block for 1 hour
  keyPrefix: 'rl_email_verification',
});

// Export aliases for compatibility
export const rateLimiter = rateLimiterMiddleware;
export const globalRateLimiter = rateLimiterMiddleware;
export default rateLimiterMiddleware;