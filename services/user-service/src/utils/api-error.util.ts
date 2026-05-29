import { AppError } from '../types/shared.type';

export class ApiError extends Error implements AppError {
  public status: number;
  public code?: string;
  public errors?: Record<string, any>;

  constructor(status: number, message: string, code?: string, errors?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
