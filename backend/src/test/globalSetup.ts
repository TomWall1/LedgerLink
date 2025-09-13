import { execSync } from 'child_process';
import { config } from '../config/config';

export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = config.database.url.replace('ledgerlink_dev', 'ledgerlink_test');
  
  try {
    // Create test database if it doesn't exist
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    process.exit(1);
  }
}