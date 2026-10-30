import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './env';
import { authRouter, getMeHandler } from './routes/auth';
import { syncRouter } from './routes/sync';
import { requireAuth } from './middleware/auth';
import { apiLimiter } from './middleware/rateLimiter';

export const app = express();

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", ENV.WEB_ORIGIN],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(
  cors({
    origin: ENV.WEB_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Authentication routes
app.use('/api/auth', authRouter);
app.get('/api/me', requireAuth, getMeHandler);

// Synchronization routes
app.use('/api/sync', syncRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
