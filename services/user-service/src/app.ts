import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { httpLogger, logger } from './config/logger';
import { prisma } from './lib/prisma';
import { AppError } from './types/shared.type';
import { profileRouter } from './modules/profile/profile.route';
import { userAdminRouter } from './modules/user/user.route';
import http from 'http';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(httpLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      db: 'UP',
    });
  } catch (error) {
    logger.error({ err: error }, 'Readiness check failed');
    res.status(503).json({
      status: 'NOT_READY',
      db: 'DOWN_OR_UNREACHABLE',
    });
  }
});

app.use('/api/users', profileRouter);
app.use('/api/users', userAdminRouter);

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled exception');

  const statusCode = err.status || 500;
  const errorTitle = http.STATUS_CODES[statusCode] || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      type: 'about:blank',
      title: errorTitle,
      status: statusCode,
      detail: err.message || 'Something went wrong',
      code: err.code || 'INTERNAL_ERROR',
      ...(err.errors && { errors: err.errors }),
    },
  });
});

export default app;
