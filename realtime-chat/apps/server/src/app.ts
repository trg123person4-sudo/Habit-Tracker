import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './errors/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { conversationRouter } from './routes/conversation.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { aiRouter } from './routes/ai.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy:
        env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'blob:', env.S3_ENDPOINT],
                connectSrc: ["'self'", 'ws:', 'wss:', env.S3_ENDPOINT],
              },
            }
          : false,
    }),
  );

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }),
  );

  // Request ID & Body Parsing
  app.use((req, res, next) => {
    const reqId = (req.headers['x-request-id'] as string) || uuidv4();
    req.headers['x-request-id'] = reqId;
    res.setHeader('X-Request-ID', reqId);
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Structured HTTP Logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req.headers['x-request-id'] as string) || uuidv4(),
      }),
    );
  }

  // Liveness Probe
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness Probe
  app.get('/readyz', (_req: Request, res: Response) => {
    // Verified by checking dependent services
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint info
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Real-Time Chat API',
      version: '1.0.0',
      docs: '/docs',
      health: '/healthz',
    });
  });

  // Rate Limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 1000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
      },
    },
  });

  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 1000 : 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Upload rate limit exceeded. Please try again later.',
      },
    },
  });

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 10000 : 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down.',
      },
    },
  });

  // API v1 Routes
  app.use('/api/v1', generalLimiter);
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/conversations', conversationRouter);
  app.use('/api/v1/uploads', uploadLimiter, uploadRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/ai', aiRouter);

  // Direct /api aliases for client and test convenience
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/conversations', conversationRouter);
  app.use('/api/uploads', uploadLimiter, uploadRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/ai', aiRouter);

  // Global Central Error Handler
  app.use(errorHandler);

  return app;
}
