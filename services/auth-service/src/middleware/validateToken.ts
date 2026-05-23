import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.util';
import { verifyAccessToken } from '../utils/jwt.util';
import { redisClient } from '../lib/redis';
import { Role } from '@prisma/client';
import { ROLE_PERMISSIONS } from '../constants/roles';
import { AuthUser } from '../types/express';
import { TokenExpiredError } from 'jsonwebtoken';

const BLACKLIST_PREFIX = 'auth:blacklist:';

export async function validateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header required', 'MISSING_TOKEN');
    }

    const token = authHeader.slice(7);

    // 2. Verify sign RSA256
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError(401, 'Access token expired', 'TOKEN_EXPIRED');
      }
      throw new ApiError(401, 'Invalid access token', 'INVALID_TOKEN');
    }

    // 3. Redis blacklist check
    const blacklistKey = `${BLACKLIST_PREFIX}${payload.sessionId}`;
    const isBlacklisted = await redisClient.get(blacklistKey);

    if (isBlacklisted) {
      throw new ApiError(401, 'Access token revoked', 'TOKEN_REVOKED');
    }

    // 4. Resolve permissions fron role
    const role = payload.role as Role;
    const permissions = ROLE_PERMISSIONS[role] ?? [];

    // 5. attach user info to req
    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role,
      orgId: payload.orgId,
      permissions,
      sessionId: payload.sessionId,
    };

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
}
