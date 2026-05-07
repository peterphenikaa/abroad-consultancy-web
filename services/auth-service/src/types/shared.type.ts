export interface ClientContext {
  ip?: string;
  userAgent?: string;
  // NOTE: we can using this to pass UserId into serives
  // userId
}

export interface AppError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, any>;
}
