import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = Joi.object({
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  API_VERSION: Joi.string().default('v1'),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().optional(),
  
  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: Joi.number().default(15),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Email
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  FROM_EMAIL: Joi.string().email().optional(),
  FROM_NAME: Joi.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_PATH: Joi.string().default('./uploads'),
  
  // ERP Integrations
  XERO_CLIENT_ID: Joi.string().optional(),
  XERO_CLIENT_SECRET: Joi.string().optional(),
  XERO_REDIRECT_URI: Joi.string().optional(),
  
  QB_CLIENT_ID: Joi.string().optional(),
  QB_CLIENT_SECRET: Joi.string().optional(),
  QB_REDIRECT_URI: Joi.string().optional(),
  QB_SANDBOX: Joi.boolean().default(true),
  
  SAGE_CLIENT_ID: Joi.string().optional(),
  SAGE_CLIENT_SECRET: Joi.string().optional(),
  SAGE_REDIRECT_URI: Joi.string().optional(),
  
  NETSUITE_ACCOUNT_ID: Joi.string().optional(),
  NETSUITE_CLIENT_ID: Joi.string().optional(),
  NETSUITE_CLIENT_SECRET: Joi.string().optional(),
  
  // AI/ML
  OPENAI_API_KEY: Joi.string().optional(),
  HUGGINGFACE_API_KEY: Joi.string().optional(),
  
  // Monitoring
  SENTRY_DSN: Joi.string().optional(),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),
  
  // Payment Processing
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
  
  // Feature Flags
  ENABLE_AI_MATCHING: Joi.boolean().default(true),
  ENABLE_REAL_TIME_SYNC: Joi.boolean().default(true),
  ENABLE_AUDIT_LOGGING: Joi.boolean().default(true),
  ENABLE_ANALYTICS: Joi.boolean().default(true),
  
  // Security
  ENCRYPTION_KEY: Joi.string().min(32).optional(),
  SESSION_SECRET: Joi.string().min(32).optional(),
  PASSWORD_MIN_LENGTH: Joi.number().default(8),
  PASSWORD_REQUIRE_SPECIAL: Joi.boolean().default(true),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  LOG_MAX_SIZE: Joi.string().default('100m'),
  LOG_MAX_FILES: Joi.number().default(10),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration object
export const config = {
  server: {
    port: env.PORT,
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  api: {
    version: env.API_VERSION,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN.split(',').map((origin: string) => origin.trim()),
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to milliseconds
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    from: {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME,
    },
  },
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    path: env.UPLOAD_PATH,
  },
  integrations: {
    xero: {
      clientId: env.XERO_CLIENT_ID,
      clientSecret: env.XERO_CLIENT_SECRET,
      redirectUri: env.XERO_REDIRECT_URI,
    },
    quickbooks: {
      clientId: env.QB_CLIENT_ID,
      clientSecret: env.QB_CLIENT_SECRET,
      redirectUri: env.QB_REDIRECT_URI,
      sandbox: env.QB_SANDBOX,
    },
    sage: {
      clientId: env.SAGE_CLIENT_ID,
      clientSecret: env.SAGE_CLIENT_SECRET,
      redirectUri: env.SAGE_REDIRECT_URI,
    },
    netsuite: {
      accountId: env.NETSUITE_ACCOUNT_ID,
      clientId: env.NETSUITE_CLIENT_ID,
      clientSecret: env.NETSUITE_CLIENT_SECRET,
    },
  },
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    huggingface: {
      apiKey: env.HUGGINGFACE_API_KEY,
    },
  },
  monitoring: {
    sentry: {
      dsn: env.SENTRY_DSN,
    },
    newRelic: {
      licenseKey: env.NEW_RELIC_LICENSE_KEY,
    },
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  },
  features: {
    aiMatching: env.ENABLE_AI_MATCHING,
    realTimeSync: env.ENABLE_REAL_TIME_SYNC,
    auditLogging: env.ENABLE_AUDIT_LOGGING,
    analytics: env.ENABLE_ANALYTICS,
  },
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    sessionSecret: env.SESSION_SECRET,
    password: {
      minLength: env.PASSWORD_MIN_LENGTH,
      requireSpecial: env.PASSWORD_REQUIRE_SPECIAL,
    },
  },
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  },
} as const;

// Type exports
export type Config = typeof config;
export type Environment = typeof env.NODE_ENV;