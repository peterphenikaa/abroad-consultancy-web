import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.util';
import { verifyAccessToken } from '../utils/jwt.util';
import { AuthUser } from '../types/express';
import { TokenExpiredError } from 'jsonwebtoken';

export async function validateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header required', 'MISSING_TOKEN');
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ApiError(401, 'Access token expired', 'TOKEN_EXPIRED');
      }
      throw new ApiError(401, 'Invalid access token', 'INVALID_TOKEN');
    }

    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }
      if (roles.length > 0 && !roles.includes(user.role)) {
        throw new ApiError(403, `Required role: ${roles.join(' or ')}`, 'INSUFFICIENT_ROLE');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
