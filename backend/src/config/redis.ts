import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { config } from './config';

class RedisClient {
  private static instance: RedisClientType;
  
  private constructor() {}
  
  public static getInstance(): RedisClientType {
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        url: config.redis.url || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.error('Redis connection failed after 3 retries');
              return false;
            }
            return Math.min(retries * 50, 1000);
          },
        },
      });
      
      // Error handling
      RedisClient.instance.on('error', (error) => {
        logger.error('Redis error:', error);
      });
      
      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });
      
      RedisClient.instance.on('ready', () => {
        logger.info('Redis client ready');
      });
      
      RedisClient.instance.on('end', () => {
        logger.info('Redis client disconnected');
      });
      
      // Graceful shutdown
      process.on('beforeExit', async () => {
        logger.info('Disconnecting from Redis...');
        await RedisClient.instance.quit();
      });
    }
    
    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();

// Redis connection function
export const connectRedis = async (): Promise<void> => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    logger.info('Redis connected successfully');
    
    // Test the connection
    await redis.ping();
    logger.info('Redis connection test successful');
    
  } catch (error) {
    logger.warn('Redis connection failed, continuing without caching:', error);
    // Don't throw error - app can work without Redis
  }
};

// Redis health check
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (!redis.isOpen) {
      return false;
    }
    await redis.ping();
    return true;
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

// Cache utility functions
export const cacheUtils = {
  // Set cache with expiration
  set: async (key: string, value: any, ttlSeconds: number = 3600): Promise<void> => {
    try {
      if (redis.isOpen) {
        await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },
  
  // Get cache
  get: async (key: string): Promise<any> => {
    try {
      if (redis.isOpen) {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },
  
  // Delete cache
  del: async (key: string): Promise<void> => {
    try {
      if (redis.isOpen) {
        await redis.del(key);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },
  
  // Clear cache by pattern
  clearPattern: async (pattern: string): Promise<void> => {
    try {
      if (redis.isOpen) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
    }
  },
};

export default redis;