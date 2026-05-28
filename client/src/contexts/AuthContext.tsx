import apiClient, {
  clearAccessToken,
  setLocalAccessToken,
} from "@/services/apiClient";
import { authService } from "@/services/authService";
import type {
  ForgotPasswordData,
  LoginCredentials,
  RefreshTokenResponse,
  RegisterData,
  ResetPasswordData,
  UserPayload,
  VerifyEmailData,
  VerifyResetOtpData,
} from "@/types/auth";
import { clearCourseQueryCache } from "@/lib/queryClient";
import { decodeJwtPayload, normalizeAccessToken } from "@/utils/jwt";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

function userFromJwt(token: string): UserPayload | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.sub) return null;
  return {
    id: String(payload.sub),
    email: String(payload.email ?? ""),
    permissions: (payload.permissions as UserPayload["permissions"]) ?? [],
    role: payload.role as UserPayload["role"],
  };
}

async function fetchUserFromApi(): Promise<UserPayload | null> {
  try {
    const res = await apiClient.get<{
      success?: boolean;
      data?: {
        id: string;
        email: string;
        role: UserPayload["role"];
      };
    }>("/auth/users/me");
    const data = res.data?.data;
    if (!data?.id) return null;
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      permissions: [],
    };
  } catch {
    return null;
  }
}

async function resolveSessionUser(
  accessToken: string,
  userFromResponse?: UserPayload,
): Promise<UserPayload | null> {
  if (userFromResponse?.id) return userFromResponse;
  const fromJwt = userFromJwt(accessToken);
  if (fromJwt) return fromJwt;
  return fetchUserFromApi();
}

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  verifyEmail: (data: VerifyEmailData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  verifyResetOtp: (data: VerifyResetOtpData) => Promise<string>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path === "/auth/success" || path.startsWith("/oauth/")) {
          setIsLoading(false);
          return;
        }
      }

      try {
        const res = await apiClient.post<RefreshTokenResponse>(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );
        const token = normalizeAccessToken(res.data?.access_token);
        if (!token) {
          clearAccessToken();
          return;
        }
        setLocalAccessToken(token);
        const sessionUser = await resolveSessionUser(token, res.data?.user);
        if (sessionUser) {
          clearCourseQueryCache();
          setUser(sessionUser);
        } else clearAccessToken();
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    clearAccessToken();
    clearCourseQueryCache();
    const res = await authService.login(credentials);
    if (res.user?.id) {
      setUser(res.user);
      return;
    }
    const token = normalizeAccessToken(res.access_token);
    if (token) {
      const sessionUser = await resolveSessionUser(token);
      if (sessionUser) setUser(sessionUser);
    }
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    setLocalAccessToken(token);
    const sessionUser = await resolveSessionUser(token);
    if (sessionUser) setUser(sessionUser);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      await authService.logout();
    } catch {
      /* no active session */
    } finally {
      clearAccessToken();
      setUser(null);
      clearCourseQueryCache();
    }
    const res = await authService.register(data);
    return { message: res.message };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
      clearCourseQueryCache();
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
        loginWithToken,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
