/**
 * Health Check Routes
 * Provides system health and monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dbManager = require('../config/database');
const XeroConnection = require('../models/XeroConnection');
const xeroSyncJob = require('../jobs/xeroSyncJob');

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LedgerLink API',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Private (requires auth)
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LedgerLink API',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {}
    };
    
    // Check database connection
    try {
      const dbStatus = dbManager.getConnectionStatus();
      health.dependencies.database = {
        status: dbStatus.isConnected ? 'healthy' : 'unhealthy',
        details: dbStatus
      };
    } catch (error) {
      health.dependencies.database = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // Check Redis connection (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Add Redis health check here if you implement Redis client
        health.dependencies.redis = {
          status: 'unknown',
          details: 'Redis health check not implemented'
        };
      } catch (error) {
        health.dependencies.redis = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    // Check Xero sync job status
    try {
      const syncStats = xeroSyncJob.getStats();
      health.dependencies.xeroSync = {
        status: syncStats.isRunning ? 'running' : 'idle',
        details: syncStats
      };
    } catch (error) {
      health.dependencies.xeroSync = {
        status: 'error',
        error: error.message
      };
    }
    
    // Determine overall status
    const unhealthyDeps = Object.values(health.dependencies)
      .filter(dep => dep.status === 'unhealthy').length;
    
    if (unhealthyDeps > 0) {
      health.status = 'degraded';
      res.status(503);
    }
    
    res.json(health);
    
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /health/database
 * @desc    Database-specific health and stats
 * @access  Private
 */
router.get('/database', async (req, res) => {
  try {
    const dbStats = await dbManager.getStats();
    const connectionStats = dbManager.getConnectionStatus();
    
    // Get Xero-specific database stats
    const xeroConnectionCount = await XeroConnection.countDocuments();
    const activeConnectionCount = await XeroConnection.countDocuments({ status: 'active' });
    
    res.json({
      status: connectionStats.isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: connectionStats,
      stats: dbStats,
      collections: {
        xeroConnections: {
          total: xeroConnectionCount,
          active: activeConnectionCount
        }
      }
    });
    
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /health/xero
 * @desc    Xero integration health check
 * @access  Private
 */
router.get('/xero', async (req, res) => {
  try {
    // Get Xero connection statistics
    const totalConnections = await XeroConnection.countDocuments();
    const activeConnections = await XeroConnection.countDocuments({ status: 'active' });
    const expiredConnections = await XeroConnection.countDocuments({ status: 'expired' });
    const errorConnections = await XeroConnection.countDocuments({ status: 'error' });
    
    // Get sync job status
    const syncStats = xeroSyncJob.getStats();
    
    // Get recent sync activities
    const recentSyncs = await XeroConnection.find(
      { lastSyncAt: { $exists: true } },
      { tenantName: 1, lastSyncAt: 1, lastSyncStatus: 1 }
    )
    .sort({ lastSyncAt: -1 })
    .limit(10)
    .lean();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: {
        total: totalConnections,
        active: activeConnections,
        expired: expiredConnections,
        error: errorConnections,
        healthScore: totalConnections > 0 ? ((activeConnections / totalConnections) * 100).toFixed(1) : 0
      },
      sync: syncStats,
      recentActivity: recentSyncs
    };
    
    // Determine status based on connection health
    if (errorConnections > activeConnections) {
      health.status = 'degraded';
    } else if (activeConnections === 0 && totalConnections > 0) {
      health.status = 'warning';
    }
    
    res.json(health);
    
  } catch (error) {
    console.error('Xero health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /health/metrics
 * @desc    Application metrics for monitoring
 * @access  Private
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      database: await dbManager.getStats(),
      xero: {
        connections: await XeroConnection.countDocuments(),
        activeConnections: await XeroConnection.countDocuments({ status: 'active' }),
        syncJobStats: xeroSyncJob.getStats()
      },
      system: {
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem(),
        cpuCount: require('os').cpus().length
      }
    };
    
    res.json(metrics);
    
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;