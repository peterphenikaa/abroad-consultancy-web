import type {
  LoginResponse,
  LoginCredentials,
  RegisterData,
  RegisterResponse,
  LogoutResponse,
  VerifyEmailData,
  VerifyEmailResponse,
  ForgotPasswordData,
  ForgotPasswordResponse,
  VerifyResetOtpData,
  VerifyResetOtpResponse,
  ResetPasswordResponse,
  ResetPasswordData,
} from "@/types/auth";
import apiClient, { setLocalAccessToken } from "./apiClient";

export const authService = {
  login: async (credential: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credential,
    );

    // if succ -> take the token
    const token = response.data?.access_token;
    if (token) {
      setLocalAccessToken(token);
    }

    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      user: response.data.user,
    };
  },

  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register",
      userData,
    );
    return response.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailData): Promise<VerifyEmailResponse> => {
    const response = await apiClient.post<VerifyEmailResponse>(
      "/auth/verify-email",
      data,
    );
    return response.data;
  },

  forgotPassword: async (
    data: ForgotPasswordData,
  ): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
    return response.data;
  },

  verifyResetOtp: async (
    data: VerifyResetOtpData,
  ): Promise<VerifyResetOtpResponse> => {
    const response = await apiClient.post<VerifyResetOtpResponse>(
      "/auth/reset-password/verify-otp",
      data,
    );

    return response.data;
  },

  resetPassword: async (
    data: ResetPasswordData,
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      data,
    );

    return response.data;
  },
};
