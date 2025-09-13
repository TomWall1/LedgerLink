import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      id?: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Capture start time
  req.startTime = Date.now();
  
  // Generate request ID if not present
  if (!req.id) {
    req.id = Math.random().toString(36).substring(2, 15);
  }
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    // Calculate response time
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    
    // Get response size
    const contentLength = res.get('Content-Length') || 
                         (chunk ? Buffer.byteLength(chunk, encoding) : 0);
    
    // Determine log level based on status code
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 500 ? 'error' :
                    statusCode >= 400 ? 'warn' : 
                    'info';
    
    // Log response
    logger[logLevel]('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: `${contentLength} bytes`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };
  
  next();
};

// Skip logging for certain routes (health checks, static files, etc.)
export const skipRequestLogging = (patterns: RegExp[]): (req: Request, res: Response, next: NextFunction) => void => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const shouldSkip = patterns.some(pattern => pattern.test(req.url));
    
    if (shouldSkip) {
      next();
    } else {
      requestLogger(req, res, next);
    }
  };
};