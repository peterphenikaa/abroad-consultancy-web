import { Role } from '@prisma/client';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  orgId?: string;
  permissions: string[];
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
