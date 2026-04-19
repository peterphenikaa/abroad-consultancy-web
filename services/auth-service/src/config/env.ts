import 'dotenv/config';
import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error(' Ivalid enviroment variables:');

  _env.error.issues.forEach((issue) => {
    logger.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });

  process.exit(1);
}

export const env = _env.data;
