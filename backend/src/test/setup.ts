import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Mock logger in tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Clean up database after each test
afterEach(async () => {
  // Clean up test data
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  );
  
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');
  
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});