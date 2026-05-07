import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger, logger } from './config/logger';
import { prismaClient } from './lib/prisma';
import { checkRedis } from './lib/redis';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.route';
import http from 'http';
import { AppError } from './types/shared.type';

const app = express();

// 1. Global Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(httpLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Readiness endpoint
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // 1. DB check
    await prismaClient.$queryRaw`SELECT 1`;

    // 2. Redis check
    const isRedisUp = await checkRedis();
    if (!isRedisUp) throw new Error('Redis connection loss');

    // return 200 if both are alive
    res.status(200).json({
      status: 'READY',
      db: 'UP',
      redis: 'UP',
    });
  } catch (error) {
    logger.error({ err: error }, 'Readiness check failed');
    res.status(503).json({
      status: 'NOT_READY',
      db: 'DOWN_OR_UNREACHABLE',
      redis: 'DOWN_OR_UNREACHABLE',
    });
  }
});

// Auth route
app.use('/api/auth', authRouter);

// Global Error handler
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled exception');

  const statusCode = err.status || 500;

  const errorTitile = http.STATUS_CODES[statusCode] || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      type: 'about:blank',
      title: errorTitile,
      status: statusCode,
      detail: err.message || 'Something went wrong',
      code: err.code || 'INTERNAL_ERROR',
      ...(err.errors && { errors: err.errors }),
    },
  });
});

export default app;
