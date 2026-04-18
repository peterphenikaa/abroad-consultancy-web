import { env } from './config/env';
import { log } from 'node:console';
import app from './app';

const PORT = env.PORT;

const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      // TODO: pino log
      console.log(` Auth-service is running in ${env.NODE_ENV} mode on port ${PORT}`);
      console.log(`󰿶 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        log(' HTTP server closed');
      });
    });
  } catch (error) {
    console.error(' Error starting server', error);
    process.exit(1);
  }
};

startServer();
