import { Role } from '@prisma/client';

export interface JwtPayLoad {
  sub: string;
  email: string;
  role: Role;
  orgId?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
