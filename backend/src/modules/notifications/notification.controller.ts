import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { notificationService } from './notification.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class NotificationController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await notificationService.getUserNotifications(
      req.user.id,
      req.query as Record<string, unknown>,
    );
    sendSuccess(res, result, 'Notifications fetched');
  });

  static unreadCount = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const count = await notificationService.getUnreadCount(req.user.id);
    sendSuccess(res, { count }, 'Unread count fetched');
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await notificationService.markAsRead(req.user.id, req.params.id);
    sendNoContent(res);
  });

  static markAllRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await notificationService.markAllAsRead(req.user.id);
    sendNoContent(res);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await notificationService.deleteNotification(req.user.id, req.params.id);
    sendNoContent(res);
  });
}
