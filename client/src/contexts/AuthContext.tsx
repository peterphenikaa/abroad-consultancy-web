// Stores current user, isAuthenticated, isLoading globally
// On mount: calls POST /api/auth/refresh to restore session from HttpOnly cookie → decodes JWT → sets user
// Provides login, register, logout, verifyEmail, forgotPassword, verifyResetOtp, resetPassword methods Exports AuthProvider (component) and useAuth (hook)

import apiClient, {
  clearAccessToken,
  setLocalAccessToken,
} from "@/services/apiClient";
import { authService } from "@/services/authService";
import type {
  ForgotPasswordData,
  JwtPayLoad,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UserPayload,
  VerifyEmailData,
  VerifyResetOtpData,
} from "@/types/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ─── JWT decode (base64, no library) ──────────────────────────
function decodeJwtPayload(token: string): JwtPayLoad | null {
  try {
    const base64Url = token.split(".")[1];

    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayLoad = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayLoad) as JwtPayLoad;
  } catch (error) {
    console.error("[AuthContext] Failed to decode JWT payload:", error);
    return null;
  }
}

function extractUserFromToken(token: string): UserPayload | null {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    permissions: payload.permissions,
    role: payload.role,
  };
}

// ─── Context shape ────────────────────────────────────────────

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  verifyResetOtp: (data: VerifyResetOtpData) => Promise<string>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

let refreshAttemptedOnce = false;

// ─── Provider ────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (refreshAttemptedOnce) return;
    refreshAttemptedOnce = true;

    // IIFE to run async code in useEffect
    (async () => {
      try {
        const res = await apiClient.post<{ access_token: string }>(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const token = res.data.access_token;
        setLocalAccessToken(token);
        const decoded = extractUserFromToken(token);
        if (decoded) setUser(decoded);
      } catch (error) {
        clearAccessToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // login
  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await authService.login(credentials);
    setUser(res.user);
  }, []);

  // register
  const register = useCallback(async (data: RegisterData) => {
    const res = await authService.register(data);
    return { message: res.message };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const verifyEmail = useCallback(async (data: VerifyEmailData) => {
    await authService.verifyEmail(data);
  }, []);

  const forgotPassword = useCallback(async (data: ForgotPasswordData) => {
    await authService.forgotPassword(data);
  }, []);

  const verifyResetOtp = useCallback(async (data: VerifyResetOtpData) => {
    const res = await authService.verifyResetOtp(data);
    return res.resetToken;
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    await authService.resetPassword(data);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
