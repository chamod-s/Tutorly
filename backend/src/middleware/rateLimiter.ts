import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendTooManyRequests } from '../utils/apiResponse';
import { Request, Response } from 'express';

const shouldSkipRateLimit = (req: Request): boolean => {
  // Always skip rate limiting in development mode
  if (env.NODE_ENV === 'development') return true;

  // Skip loopback / localhost IPs (e.g. ::1 or ::ffff:127.0.0.1)
  const ip = req.ip || '';
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }

  // Skip critical auth routes to ensure login is always accessible
  const path = req.originalUrl || req.path || '';
  if (
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/verify-account')
  ) {
    return true;
  }

  return false;
};

// ─── General API rate limiter ─────────────────────────────────

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => sendTooManyRequests(res),
  skip: shouldSkipRateLimit,
});

// ─── Strict limiter for auth routes ──────────────────────────

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => sendTooManyRequests(res),
  message: 'Too many authentication attempts. Please wait 15 minutes.',
  keyGenerator: (req) => req.ip ?? 'unknown',
  skip: shouldSkipRateLimit,
});

// ─── PayHere webhook — no limit (server-to-server) ───────────

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => sendTooManyRequests(res),
});
