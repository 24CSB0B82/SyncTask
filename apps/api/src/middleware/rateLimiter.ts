import rateLimit from 'express-rate-limit';
import { ENV } from '../env';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.NODE_ENV === 'test' ? 1000 : 5, // 5 requests per 15 min in prod/dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: ENV.NODE_ENV === 'test' ? 5000 : 120, // 120 req/min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please slow down.',
    },
  },
});
