import bcrypt from 'bcrypt';
import { env } from '../config/env';
import crypto from 'crypto';

/**
 * Hash password using bcrypt before saving to database
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

/**
 * Verify password by comparing the plain text password with the hashed password stored in the database
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate random token (Opaque token) for Refresh Token
 */
export const generateOpaqueToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash the Opaque Token (SHA-256) before storing in the database for security reasons
 */
export const hashOpaqueToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
