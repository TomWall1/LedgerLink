import { Request, Response } from 'express';
import { prisma, checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import os from 'os';
import process from 'process';

class HealthController {
  // Basic health check
  public basicHealth = async (req: Request, res: Response): Promise<void> => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env,
    });
  };

  // Detailed health check with all services
  public detailedHealth = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    // Check all services
    const [databaseHealth, redisHealth] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkRedisConnection(),
    ]);
    
    const responseTime = Date.now() - startTime;
    const overallStatus = databaseHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.env,
      services: {
        database: databaseHealth,
        redis: redisHealth,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: os.platform(),
        nodeVersion: process.version,
      },
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  };

  // Readiness check (can the service handle requests?)
  public readinessCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check critical dependencies
      const isDatabaseReady = await checkDatabaseHealth();
      
      if (!isDatabaseReady) {
        res.status(503).json({
          status: 'not ready',
          reason: 'Database connection failed',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      logger.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not ready',
        reason: 'Internal error during readiness check',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Liveness check (is the service alive?)
  public livenessCheck = async (req: Request, res: Response): Promise<void> => {
    // Simple liveness check - if we can respond, we're alive
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };

  // Database-specific health check
  public databaseHealth = async (req: Request, res: Response): Promise<void> => {
    const dbHealth = await this.checkDatabaseConnection();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  };

  // Redis-specific health check
  public redisHealth = async (req: Request, res: Response): Promise<void> => {
    const redisHealthData = await this.checkRedisConnection();
    const statusCode = redisHealthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(redisHealthData);
  };

  // External services health check
  public servicesHealth = async (req: Request, res: Response): Promise<void> => {
    const services = {
      database: await this.checkDatabaseConnection(),
      redis: await this.checkRedisConnection(),
    };
    
    const allHealthy = Object.values(services).every(service => service.status === 'healthy');
    const overallStatus = allHealthy ? 'healthy' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    });
  };

  // System metrics
  public systemMetrics = async (req: Request, res: Response): Promise<void> => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      system: {
        uptime: {
          process: process.uptime(),
          system: os.uptime(),
        },
        memory: {
          rss: this.formatBytes(memoryUsage.rss),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          external: this.formatBytes(memoryUsage.external),
          arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        os: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          hostname: os.hostname(),
          totalMemory: this.formatBytes(os.totalmem()),
          freeMemory: this.formatBytes(os.freemem()),
          loadAverage: os.loadavg(),
          cpus: os.cpus().length,
        },
        node: {
          version: process.version,
          pid: process.pid,
          title: process.title,
        },
      },
    });
  };

  // Helper methods
  private async checkDatabaseConnection(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await checkDatabaseHealth();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Database health check failed:', error);
      
      return {
        status: 'unhealthy',
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedisConnection(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await checkRedisHealth();
      const responseTime = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'Redis not available',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const healthController = new HealthController();