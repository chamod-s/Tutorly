import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from './env';

// ─── Custom log levels ────────────────────────────────────────

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

// ─── Formats ─────────────────────────────────────────────────

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) =>
      `${timestamp} [${level}]: ${message}${
        Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : ''
      }`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ─── Transports ───────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
    silent: env.NODE_ENV === 'test',
  }),
];

if (env.NODE_ENV !== 'test') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(env.LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: path.join(env.LOG_DIR, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  );
}

// ─── Logger instance ─────────────────────────────────────────

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  transports,
  exitOnError: false,
});

// ─── Morgan stream for HTTP access logs ──────────────────────

export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
