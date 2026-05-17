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

// [Reset-1]
export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

// [Reset-2]
export const verifyResetTokenSchema = z.object({
  email: z.email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 characters long')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

// [Reset-3]
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export { registerSchema, loginSchema };

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;

// for email verification
export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>;

// for password reset
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetTokenDTO = z.infer<typeof verifyResetTokenSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
