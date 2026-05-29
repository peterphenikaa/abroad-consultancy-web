import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.util';
import { ProfileService } from './profile.service';
import { updateProfileSchema } from './profile.schema';
import z from 'zod';
import { AuthUser } from '../../types/express';

export class ProfileController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const userId = user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const userInfo = await ProfileService.getMe(userId);
      res.status(200).json({ success: true, data: userInfo });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const userId = user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        const flattenedErrors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(
          400,
          'Update Profile Validation Error',
          'VALIDATION_ERROR',
          flattenedErrors,
        );
      }

      const updatedUser = await ProfileService.updateMe(userId, parseResult.data);

      res.status(200).json({
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}
