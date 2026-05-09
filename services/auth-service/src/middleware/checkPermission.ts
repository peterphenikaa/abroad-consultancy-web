import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api-error.util';
import { ROLE_HIERARCHY } from '../constants/roles';

type PermissionCheck =
  | { roles: Role[] }
  | { permission: string }
  | { roles: Role[]; permission: string };

export function checkPermission(check: PermissionCheck) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      // validateToken
      if (!user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      // Super admin bypass
      if (user.role === Role.SUPER_ADMIN) {
        next();
        return;
      }

      // role check
      if ('roles' in check && check.roles.length > 0) {
        const hasRole = check.roles.some(
          (requiredRole) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole],
        );
        if (!hasRole) {
          throw new ApiError(
            403,
            `Required role: ${check.roles.join(' or ')}`,
            'INSUFFICIENT_ROLE',
          );
        }
      }

      // permission check
      if ('permission' in check && check.permission) {
        const hasPermission =
          user.permissions.includes('*') || user.permissions.includes(check.permission);
        if (!hasPermission) {
          throw new ApiError(
            403,
            `Required permission: ${check.permission}`,
            'INSUFFICIENT_PERMISSION',
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
