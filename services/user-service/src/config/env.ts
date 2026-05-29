import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3002),
  DATABASE_URL: z.string(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  JWT_PUBLIC_KEY: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:');

  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });

  process.exit(1);
}

const resolveKey = (value: string, envName: string): string => {
  const trimmed = value.trim();
  if (trimmed.startsWith('@')) {
    const rawPath = trimmed.slice(1);
    const fullPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      if (!fileContent) throw new Error(`File at ${fullPath} is empty`);
      return fileContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file for ${envName}: ${message}`);
    }
  }
  return trimmed;
};

const jwtPublicKey = resolveKey(_env.data.JWT_PUBLIC_KEY, 'JWT_PUBLIC_KEY');

const assertPEM = (value: string, envName: string) => {
  if (!value.includes('BEGIN PUBLIC KEY')) {
    throw new Error(`${envName} must be in PEM format with BEGIN/END headers`);
  }
};

try {
  assertPEM(jwtPublicKey, 'JWT_PUBLIC_KEY');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

export const env = {
  ..._env.data,
  JWT_PUBLIC_KEY: jwtPublicKey,
} as const;
