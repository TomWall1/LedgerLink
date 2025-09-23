/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and implements Xero-specific rate limiting
 */

const rateLimit = require('express-rate-limit');

// Conditionally import Redis dependencies only if Redis is configured
let RedisStore;
let Redis;
let redisClient;

if (process.env.REDIS_URL) {
  try {
    RedisStore = require('rate-limit-redis');
    Redis = require('redis');
    
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      legacyMode: true
    });
    
    redisClient.connect().catch(console.error);
    console.log('Rate limiter using Redis store');
  } catch (error) {
    console.warn('Failed to connect to Redis, using memory store:', error.message);
    redisClient = null;
    RedisStore = null;
  }
} else {
  console.log('Rate limiter using memory store (Redis not configured)');
  redisClient = null;
  RedisStore = null;
}

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  
  store: (redisClient && RedisStore) ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  // Skip rate limiting for successful requests in development
  skip: (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      return false; // Don't skip in development for testing
    }
    return false;
  },
  
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  
  store: (redisClient && RedisStore) ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 900 // 15 minutes
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => req.ip
});

// Xero-specific rate limiter (more lenient for API calls)
const xeroLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Allow 50 requests per minute per user (Xero allows 60, leaving buffer)
  
  store: (redisClient && RedisStore) ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  
  message: {
    success: false,
    message: 'Xero API rate limit exceeded. Please wait before making more requests.',
    retryAfter: 60
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    // Rate limit per user for Xero endpoints
    const userId = req.user?.id;
    const connectionId = req.params.connectionId || req.body.connectionId || req.query.connectionId;
    
    // Create composite key for user + connection to allow multiple connections
    return userId && connectionId ? `${userId}:${connectionId}` : userId || req.ip;
  },
  
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  }
});

// Upload rate limiter (for CSV uploads)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute per user
  
  store: (redisClient && RedisStore) ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  
  message: {
    success: false,
    message: 'Too many file uploads. Please wait before uploading more files.',
    retryAfter: 60
  },
  
  keyGenerator: (req) => req.user?.id || req.ip
});

// Webhook rate limiter (for external services)
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 webhook calls per 5 minutes
  
  store: (redisClient && RedisStore) ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }) : undefined,
  
  message: {
    success: false,
    message: 'Webhook rate limit exceeded.',
    retryAfter: 300
  },
  
  keyGenerator: (req) => {
    // For webhooks, use a combination of IP and source identifier
    const source = req.headers['user-agent'] || 'unknown';
    return `webhook:${req.ip}:${source}`;
  }
});

// Custom rate limiter factory
const createCustomLimiter = (options) => {
  return rateLimit({
    store: (redisClient && RedisStore) ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }) : undefined,
    
    standardHeaders: true,
    legacyHeaders: false,
    
    keyGenerator: (req) => req.user?.id || req.ip,
    
    ...options
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  xeroLimiter,
  uploadLimiter,
  webhookLimiter,
  createCustomLimiter
};