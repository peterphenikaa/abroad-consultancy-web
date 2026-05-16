import { Router } from 'express';
import { validateToken } from '../../middleware/validateToken';
import { UserController } from './user.controller';
import { checkPermission } from '../../middleware/checkPermission';
import { Role } from '@prisma/client';

const userRouter = Router();

// all user route need to be protected by auth middleware, so we will apply auth middleware in app.ts
userRouter.use(validateToken);

// [PROFILE-1] Get profile of logged user
userRouter.get('/me', UserController.getMe);

// [PROFILE-2] Update profile of logged user
userRouter.patch('/me', UserController.updateMe);

// [PROFILE-3] Take infomation of other user by id (for admin user)
userRouter.get(
  '/:userId',
  checkPermission({ roles: [Role.SUPER_ADMIN] }),
  UserController.getUserById,
);
