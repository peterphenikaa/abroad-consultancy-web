import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId?: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export const verifyAccessToken = (token: string): JwtPayload => {
  const options: jwt.VerifyOptions = {
    algorithms: ['RS256'],
  };

  const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, options);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as JwtPayload;
};
