import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocketIO } from './socket';
import { startMediaServer } from './config/mediaServer';

// ─── Bootstrap ────────────────────────────────────────────────

const bootstrap = async (): Promise<void> => {
  // 1. Connect to PostgreSQL via Prisma
  await connectDatabase();

  // 2. Create Express app
  const app = createApp();

  // 3. Wrap Express with Node http.Server (required for Socket.IO)
  const httpServer = http.createServer(app);

  // 4. Attach Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 5. Register all Socket.IO handlers
  initSocketIO(io);

  // 6. Start Node Media Server (RTMP + HLS)
  startMediaServer();

  // 7. Start listening
  const port = env.PORT;
  httpServer.listen(port, () => {
    logger.info(`🚀  ${env.APP_NAME} server running`, {
      port,
      env: env.NODE_ENV,
      pid: process.pid,
    });
    logger.info(`📡  API base: http://localhost:${port}/api/v1`);
    logger.info(`🔌  WebSocket: ws://localhost:${port}`);
  });

  // 7. Graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`📴  Received ${signal} — gracefully shutting down…`);

    httpServer.close(async () => {
      logger.info('🔒  HTTP server closed');
      await disconnectDatabase();
      logger.info('✅  Shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // 8. Unhandled rejection / exception guards
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception — shutting down', { error: error.message, stack: error.stack });
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
