import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayLoad, JwtResetPayLoad } from '../types/auth.type';

/**
 * Sign Access Token with Priavate Key (RS256)
 */
export const signAccessToken = (payload: JwtPayLoad): string => {
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
    issuer: 'cambridge-api',
  };

  return jwt.sign(payload, env.JWT_PRIVATE_KEY, options);
};

/**
 * Sign Reset Passowrd Token with Priavate Key (RS256)
 */
export const signResetToken = (userId: string): string => {
  const options: SignOptions = {
    algorithm: 'RS256',
    expiresIn: `${env.RESET_PASSWORD_TOKEN_TTL_MINUTES}m`,
  };

  const payload: JwtResetPayLoad = {
    sub: userId,
    purpose: 'password_reset',
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

/**
 * Verify Reset Password Token using Public Key (RS256)
 */
export const verifyResetToken = (token: string): JwtResetPayLoad => {
  const options: jwt.VerifyOptions = {
    algorithms: ['RS256'],
  };

  const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, options) as JwtResetPayLoad;

  if (decoded.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }

  return decoded as JwtResetPayLoad;
};
