import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendForbidden, sendUnauthorized } from '../utils/apiResponse';

// ─── Role guard middleware factory ────────────────────────────
//
//  Usage:
//    router.get('/admin', authenticate, requireRole(Role.ADMIN), handler)
//    router.get('/teachers', authenticate, requireRole([Role.TEACHER, Role.ADMIN]), handler)

export const requireRole = (
  roles: Role | Role[],
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendForbidden(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      );
      return;
    }

    next();
  };
};

// ─── Convenient shorthand guards ─────────────────────────────

export const requireAdmin = requireRole(Role.ADMIN);

export const requireTeacher = requireRole([Role.TEACHER, Role.ADMIN]);

export const requireStudent = requireRole([Role.STUDENT, Role.ADMIN]);

// ─── Owner or admin guard ─────────────────────────────────────
//
//  Ensures the user is either the resource owner OR an admin.
//  Usage: router.delete('/:id', authenticate, requireOwnerOrAdmin(req => req.params.id))

export const requireOwnerOrAdmin = (
  getUserId: (req: Request) => string,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    const resourceOwnerId = getUserId(req);

    if (req.user.role === Role.ADMIN || req.user.id === resourceOwnerId) {
      next();
      return;
    }

    sendForbidden(res, 'You do not have permission to access this resource');
  };
};
