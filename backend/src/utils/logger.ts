import winston from 'winston';
import { config } from '../config/config';

// Custom log format
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (config.server.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: customFormat,
    })
  );
}

// File transports for production
if (config.server.isProduction) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: customFormat,
      maxsize: parseInt(config.logging.maxSize.replace('m', '')) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
    })
  );
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: customFormat,
      maxsize: parseInt(config.logging.maxSize.replace('m', '')) * 1024 * 1024,
      maxFiles: config.logging.maxFiles,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  // Prevent duplicate logs in production
  exitOnError: false,
});

// Add request ID to logs
export const logWithRequestId = (requestId: string) => {
  return {
    info: (message: string, meta?: any) => logger.info(message, { requestId, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { requestId, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { requestId, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { requestId, ...meta }),
  };
};

// Log startup information
logger.info('Logger initialized', {
  level: config.logging.level,
  format: config.logging.format,
  environment: config.server.env,
});

export default logger;