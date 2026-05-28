import { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  orgId?: string;
  sessionId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId?: string;
  sessionId?: string;
  iss?: string;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
