import { ERROR_CODES } from '@realtime-chat/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, ERROR_CODES.BAD_REQUEST, message, details);
  }

  static unauthorized(message = 'Unauthorized', details?: unknown) {
    return new AppError(401, ERROR_CODES.UNAUTHORIZED, message, details);
  }

  static forbidden(message = 'Forbidden', details?: unknown) {
    return new AppError(403, ERROR_CODES.FORBIDDEN, message, details);
  }

  static notFound(message = 'Resource not found', details?: unknown) {
    return new AppError(404, ERROR_CODES.NOT_FOUND, message, details);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(409, ERROR_CODES.CONFLICT, message, details);
  }

  static rateLimited(message = 'Too many requests, please try again later', details?: unknown) {
    return new AppError(429, ERROR_CODES.RATE_LIMITED, message, details);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new AppError(500, ERROR_CODES.INTERNAL_ERROR, message, details, false);
  }
}
