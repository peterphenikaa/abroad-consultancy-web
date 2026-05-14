import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';

/**
 * 1. Define a Zod schema for environment variables, specifying types, default values, and validation rules. This ensures that all required environment variables are present and correctly formatted before the application starts.
 */
const envSchema = z.object({
  // Environment config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Auth config
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.string().transform(Number).default(30),

  // Cookie config
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // JWT config
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  JWT_KID: z.string().default('auth-service-key-v1'),

  // Email (SMTP) config
  // THÊM MỚI TỪ ĐÂY: Email (SMTP) config
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().transform(Number).default(587),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().default('Cambridge Platform <noreply@cambridge-platform.com>'),
});

/**
 * 2. Validate and parse environment variables. If validation fails, log errors and exit the process.
 * using console.error instaed of logger to avoid circular dependency since logger also depends on env variables
 */
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:');

  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });

  process.exit(1);
}

/**
 * 3. Function for reading file logic (Resolve Key)
 * Support @path/to/key and PEM rquired for JWT keys
 */
const resolveKey = (value: string, envName: string): string => {
  const trimmed = value.trim();

  // if start with @ -> handle as file path
  if (trimmed.startsWith('@')) {
    const rawPath = trimmed.slice(1); // remove the @
    const fullPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

    try {
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      if (!fileContent) {
        throw new Error(`File at ${fullPath} is empty`);
      }
      return fileContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file for ${envName}: ${message}`);
    }
  }

  // if pem
  return trimmed;
};

/**
 * 4. Validate PEM format for JWT keys. Ensure that the keys are in the correct PEM format, which is required for JWT signing and verification.
 */
const assertPEM = (value: string, envName: string, isPublic: boolean) => {
  const hasBegin = isPublic
    ? value.includes('BEGIN PUBLIC KEY')
    : value.includes('BEGIN RSA PRIVATE KEY');

  if (!hasBegin) {
    throw new Error(
      `${envName} must be in PEM format and include the appropriate BEGIN/END headers`,
    );
  }
};

const jwtPublicKey = resolveKey(_env.data.JWT_PUBLIC_KEY, 'JWT_PUBLIC_KEY');
const jwtPrivateKey = resolveKey(_env.data.JWT_PRIVATE_KEY, 'JWT_PRIVATE_KEY');

try {
  assertPEM(jwtPublicKey, 'JWT_PUBLIC_KEY', true);
  assertPEM(jwtPrivateKey, 'JWT_PRIVATE_KEY', false);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

export const env = {
  ..._env.data,
  JWT_PUBLIC_KEY: jwtPublicKey,
  JWT_PRIVATE_KEY: jwtPrivateKey,
} as const;
