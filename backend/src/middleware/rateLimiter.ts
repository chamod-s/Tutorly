import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendTooManyRequests } from '../utils/apiResponse';
import { Request, Response } from 'express';

// ─── General API rate limiter ─────────────────────────────────

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => sendTooManyRequests(res),
  skip: (req) => req.ip === '127.0.0.1' && env.NODE_ENV === 'development',
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
});

// ─── PayHere webhook — no limit (server-to-server) ───────────

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => sendTooManyRequests(res),
});
