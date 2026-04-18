import pino from 'pino';
import { env } from './env';
import { pinoHttp } from 'pino-http';

// 1. core logger
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'auth-service' },
});

// 2. HTTP Logger Middleware: Using to attach to Express
export const httpLogger = pinoHttp({
  logger,

  // format serializer custom
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});
