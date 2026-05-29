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

  socket.on(
    'stream:pause_toggle',
    (data: { streamId: string; isPaused: boolean }) => {
      io.to(`stream:${data.streamId}`).emit('stream:paused', { isPaused: data.isPaused });
      logger.debug('Stream pause toggled', { streamId: data.streamId, isPaused: data.isPaused });
    },
  );

  socket.on(
    'chat:toggle_active',
    (data: { streamId: string; isActive: boolean }) => {
      io.to(`stream:${data.streamId}`).emit('chat:status_changed', { isActive: data.isActive });
      logger.debug('Chat status toggled', { streamId: data.streamId, isActive: data.isActive });
    },
  );

  socket.on(
    'chat:slow_mode',
    (data: { streamId: string; isSlowMode: boolean }) => {
      io.to(`stream:${data.streamId}`).emit('chat:slow_mode_changed', { isSlowMode: data.isSlowMode });
      logger.debug('Chat slow mode toggled', { streamId: data.streamId, isSlowMode: data.isSlowMode });
    },
  );

  // ── Livestream Chat Room Events ────────────────────────────
  socket.on('joinRoom', (data: { streamId: string }) => {
    socket.join(`stream_chat:${data.streamId}`);
    logger.debug('Socket joined livestream chat room', { socketId: socket.id, streamId: data.streamId });
  });

  socket.on('leaveRoom', (data: { streamId: string }) => {
    socket.leave(`stream_chat:${data.streamId}`);
    logger.debug('Socket left livestream chat room', { socketId: socket.id, streamId: data.streamId });
  });

  socket.on(
    'chat:send',
    (data: {
      streamId: string;
      id: string;
      userId: string;
      name: string;
      text: string;
      ts: number;
    }) => {
      const { streamId, ...msg } = data;
      // Broadcast messages to other users in the room
      socket.to(`stream_chat:${streamId}`).emit('chat:message', msg);
      logger.debug('Livestream chat message broadcasted', { streamId, text: msg.text });
    }
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
