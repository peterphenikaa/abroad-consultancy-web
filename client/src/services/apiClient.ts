import axios, { type InternalAxiosRequestConfig } from "axios";
import type { RefreshTokenResponse } from "../types/auth";

let _accessToken: string | null = null;

export const setLocalAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getLocalAccessToken = () => _accessToken;

export const clearAccessToken = () => {
  _accessToken = null;
};

interface PromiseQueue {
  resolve: (value?: string | null) => void;
  reject: (reason?: any) => void;
}

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (_accessToken && config.headers) {
      // Cách viết tương thích tốt nhất với các bản Axios mới
      config.headers["Authorization"] = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: PromiseQueue[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string | null | undefined>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<RefreshTokenResponse>(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const newAccessToken = response.data.access_token;
        setLocalAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();

        // Chuyển hướng an toàn, dọn sạch trạng thái Client
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
