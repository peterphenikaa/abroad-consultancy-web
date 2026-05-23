import { Role } from '@prisma/client';
import { PermissionType } from '../constants/permission.constant';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  orgId?: string;
  permissions: PermissionType[];
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
