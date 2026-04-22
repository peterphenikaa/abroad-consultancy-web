import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 *  1. Init Redis client singleton
 *  - retry / backoff configuration
 */
export const redis = new Redis(env.REDIS_URL, {
  // no retry limit
  maxRetriesPerRequest: null,

  // Exponential Backoff: increase waiting time in each retry connection
  retryStrategy(times) {
    //
    const delay = Math.min(times * 500, 3000);
    logger.warn(`[Redis] Disconnect. Retry in ${delay}ms... (Attemp ${times})`);
    return delay;
  },
});

// Listen for event -> logger
redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', () => {
  logger.error('[Redis] Connection error');
});

/**
 * 2. Helper checkRedis() (Liveness/Readiness Probe)
 */
export const checkRedis = async (): Promise<boolean> => {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch (error) {
    logger.error({ err: error }, '[Redis] Ping failed ');
    return false;
  }
};

/**
 * 3. Chuẩn hóa Key Naming Convention
 * Giúp cô lập dữ liệu của auth-service, tránh đụng độ trên Redis Server chung
 */
export const REDIS_KEYS = {
  SESSION: 'auth:session:',
  RATELIMIT: 'auth:ratelimit:',
} as const;

// redis connectionk
export const connectRedis = () => {};
