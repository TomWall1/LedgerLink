import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Validation middleware factory
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }
    
    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }
    
    // Validate path parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }
    
    // Validate headers
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers);
      if (error) {
        errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      logger.warn('Validation failed', {
        requestId: req.requestId,
        errors,
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return next(new AppError(
        `Validation failed: ${errors.join('; ')}`,
        400,
        true,
        'VALIDATION_ERROR',
        { errors }
      ));
    }
    
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  id: Joi.object({
    id: Joi.string().required().min(1).max(50),
  }),
  
  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
  
  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),
  
  // Search validation
  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    filter: Joi.object().optional(),
  }),
};

// Auth validation schemas
export const authSchemas = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'password'),
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      companyName: Joi.string().min(1).max(100).optional(),
      inviteToken: Joi.string().optional(),
    }),
  },
  
  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),
  },
  
  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },
  
  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'password'),
    }),
  },
  
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'password'),
    }),
  },
};

// User validation schemas
export const userSchemas = {
  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(50).optional(),
      lastName: Joi.string().min(1).max(50).optional(),
      timezone: Joi.string().optional(),
      notifications: Joi.object({
        email: Joi.boolean(),
        browser: Joi.boolean(),
        weekly: Joi.boolean(),
      }).optional(),
    }),
  },
  
  updateRole: {
    body: Joi.object({
      role: Joi.string().valid('ADMIN', 'MANAGER', 'USER', 'VIEWER').required(),
    }),
  },
};

// ERP connection validation schemas
export const erpSchemas = {
  createConnection: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      type: Joi.string().valid('XERO', 'QUICKBOOKS', 'SAGE', 'NETSUITE', 'CUSTOM').required(),
      settings: Joi.object().optional(),
    }),
  },
  
  updateConnection: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      settings: Joi.object().optional(),
      isActive: Joi.boolean().optional(),
    }),
  },
};

// Matching validation schemas
export const matchingSchemas = {
  createSession: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      type: Joi.string().valid('ERP_TO_ERP', 'CSV_TO_CSV', 'ERP_TO_CSV', 'MANUAL').required(),
      sourceType: Joi.string().valid('ERP_CONNECTION', 'CSV_UPLOAD', 'MANUAL_ENTRY').required(),
      sourceConfig: Joi.object().required(),
      targetType: Joi.string().valid('ERP_CONNECTION', 'CSV_UPLOAD', 'MANUAL_ENTRY').required(),
      targetConfig: Joi.object().required(),
      matchingRules: Joi.object({
        amountTolerance: Joi.number().min(0).max(1).default(0.01),
        dateTolerance: Joi.number().integer().min(0).max(30).default(7),
        autoMatchThreshold: Joi.number().min(0).max(1).default(0.95),
        requireExactInvoiceNumber: Joi.boolean().default(false),
        enableFuzzyMatching: Joi.boolean().default(true),
      }).optional(),
      counterpartyLinkId: Joi.string().optional(),
    }),
  },
  
  reviewMatch: {
    body: Joi.object({
      status: Joi.string().valid('MATCHED', 'MISMATCHED', 'REJECTED').required(),
      notes: Joi.string().max(500).optional(),
    }),
  },
};

// Invoice validation schemas
export const invoiceSchemas = {
  create: {
    body: Joi.object({
      invoiceNumber: Joi.string().min(1).max(50).required(),
      amount: Joi.number().positive().precision(2).required(),
      currency: Joi.string().length(3).uppercase().default('USD'),
      issueDate: Joi.date().iso().required(),
      dueDate: Joi.date().iso().min(Joi.ref('issueDate')).optional(),
      counterpartyName: Joi.string().min(1).max(100).required(),
      reference: Joi.string().max(100).optional(),
      description: Joi.string().max(500).optional(),
      status: Joi.string().valid('DRAFT', 'SENT', 'OUTSTANDING', 'OVERDUE', 'PAID', 'CANCELLED').default('OUTSTANDING'),
      lineItems: Joi.array().items(
        Joi.object({
          description: Joi.string().required(),
          quantity: Joi.number().positive().required(),
          unitPrice: Joi.number().positive().required(),
          amount: Joi.number().positive().required(),
        })
      ).optional(),
    }),
  },
  
  update: {
    body: Joi.object({
      amount: Joi.number().positive().precision(2).optional(),
      dueDate: Joi.date().iso().optional(),
      status: Joi.string().valid('DRAFT', 'SENT', 'OUTSTANDING', 'OVERDUE', 'PAID', 'CANCELLED').optional(),
      reference: Joi.string().max(100).optional(),
      description: Joi.string().max(500).optional(),
      paidDate: Joi.date().iso().optional(),
    }),
  },
  
  search: {
    query: Joi.object({
      ...commonSchemas.pagination.describe().keys,
      ...commonSchemas.search.describe().keys,
      status: Joi.string().valid('DRAFT', 'SENT', 'OUTSTANDING', 'OVERDUE', 'PAID', 'CANCELLED').optional(),
      counterparty: Joi.string().optional(),
      amountMin: Joi.number().positive().optional(),
      amountMax: Joi.number().positive().min(Joi.ref('amountMin')).optional(),
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    }),
  },
};

// Report validation schemas
export const reportSchemas = {
  generate: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      type: Joi.string().valid(
        'RECONCILIATION_SUMMARY',
        'DETAILED_MATCHES',
        'AUDIT_TRAIL',
        'COUNTERPARTY_ANALYSIS',
        'DISCREPANCY_REPORT',
        'MONTHLY_TRENDING'
      ).required(),
      format: Joi.string().valid('PDF', 'CSV', 'XLSX').default('PDF'),
      parameters: Joi.object({
        dateFrom: Joi.date().iso().required(),
        dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).required(),
        counterparties: Joi.array().items(Joi.string()).optional(),
        includeMatched: Joi.boolean().default(true),
        includeUnmatched: Joi.boolean().default(true),
        includeMismatched: Joi.boolean().default(true),
      }).required(),
      isScheduled: Joi.boolean().default(false),
      schedule: Joi.string().when('isScheduled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }),
  },
};

// File upload validation
export const fileSchemas = {
  csvUpload: {
    headers: Joi.object({
      'content-type': Joi.string().pattern(/multipart\/form-data/).required(),
    }).unknown(),
  },
};

export default validate;