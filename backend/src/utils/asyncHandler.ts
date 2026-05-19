import { Request, Response, NextFunction, RequestHandler } from 'express';

// ─── Async handler wrapper ────────────────────────────────────
//
//  Wraps any async route handler so you never need try/catch in
//  controllers — errors are forwarded to the global error handler.

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
