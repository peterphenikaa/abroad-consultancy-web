import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  orgId?: string;
  sessionId: string;
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId?: string;
  sessionId: string;
  permissions: string[];
  iss?: string;
}

export interface PublicPathRule {
  path: string;
  methods?: string[];
  exact?: boolean;
  regex?: string;
}

export interface AuthMiddlewareOptions {
  publicPaths?: (string | PublicPathRule)[];
  checkRedis?: boolean;
  redisUrl?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
