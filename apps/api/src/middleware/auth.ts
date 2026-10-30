import { Request, Response, NextFunction } from 'express';
import { TOKEN_COOKIE_NAME, verifyToken, TokenPayload } from '../lib/tokens';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[TOKEN_COOKIE_NAME];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired session token',
      },
    });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}
