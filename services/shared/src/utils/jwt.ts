import jwt from 'jsonwebtoken';
import fs from 'fs';
import { JwtPayload } from '../types';

function readKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@')) {
    return fs.readFileSync(trimmed.slice(1), 'utf-8');
  }
  return trimmed;
}

export function verifyToken(token: string): JwtPayload {
  const raw = process.env.JWT_PUBLIC_KEY || '';
  if (!raw) {
    throw new Error('JWT_PUBLIC_KEY environment variable is not set');
  }
  const publicKey = readKey(raw);
  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  return decoded as JwtPayload;
}
