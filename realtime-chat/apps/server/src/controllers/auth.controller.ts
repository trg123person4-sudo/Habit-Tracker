import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '@realtime-chat/shared';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);

      setRefreshCookie(res, result.refreshToken);

      res.status(201).json({
        ok: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = {
        ...req.body,
        login: req.body.login || req.body.username,
      };
      const validated = loginSchema.parse(body);
      const result = await authService.login(validated);

      setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        ok: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!rawToken) {
        throw AppError.unauthorized('Refresh token cookie or payload missing');
      }

      const result = await authService.refresh(rawToken);

      setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        ok: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      clearRefreshCookie(res);
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await authService.logout(rawToken);

      clearRefreshCookie(res);

      res.status(200).json({
        ok: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Not authenticated');
      }

      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        ok: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
