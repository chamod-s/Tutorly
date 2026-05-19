import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendUnauthorized } from '../utils/apiResponse';
import { logger } from '../config/logger';
import prisma from '../config/database';

// ─── JWT Auth middleware ───────────────────────────────────────
//
//  Validates the Bearer token in Authorization header and attaches
//  the decoded user to req.user for downstream middleware/controllers.

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Missing or invalid Authorization header');
      return;
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      sendUnauthorized(res, 'Invalid or expired access token');
      return;
    }

    // Fetch fresh user from DB to pick up role changes / deactivation
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    if (!user.isActive) {
      sendUnauthorized(res, 'Account has been deactivated');
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    next(error);
  }
};

// ─── Optional auth (no error if missing) ─────────────────────

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
      },
    });

    if (user?.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };
    }
  } catch {
    // Silently ignore invalid tokens in optional mode
  }

  next();
};
