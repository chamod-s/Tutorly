import { Server, Socket } from 'socket.io';
import { streamService } from '../modules/streams/stream.service';
import { logger } from '../config/logger';

// ─── Notification & stream event handler ──────────────────────

export const registerNotificationHandlers = (io: Server, socket: Socket): void => {
  const userId = (socket.data as { userId: string }).userId;

  // ── Subscribe to personal notifications ───────────────────
  socket.on('notifications:subscribe', () => {
    socket.join(`user:${userId}`);
    logger.debug('User subscribed to notifications', { userId });
  });

  // ── Join a live stream room ────────────────────────────────
  socket.on('stream:join', async (streamId: string) => {
    try {
      const stream = await streamService.getStreamById(streamId);

      if (stream.status === 'ENDED' || stream.status === 'CANCELLED') {
        socket.emit('error', { message: 'Stream has ended' });
        return;
      }

      socket.join(`stream:${streamId}`);
      await streamService.updateViewerCount(streamId, 1);

      const viewerCount = io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size ?? 1;
      io.to(`stream:${streamId}`).emit('stream:viewer_count', { viewerCount });

      socket.emit('stream:joined', { stream });
      logger.debug('User joined stream', { userId, streamId });
    } catch (err) {
      logger.error('stream:join error', { err });
      socket.emit('error', { message: 'Failed to join stream' });
    }
  });

  // ── Leave a stream room ────────────────────────────────────
  socket.on('stream:leave', async (streamId: string) => {
    socket.leave(`stream:${streamId}`);
    await streamService.updateViewerCount(streamId, -1).catch(() => {});

    const viewerCount = io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size ?? 0;
    io.to(`stream:${streamId}`).emit('stream:viewer_count', { viewerCount });
  });

  // ── Teacher broadcasts stream status change ────────────────
  socket.on(
    'stream:status_update',
    (data: { streamId: string; status: string; hlsUrl?: string }) => {
      io.to(`stream:${data.streamId}`).emit('stream:status_changed', data);
    },
  );
};

// ─── Server-side push helper ──────────────────────────────────

export const pushNotification = (
  io: Server,
  userId: string,
  notification: {
    type: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  },
): void => {
  io.to(`user:${userId}`).emit('notification:new', {
    ...notification,
    createdAt: new Date().toISOString(),
  });
};
