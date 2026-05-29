export interface ClientContext {
  ip?: string;
  userAgent?: string;
}

export interface AppError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, any>;
}
