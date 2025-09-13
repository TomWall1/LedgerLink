import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from './config';

// Prisma Client singleton
class DatabaseClient {
  private static instance: PrismaClient;
  
  private constructor() {}
  
  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: config.server.isDevelopment 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
        datasources: {
          db: {
            url: config.database.url,
          },
        },
      });
      
      // Graceful shutdown
      process.on('beforeExit', async () => {
        logger.info('Disconnecting from database...');
        await DatabaseClient.instance.$disconnect();
      });
    }
    
    return DatabaseClient.instance;
  }
}

export const prisma = DatabaseClient.getInstance();

// Database connection function
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Database middleware for logging
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (config.server.isDevelopment) {
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  }
  
  return result;
});

export default prisma;