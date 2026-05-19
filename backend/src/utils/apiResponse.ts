import { Response } from 'express';
import type { ApiResponse, PaginationMeta, ValidationError } from '../types';

// ─── Success responses ────────────────────────────────────────

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
): Response => {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully',
): Response => sendSuccess(res, data, message, 201);

export const sendNoContent = (res: Response): Response =>
  res.status(204).send();

// ─── Error responses ─────────────────────────────────────────

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: ValidationError[],
): Response => {
  const response: ApiResponse = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const sendBadRequest = (
  res: Response,
  message: string,
  errors?: ValidationError[],
): Response => sendError(res, message, 400, errors);

export const sendUnauthorized = (res: Response, message = 'Unauthorized'): Response =>
  sendError(res, message, 401);

export const sendForbidden = (res: Response, message = 'Forbidden'): Response =>
  sendError(res, message, 403);

export const sendNotFound = (res: Response, message = 'Resource not found'): Response =>
  sendError(res, message, 404);

export const sendConflict = (res: Response, message: string): Response =>
  sendError(res, message, 409);

export const sendTooManyRequests = (res: Response): Response =>
  sendError(res, 'Too many requests. Please try again later.', 429);

// ─── Pagination helper ────────────────────────────────────────

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const parsePagination = (
  query: Record<string, unknown>,
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
