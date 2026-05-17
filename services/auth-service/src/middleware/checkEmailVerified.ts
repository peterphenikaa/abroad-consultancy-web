import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.util';
import { prismaClient } from '../lib/prisma';
import { AuthUser } from '../types/express';

export const checkEmailVerified = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Take user info from request(token), assuming it's added by previous auth middleware
    const userPayload = req.user as AuthUser;
    const userId = userPayload?.id;

    if (!userPayload || !userPayload.id) {
      throw new ApiError(
        401,
        'Unauthorized: User information is missing in the request',
        'UNAUTHORIZED',
      );
    }

    // 2. Query DB to check latest emailVerified status, avoid using stale data from token
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // 3. Verify email status
    if (!user.emailVerified) {
      throw new ApiError(
        403,
        'Your email is not verified. Please verify your email to access this resource.',
        'EMAIL_NOT_VERIFIED',
      );
    }

    // 4. Everything is good, proceed to next middleware or route handler
    next();
  } catch (error) {
    next(error);
  }
};
