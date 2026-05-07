import { Pool } from 'pg';
import { env } from '../config/env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

// 1. init conneciton pool form
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// 2. create Prisma adapter
const adapter = new PrismaPg(pool);

// 3. init Prisma client with adapter
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV == 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Backward-compatible alias
export const prismaClient = prisma;

export const connectDB = async () => {
  try {
    // test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('[PostgreSQL] Connected successfully via Prisma adapter');
  } catch (error) {
    logger.error({ err: error }, '[PostgreSQL] Connection failed');
    throw error;
  }
};
