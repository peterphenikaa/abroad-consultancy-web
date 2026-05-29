import { env } from './config/env';
import app from './app';
import { logger } from './config/logger';
import { connectDB } from './lib/prisma';

const PORT = env.PORT;

const startServer = async () => {
  try {
    logger.info(`Starting user-service in ${env.NODE_ENV} mode`);

    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`user-service is running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Readiness check: http://localhost:${PORT}/ready`);
    });

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
