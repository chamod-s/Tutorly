import prisma from '../../config/database';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

export class NotificationService {
  // ── Create notification ────────────────────────────────────

  async create(data: {
    userId: string;
    type: 'ENROLLMENT' | 'PAYMENT' | 'STREAM_START' | 'COURSE_UPDATE' | 'MESSAGE' | 'SYSTEM' | 'SUBSCRIPTION_EXPIRY';
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) {
    return prisma.notification.create({
      data: {
        userId:  data.userId,
        type:    data.type,
        title:   data.title,
        body:    data.body,
        // Prisma v5: Use `as any` to bypass strict IDE inference issues on overloaded methods
        payload: data.payload as any,
      },
    });
  }

  // ── Bulk create (broadcast to multiple users) ──────────────

  async broadcast(
    userIds: string[],
    data: Omit<Parameters<NotificationService['create']>[0], 'userId'>,
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      type:    data.type,
      title:   data.title,
      body:    data.body,
      // Prisma v5: Use `as any` to bypass strict IDE inference issues on overloaded methods
      payload: data.payload as any,
    }));

    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  }

  // ── Get user notifications ─────────────────────────────────

  async getUserNotifications(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { unread } = query as { unread?: string };

    const where = {
      userId,
      ...(unread === 'true' && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  // ── Mark as read ───────────────────────────────────────────

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // ── Mark all as read ───────────────────────────────────────

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ── Delete notification ────────────────────────────────────

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  // ── Unread count ───────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }
}

export const notificationService = new NotificationService();
