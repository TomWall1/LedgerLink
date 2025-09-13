import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

// Request logger middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique request ID
  req.requestId = req.get('X-Request-ID') || uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);
  
  // Skip logging for health checks in production
  if (config.server.isProduction && req.path === '/health') {
    return next();
  }
  
  // Log request start
  const requestInfo = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  };
  
  // Don't log sensitive data
  const sensitiveRoutes = ['/auth/', '/password', '/token'];
  const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));
  
  if (config.server.isDevelopment || !isSensitive) {
    logger.info('Request started', requestInfo);
  } else {
    logger.info('Request started', {
      ...requestInfo,
      url: '[SENSITIVE]',
    });
  }
  
  // Hook into response finish to log completion
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - req.startTime;
    
    const responseInfo = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length'),
    };
    
    // Log response based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', responseInfo);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseInfo);
    } else {
      logger.info('Request completed successfully', responseInfo);
    }
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Performance monitoring middleware
export const performanceLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    const performanceData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
    
    // Only log in development or for slow requests
    if (config.server.isDevelopment || duration > 1000) {
      logger.debug('Performance metrics', performanceData);
    }
  });
  
  next();
};

// API usage tracking middleware
export const apiUsageLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.on('finish', () => {
    // Track API usage for analytics
    const usageData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.route?.path || req.path,
      statusCode: res.statusCode,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      responseTime: Date.now() - req.startTime,
    };
    
    // In a real application, this would be sent to an analytics service
    if (config.features.analytics) {
      logger.debug('API usage', usageData);
    }
  });
  
  next();
};

export default requestLogger;