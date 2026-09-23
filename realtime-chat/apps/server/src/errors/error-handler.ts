import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ERROR_CODES } from '@realtime-chat/shared';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  // 1. Operational AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, reqId: req.headers['x-request-id'] }, err.message);
    }
    return res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
  }

  // 3. Unhandled / Programmer Error
  logger.error({ err, reqId: req.headers['x-request-id'] }, 'Unhandled Exception');

  return res.status(500).json({
    ok: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
      details: env.NODE_ENV !== 'production' && err instanceof Error ? err.stack : undefined,
    },
  });
}
