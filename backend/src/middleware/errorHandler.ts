import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { sendError } from '../utils/apiResponse';
import { isProduction } from '../config/env';

// ─── Custom application error ─────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience subclasses
export class BadRequestError extends AppError {
  constructor(message: string) { super(message, 400); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super(message, 404); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}

// ─── 404 handler ─────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

// ─── Global error handler ─────────────────────────────────────

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Log all errors with context
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });

  // ── AppError (operational) ───────────────────────────────
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // ── JWT errors ────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    sendError(res, 'Access token has expired', 401);
    return;
  }
  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid access token', 401);
    return;
  }

  // ── Zod validation errors ─────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 400, errors);
    return;
  }

  // ── Prisma errors ─────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint
        sendError(res, `A record with this ${(err.meta?.target as string[])?.join(', ')} already exists`, 409);
        return;
      case 'P2025': // Record not found
        sendError(res, 'Record not found', 404);
        return;
      case 'P2003': // Foreign key constraint
        sendError(res, 'Referenced record does not exist', 400);
        return;
      case 'P2014': // Relation constraint
        sendError(res, 'Invalid relation in request', 400);
        return;
      default:
        sendError(res, 'Database error', 500);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Invalid data provided', 400);
    return;
  }

  // ── Multer errors ─────────────────────────────────────────
  if (err instanceof Error && err.message.startsWith('LIMIT_')) {
    sendError(res, 'File size exceeds limit', 413);
    return;
  }

  // ── Unknown errors ────────────────────────────────────────
  const message = isProduction
    ? 'An unexpected error occurred'
    : err instanceof Error
      ? err.message
      : 'Unknown error';

  sendError(res, message, 500);
};
