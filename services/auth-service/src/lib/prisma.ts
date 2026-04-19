import { Pool } from 'pg';
import { env } from '../config/env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// 1. init conneciton pool form
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// 2. create Prisma adapter
const adapter = new PrismaPg(pool);

// 3. init Prisma clietn with adapter
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV == 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const connectDB = async () => {
  try {
    // test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('[PostgreSQL] Connected succesfully via Prisma Adapter');
  } catch (error) {
    console.error('[PostgreSQL] connection failed', error);
    process.exit(1);
  }
};
