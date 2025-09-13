import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { integrationRoutes } from './routes/integrationRoutes';
import { matchingRoutes } from './routes/matchingRoutes';
import { reportRoutes } from './routes/reportRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import path from 'path';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check (before rate limiting)
app.use('/health', healthRoutes);

// API routes
const apiVersion = `/api/${config.api.version}`;
app.use(`${apiVersion}/auth`, authRoutes);
app.use(`${apiVersion}/users`, userRoutes);
app.use(`${apiVersion}/integrations`, integrationRoutes);
app.use(`${apiVersion}/matching`, matchingRoutes);
app.use(`${apiVersion}/reports`, reportRoutes);
app.use(`${apiVersion}/webhooks`, webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LedgerLink API',
    version: config.api.version,
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${apiVersion}/auth`,
      users: `${apiVersion}/users`,
      integrations: `${apiVersion}/integrations`,
      matching: `${apiVersion}/matching`,
      reports: `${apiVersion}/reports`,
      health: '/health',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: {
      auth: `${apiVersion}/auth`,
      users: `${apiVersion}/users`,
      integrations: `${apiVersion}/integrations`,
      matching: `${apiVersion}/matching`,
      reports: `${apiVersion}/reports`,
      health: '/health',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start listening
    const server = app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port} in ${config.server.env} mode`);
      logger.info(`API documentation available at http://localhost:${config.server.port}/api-docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, closing server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app };