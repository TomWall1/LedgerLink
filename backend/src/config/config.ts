import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // ERP Integrations
  XERO_CLIENT_ID: z.string().optional(),
  XERO_CLIENT_SECRET: z.string().optional(),
  XERO_REDIRECT_URI: z.string().optional(),
  
  QB_CLIENT_ID: z.string().optional(),
  QB_CLIENT_SECRET: z.string().optional(),
  QB_REDIRECT_URI: z.string().optional(),
  QB_SANDBOX: z.string().transform(Boolean).default('true'),
  
  SAGE_CLIENT_ID: z.string().optional(),
  SAGE_CLIENT_SECRET: z.string().optional(),
  SAGE_REDIRECT_URI: z.string().optional(),
  
  NETSUITE_ACCOUNT_ID: z.string().optional(),
  NETSUITE_CLIENT_ID: z.string().optional(),
  NETSUITE_CLIENT_SECRET: z.string().optional(),
  
  // AI/ML
  OPENAI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  
  // Payment Processing
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_AI_MATCHING: z.string().transform(Boolean).default('true'),
  ENABLE_REAL_TIME_SYNC: z.string().transform(Boolean).default('true'),
  ENABLE_AUDIT_LOGGING: z.string().transform(Boolean).default('true'),
  ENABLE_ANALYTICS: z.string().transform(Boolean).default('true'),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  PASSWORD_MIN_LENGTH: z.string().transform(Number).default('8'),
  PASSWORD_REQUIRE_SPECIAL: z.string().transform(Boolean).default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_MAX_SIZE: z.string().default('100m'),
  LOG_MAX_FILES: z.string().transform(Number).default('10'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

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
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
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