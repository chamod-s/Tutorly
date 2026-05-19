import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';
import { logger } from './logger';

// ─── Singleton Prisma Client ──────────────────────────────────

declare global {
  // Prevents multiple instances during hot-reload in development
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });
};

export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (isDevelopment) {
  global.__prisma = prisma;

  // Log all queries in development
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`Prisma Query [${e.duration}ms]: ${e.query}`);
  });
}

(prisma as any).$on('error', (e: { message: string }) => {
  logger.error(`Prisma Error: ${e.message}`);
});

// ─── Connect / Disconnect helpers ─────────────────────────────

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅  Database connected successfully');
  } catch (error) {
    logger.error('❌  Database connection failed', { error });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('📴  Database disconnected');
};

export default prisma;
