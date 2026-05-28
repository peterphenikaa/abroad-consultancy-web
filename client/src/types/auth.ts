// ─── Request Types ─────────────────────────────────────────────

import type { Role } from "@/constants/auth.constants";
import type { PermissionType } from "@/constants/permission.constant";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  otp: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyResetOtpData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// ─── Response Types ─────────────────────────────────────────────

export interface UserPayload {
  id: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "CONTENT_CREATOR" | "ORG_ADMIN" | "SUPER_ADMIN";
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: UserPayload;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetOtpResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
}
// ─── Error Shape ─────────────────────────────────────────────

export interface ApiErrorPayload {
  error: {
    type: string;
    title: string;
    status: number;
    detail: string;
    code: string;
    errors?: Record<string, unknown>;
  };
}

// ─── Jwt ─────────────────────────────────────────────

export interface JwtPayLoad {
  sub: string;
  email: string;
  role: Role;
  orgId?: string;
  sessionId: string;
  permissions: PermissionType[];
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface JwtResetPayLoad {
  sub: string;
  purpose: "password_reset";
}
