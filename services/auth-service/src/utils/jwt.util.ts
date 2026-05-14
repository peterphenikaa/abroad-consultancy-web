import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayLoad } from '../types/auth.type';

/**
 * Sign Access Token with Priavate Key (RS256)
 */
export const signAccessToken = (payload: JwtPayLoad): string => {
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'], // e.g., '15m' for 15 minutes
  };

  return jwt.sign(payload, env.JWT_PRIVATE_KEY, options);
};

/**
 * Verify Access Token using Public Key (RS256)
 */
export const verifyAccessToken = (token: string): JwtPayLoad => {
  // auto throws if invalid or expired
  const options: jwt.VerifyOptions = {
    algorithms: ['RS256'],
  } as jwt.VerifyOptions;

  const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, options);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as JwtPayLoad;
};
