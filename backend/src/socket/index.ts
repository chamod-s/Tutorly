import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../config/logger';
import { registerChatHandlers } from './chatHandler';
import { registerNotificationHandlers } from './notificationHandler';
import prisma from '../config/database';

// ─── Socket.IO initializer ────────────────────────────────────

let ioInstance: Server | null = null;

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized yet');
  }
  return ioInstance;
};

export const initSocketIO = (io: Server): void => {
  ioInstance = io;
  // ── JWT auth middleware for Socket.IO ──────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        (socket.handshake.headers.authorization?.split(' ')[1]);

      if (!token) {
        // Allow unauthenticated connections with limited access
        socket.data = { userId: null, role: 'GUEST' };
        return next();
      }

      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user?.isActive) {
        return next(new Error('Unauthorized'));
      }

      socket.data = { userId: user.id, role: user.role };
      next();
    } catch {
      // Allow but mark as unauthenticated
      socket.data = { userId: null, role: 'GUEST' };
      next();
    }
  });

  // ── Connection handler ─────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data as { userId: string | null; role: string };

    logger.debug('Socket connected', {
      socketId: socket.id,
      userId,
      role,
    });

    // Auto-join personal room if authenticated
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Register feature-specific handlers
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { socketId: socket.id, userId, reason });
    });

    // ── Ping/Pong heartbeat ────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  logger.info('✅  Socket.IO initialized');
};
