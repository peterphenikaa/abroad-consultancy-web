import { env } from './config/env';
import app from './app';
import { logger } from './config/logger';

const PORT = env.PORT;

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      // TODO: pino log
      logger.info(` Auth-service is running in ${env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`󰿶 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info(' HTTP server closed');
      });
    });
  } catch (error) {
    logger.fatal({ err: error }, ' Error starting server');
    process.exit(1);
  }
};

startServer();
