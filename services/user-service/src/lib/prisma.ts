import { Pool } from 'pg';
import { env } from '../config/env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV == 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prismaClient = prisma;

export const connectDB = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('[PostgreSQL] Connected successfully via Prisma adapter');
  } catch (error) {
    logger.error({ err: error }, '[PostgreSQL] Connection failed');
    throw error;
  }
};
