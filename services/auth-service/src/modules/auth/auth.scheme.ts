import z from 'zod';

// Zod Schema for request validation
const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
});

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const verifyEmailSchema = z.object({
  email: z.email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 characters long')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

export { registerSchema, loginSchema };
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>;
