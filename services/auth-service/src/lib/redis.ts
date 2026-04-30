import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 *  1. Init Redis client singleton
 *  - retry / backoff configuration
 */
export const redisClient = new Redis(env.REDIS_URL, {
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
redisClient.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redisClient.on('error', (err) => {
  logger.error({ err }, '[Redis] Connection error');
});

/**
 * 2. Helper checkRedis() (Liveness/Readiness Probe)
 */
export const checkRedis = async (): Promise<boolean> => {
  try {
    const res = await redisClient.ping();
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
  BLACKLIST: 'auth:refresh:blacklist:',
} as const;
