import { app } from './app';
import { config } from './config/config';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redis, checkRedisHealth } from './config/redis';
import { cleanupOldFiles } from './middleware/upload';
import cron from 'node-cron';

const PORT = config.server.port || 3001;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connection closed');
      
      // Close Redis connection
      if (redis) {
        redis.disconnect();
        logger.info('Redis connection closed');
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force exit after timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.server.env}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection successful');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  // Test Redis connection
  if (await checkRedisHealth()) {
    logger.info('✅ Redis connection successful');
  } else {
    logger.warn('⚠️  Redis connection failed - caching disabled');
  }
  
  // Schedule cleanup jobs (only in production)
  if (!config.server.isTest) {
    // Clean up old uploaded files every day at 2 AM
    cron.schedule('0 2 * * *', () => {
      logger.info('Running scheduled file cleanup');
      cleanupOldFiles(24); // Delete files older than 24 hours
    });
    
    // Clean up old reports every week
    cron.schedule('0 3 * * 0', async () => {
      logger.info('Running scheduled report cleanup');
      try {
        const expiredReports = await prisma.report.findMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });
        
        for (const report of expiredReports) {
          if (report.filePath && require('fs').existsSync(report.filePath)) {
            require('fs').unlinkSync(report.filePath);
          }
        }
        
        await prisma.report.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });
        
        logger.info(`Cleaned up ${expiredReports.length} expired reports`);
      } catch (error) {
        logger.error('Error during report cleanup:', error);
      }
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export server for testing
export { server };