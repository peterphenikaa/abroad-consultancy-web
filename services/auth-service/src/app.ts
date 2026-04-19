import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger, logger } from './config/logger';
import { prisma } from './lib/prisma';
import { checkRedis } from './lib/redis';

const app = express();

interface AppError extends Error {
  status?: number;
  code?: string;
}

// 1. Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(httpLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Readliness endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // 1. DB check
    await prisma.$queryRaw`SELECT 1`;

    // 2. Redis check
    const isRedisUp = await checkRedis();
    if (!isRedisUp) throw new Error('Redis connection loss');

    // reutrn 200 if both alive
    res.status(200).json({
      status: 'READY',
      db: 'UP',
      redis: 'UP',
    });
  } catch (error) {
    logger.error({ err: error }, 'Readliness check failed');
  }
});

// Global Error handler
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandle Exception');

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: statusCode,
      detail: err.message || 'Something went wrong',
      code: err.code || 'INTERNAL_ERROR',
    },
  });
});

export default app;
