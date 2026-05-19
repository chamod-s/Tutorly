import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/',              authenticate, NotificationController.list);
router.get('/unread-count',  authenticate, NotificationController.unreadCount);
router.patch('/read-all',    authenticate, NotificationController.markAllRead);
router.patch('/:id/read',    authenticate, NotificationController.markRead);
router.delete('/:id',        authenticate, NotificationController.delete);

export default router;
