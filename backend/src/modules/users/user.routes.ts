import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleGuard';

const router = Router();

// ─── Admin-only routes ────────────────────────────────────────
router.get('/',           authenticate, requireAdmin, UserController.list);
router.post('/',          authenticate, requireAdmin, UserController.adminCreate);
router.get('/:id',        authenticate, requireAdmin, UserController.getById);
router.patch('/:id/toggle-active', authenticate, requireAdmin, UserController.toggleActive);
router.delete('/:id',     authenticate, requireAdmin, UserController.deleteUser);

// ─── Self-service routes ──────────────────────────────────────
router.put('/me/profile', authenticate, UserController.updateProfile);

export default router;
