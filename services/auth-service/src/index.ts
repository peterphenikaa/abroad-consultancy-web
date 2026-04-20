import { env } from './config/env';
import app from './app';
import { logger } from './config/logger';
import { connectDB } from './lib/prisma';
import { checkRedis } from './lib/redis';

const PORT = env.PORT;

const startServer = async () => {
  try {
    logger.info(`Starting auth-service in ${env.NODE_ENV} mode`);

    // db wait
    await connectDB();

    // redis wait
    const isRedisConnected = await checkRedis();
    if (!isRedisConnected) {
      throw new Error('Redis connection lost');
    }

    const server = app.listen(PORT, () => {
      logger.info(`auth-service is running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Readiness check: http://localhost:${PORT}/ready`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
      });
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Error starting server');
    process.exit(1);
  }
};

startServer();
