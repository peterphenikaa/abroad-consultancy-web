import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.util';
import { UserService } from './user.service';
import { AuthUser } from '../../types/express';

export class UserController {
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const user = await UserService.getUserById(userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role, status } = req.query;
      const result = await UserService.listUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        role: role as string,
        status: status as string,
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async syncUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, email, role, status } = req.body;
      if (!id || !email) {
        throw new ApiError(400, 'id and email are required', 'VALIDATION_ERROR');
      }
      const user = await UserService.syncUser({ id, email, role, status });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
