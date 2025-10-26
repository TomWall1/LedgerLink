/**
 * CORS Middleware Configuration
 * Handles Cross-Origin Resource Sharing for Xero integration
 */

import cors from 'cors';

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      // Add production domains
      'https://ledgerlink.vercel.app',
      'https://your-production-domain.com'
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true, // Allow cookies and auth headers
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  
  exposedHeaders: [
    'Content-Length',
    'X-Kuma-Revision'
  ],
  
  maxAge: 86400, // 24 hours
  
  // Handle preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Development-only: Allow all origins in development
if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = true;
  console.log('CORS: Development mode - allowing all origins');
}

export default cors(corsOptions);
