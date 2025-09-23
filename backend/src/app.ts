import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { globalRateLimiter } from './middleware/rateLimiter';

// Import routes
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { integrationRoutes } from './routes/integrationRoutes';
import { matchingRoutes } from './routes/matchingRoutes';
import { reportRoutes } from './routes/reportRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { healthRoutes } from './routes/healthRoutes';

// Import controller for direct routes
import { integrationController } from './controllers/integrationController';
import { authenticate } from './middleware/auth';
import { asyncHandler } from './middleware/errorHandler';

const app: Application = express();

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: config.cors.credentials,
  maxAge: 86400, // 24 hours
}));

// Compression
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses if the request includes a cache-control no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024, // Only compress if response is larger than 1KB
}));

// Body parsing middleware
app.use(express.json({ 
  limit: config.server.bodyLimit,
  verify: (req: any, res, buf) => {
    // Store raw body for webhook signature verification
    if (req.originalUrl.includes('/webhooks/')) {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: config.server.bodyLimit,
}));

// Request logging
if (!config.server.isTest) {
  app.use(requestLogger);
}

// Global rate limiting
app.use(globalRateLimiter);

// Health check endpoint (before other middleware)
app.use('/api/health', healthRoutes);

// Direct Xero auth status endpoint (matches frontend expectation)
app.get('/api/xero/auth-status', authenticate, asyncHandler(integrationController.getXeroAuthStatus));

// Serve static files (uploaded files)
app.use('/uploads', express.static(config.upload.path, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// API routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/integrations`, integrationRoutes);
app.use(`${API_PREFIX}/matching`, matchingRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhooks don't need versioning

// API documentation endpoint
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    name: 'LedgerLink API',
    version: '1.0.0',
    description: 'AI-powered invoice reconciliation platform API',
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      integrations: `${API_PREFIX}/integrations`,
      matching: `${API_PREFIX}/matching`,
      reports: `${API_PREFIX}/reports`,
      webhooks: '/api/webhooks',
      health: '/api/health',
      xeroAuthStatus: '/api/xero/auth-status', // Direct endpoint
    },
    environment: config.server.env,
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to LedgerLink API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
  });
});

// Robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Disallow: /api/',
    'Disallow: /uploads/',
    '',
    `Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`,
  ].join('\n'));
});

// Sitemap (basic)
app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url>`,
    `    <loc>${req.protocol}://${req.get('host')}/</loc>`,
    `    <changefreq>daily</changefreq>`,
    `    <priority>1.0</priority>`,
    `  </url>`,
    `  <url>`,
    `    <loc>${req.protocol}://${req.get('host')}/api/docs</loc>`,
    `    <changefreq>weekly</changefreq>`,
    `    <priority>0.8</priority>`,
    `  </url>`,
    '</urlset>',
  ].join('\n'));
});

// Request ID middleware for tracing
app.use((req: any, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] || 
          req.headers['x-correlation-id'] || 
          Math.random().toString(36).substring(2, 15);
  
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// Request timeout middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timeout = config.server.requestTimeout || 30000; // 30 seconds default
  
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timeout',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }, timeout);
  
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
});

// API versioning info
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('API-Version', '1.0.0');
  res.setHeader('API-Deprecated', 'false');
  next();
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export { app };