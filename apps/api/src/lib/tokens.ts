import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { ENV } from '../env';

export const TOKEN_COOKIE_NAME = 'st-token';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'synctask-api',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET, {
      issuer: 'synctask-api',
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(TOKEN_COOKIE_NAME, token, authCookieOptions);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    ...authCookieOptions,
    maxAge: 0,
  });
}
