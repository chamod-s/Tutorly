import { Server, Socket } from 'socket.io';
import prisma from '../config/database';
import { logger } from '../config/logger';

// ─── Chat event handler ───────────────────────────────────────

export const registerChatHandlers = (io: Server, socket: Socket): void => {
  const userId = (socket.data as { userId: string }).userId;

  // ── Join a chat room ───────────────────────────────────────
  socket.on('chat:join', async (chatRoomId: string) => {
    try {
      const room = await prisma.chatRoom.findUnique({
        where: { id: chatRoomId },
        include: {
          course: {
            include: { enrollments: { where: { studentId: userId, status: 'ACTIVE' } } },
          },
        },
      });

      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      socket.join(chatRoomId);

      // Add participant record
      await prisma.chatRoomParticipant.upsert({
        where: { chatRoomId_userId: { chatRoomId, userId } },
        create: { chatRoomId, userId },
        update: {},
      });

      // Send last 50 messages on join
      const messages = await prisma.message.findMany({
        where: { chatRoomId, isDeleted: false },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
        },
      });

      socket.emit('chat:history', messages.reverse());
      socket.to(chatRoomId).emit('chat:user_joined', { userId });

      logger.debug('User joined chat room', { userId, chatRoomId });
    } catch (err) {
      logger.error('chat:join error', { err });
      socket.emit('error', { message: 'Failed to join chat room' });
    }
  });

  // ── Leave a chat room ──────────────────────────────────────
  socket.on('chat:leave', (chatRoomId: string) => {
    socket.leave(chatRoomId);
    socket.to(chatRoomId).emit('chat:user_left', { userId });
  });

  // ── Send a message ─────────────────────────────────────────
  socket.on(
    'chat:message',
    async (payload: {
      chatRoomId: string;
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE';
      fileUrl?: string;
    }) => {
      try {
        const { chatRoomId, content, type = 'TEXT', fileUrl } = payload;

        if (!content?.trim() && !fileUrl) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        const room = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Chat room is not active' });
          return;
        }

        const message = await prisma.message.create({
          data: {
            chatRoomId,
            senderId: userId,
            content: content.trim(),
            type,
            fileUrl,
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
            },
          },
        });

        io.to(chatRoomId).emit('chat:new_message', message);

        logger.debug('Message sent', { userId, chatRoomId, messageId: message.id });
      } catch (err) {
        logger.error('chat:message error', { err });
        socket.emit('error', { message: 'Failed to send message' });
      }
    },
  );

  // ── Delete a message ───────────────────────────────────────
  socket.on('chat:delete', async (messageId: string) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.senderId !== userId) {
        socket.emit('error', { message: 'Cannot delete this message' });
        return;
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, content: '[Message deleted]' },
      });

      io.to(message.chatRoomId).emit('chat:message_deleted', { messageId });
    } catch (err) {
      logger.error('chat:delete error', { err });
    }
  });

  // ── Typing indicators ──────────────────────────────────────
  socket.on('chat:typing_start', (chatRoomId: string) => {
    socket.to(chatRoomId).emit('chat:typing', { userId, isTyping: true });
  });

  socket.on('chat:typing_stop', (chatRoomId: string) => {
    socket.to(chatRoomId).emit('chat:typing', { userId, isTyping: false });
  });
};
