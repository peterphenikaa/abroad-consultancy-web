import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.util';
import { UserService } from './user.service';
import { updateProfileSchema } from './user.schema';
import z from 'zod';
import { AuthUser } from '../../types/express';

export class UserController {
  /**
   * [PROFILE-1] Get profile of logged user
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const userId = user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const userInfo = await UserService.getMe(userId);
      res.status(200).json({ success: true, data: userInfo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PROFILE-2] Update profile of logged user
   */
  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const userId = user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      // 1. validate request body with zod schema
      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        const flattenedErroes = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(
          400,
          'Update Profile Validation Error',
          'VALIDATION_ERROR',
          flattenedErroes,
        );
      }

      // 2. calling service for updating
      const updatedUser = UserService.updateMe(userId, parseResult.data);

      res.status(200).json({
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PROFILE-3] Take infomation of other user by id (for admin user)
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await UserService.getUserById(userId as string);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
