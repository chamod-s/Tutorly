import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload, TokenPair } from '../types';
import { Role } from '@prisma/client';

// ─── Sign tokens ──────────────────────────────────────────────

export const signAccessToken = (
  userId: string,
  email: string,
  role: Role,
): string => {
  return jwt.sign(
    { sub: userId, email, role } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as string } as jwt.SignOptions,
  );
};

export const signRefreshToken = (
  userId: string,
  email: string,
  role: Role,
): string => {
  return jwt.sign(
    { sub: userId, email, role } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as string } as jwt.SignOptions,
  );
};

export const generateTokenPair = (
  userId: string,
  email: string,
  role: Role,
): TokenPair => ({
  accessToken: signAccessToken(userId, email, role),
  refreshToken: signRefreshToken(userId, email, role),
});

// ─── Verify tokens ────────────────────────────────────────────

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

// ─── Decode without verification (for logging only) ───────────

export const decodeToken = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};

// ─── Calculate refresh token expiry date ─────────────────────

export const getRefreshTokenExpiry = (): Date => {
  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
