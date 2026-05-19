import { Role } from '@prisma/client';

// Augment Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        firstName: string;
        lastName: string;
        avatar: string | null;
      };
    }
  }
}

export {};
