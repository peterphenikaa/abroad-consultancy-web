import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthMiddlewareOptions, AuthUser, PublicPathRule } from '../types';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: ['read:own'],
  ADMIN: ['read:any', 'write:any'],
  SUPER_ADMIN: ['read:any', 'write:any', 'delete:any'],
};

function normalizePublicPaths(input?: (string | PublicPathRule)[]): PublicPathRule[] {
  return (input || []).map(r =>
    typeof r === 'string' ? { path: r, methods: ['GET'] } : r
  );
}

function isPublicPath(req: Request, rules: PublicPathRule[]): boolean {
  const method = req.method.toUpperCase();
  for (const rule of rules) {
    const allowedMethods = (rule.methods || ['GET']).map(m => m.toUpperCase());
    if (!allowedMethods.includes(method)) continue;
    if (req.path === rule.path || req.path.startsWith(rule.path + '/')) {
      return true;
    }
  }
  return false;
}

export function createAuthMiddleware(options?: AuthMiddlewareOptions) {
  const publicPaths = normalizePublicPaths(options?.publicPaths);
  const checkRedis = options?.checkRedis ?? true;

  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      if (isPublicPath(req, publicPaths)) {
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
      }
      const token = authHeader.slice(7);

      const payload = verifyToken(token);

      const role = (payload.role || 'USER').toUpperCase();
      const permissions = ROLE_PERMISSIONS[role] || [];

      req.user = {
        id: payload.sub,
        email: payload.email,
        role,
        orgId: payload.orgId,
        sessionId: payload.sessionId,
        permissions,
      };

      next();
    } catch (error: any) {
      const message = error.name === 'TokenExpiredError'
        ? 'Token expired'
        : 'Invalid token';
      res.status(401).json({ error: message });
    }
  };
}
