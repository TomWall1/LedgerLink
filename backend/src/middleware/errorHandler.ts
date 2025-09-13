import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/config';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;
  
  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    status: number;
    details?: any;
    stack?: string;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
  };
}

// Handle different error types
const handlePrismaError = (error: any): AppError => {
  if (error.code === 'P2002') {
    return new AppError(
      'A record with this information already exists',
      409,
      true,
      'DUPLICATE_ENTRY',
      {
        field: error.meta?.target?.[0] || 'unknown',
      }
    );
  }
  
  if (error.code === 'P2025') {
    return new AppError(
      'Record not found',
      404,
      true,
      'NOT_FOUND'
    );
  }
  
  if (error.code === 'P2003') {
    return new AppError(
      'Foreign key constraint failed',
      400,
      true,
      'FOREIGN_KEY_CONSTRAINT'
    );
  }
  
  return new AppError(
    'Database operation failed',
    500,
    true,
    'DATABASE_ERROR',
    { originalCode: error.code }
  );
};

const handleJWTError = (): AppError => {
  return new AppError(
    'Invalid authentication token',
    401,
    true,
    'INVALID_TOKEN'
  );
};

const handleJWTExpiredError = (): AppError => {
  return new AppError(
    'Authentication token has expired',
    401,
    true,
    'TOKEN_EXPIRED'
  );
};

const handleValidationError = (error: any): AppError => {
  const message = error.details ? 
    error.details.map((detail: any) => detail.message).join('. ') :
    'Validation failed';
    
  return new AppError(
    message,
    400,
    true,
    'VALIDATION_ERROR',
    error.details
  );
};

const handleMulterError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'File size too large',
      413,
      true,
      'FILE_TOO_LARGE',
      { maxSize: config.upload.maxFileSize }
    );
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new AppError(
      'Too many files uploaded',
      413,
      true,
      'TOO_MANY_FILES'
    );
  }
  
  return new AppError(
    'File upload failed',
    400,
    true,
    'UPLOAD_ERROR'
  );
};

// Convert errors to AppError
const convertToAppError = (error: any): AppError => {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Prisma errors
  if (error.code && error.code.startsWith('P')) {
    return handlePrismaError(error);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return handleJWTError();
  }
  
  if (error.name === 'TokenExpiredError') {
    return handleJWTExpiredError();
  }
  
  // Joi validation errors
  if (error.isJoi || error.name === 'ValidationError') {
    return handleValidationError(error);
  }
  
  // Multer errors
  if (error.code && error.code.startsWith('LIMIT_')) {
    return handleMulterError(error);
  }
  
  // Rate limiting errors
  if (error.statusCode === 429) {
    return new AppError(
      'Too many requests, please try again later',
      429,
      true,
      'RATE_LIMIT_EXCEEDED'
    );
  }
  
  // Default server error
  return new AppError(
    config.server.isProduction ? 'Internal server error' : error.message,
    500,
    false
  );
};

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const appError = convertToAppError(error);
  
  // Log error
  const logData = {
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      stack: appError.stack,
      isOperational: appError.isOperational,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.get('X-Request-ID'),
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : null,
  };
  
  if (appError.statusCode >= 500) {
    logger.error('Server error:', logData);
  } else {
    logger.warn('Client error:', logData);
  }
  
  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: {
      message: appError.message,
      code: appError.code,
      status: appError.statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      requestId: req.get('X-Request-ID'),
    },
  };
  
  // Add details in development or if operational error
  if (config.server.isDevelopment || appError.isOperational) {
    if (appError.details) {
      errorResponse.error.details = appError.details;
    }
  }
  
  // Add stack trace in development
  if (config.server.isDevelopment && appError.stack) {
    errorResponse.error.stack = appError.stack;
  }
  
  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

export default errorHandler;