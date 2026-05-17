import { Role } from '@prisma/client';
import { PermissionType } from '../constants/permission.constant';

export interface JwtPayLoad {
  sub: string;
  email: string;
  role: Role;
  orgId?: string;
  sessionId: string;
  permissions: PermissionType[];
  iat?: number;
  exp?: number;
}

export interface JwtResetPayLoad {
  sub: string;
  purpose: 'password_reset';
}
