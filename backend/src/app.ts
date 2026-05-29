import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { env } from './config/env';
import { morganStream } from './config/logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ─── Route imports ────────────────────────────────────────────
import authRoutes         from './modules/auth/auth.routes';
import userRoutes         from './modules/users/user.routes';
import teacherRoutes      from './modules/teachers/teacher.routes';
import courseRoutes       from './modules/courses/course.routes';
import lessonRoutes       from './modules/lessons/lesson.routes';
import enrollmentRoutes   from './modules/enrollments/enrollment.routes';
import paymentRoutes      from './modules/payments/payment.routes';
import streamRoutes       from './modules/streams/stream.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes    from './modules/analytics/analytics.routes';
import videoRoutes        from './modules/videos/video.routes';

// ─── App factory ──────────────────────────────────────────────

export const createApp = (): Application => {
  const app = express();

  // ── Trust proxy (needed if behind nginx / load balancer) ──
  app.set('trust proxy', 1);

  // ── Security headers ───────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
    }),
  );

  // ── CORS ───────────────────────────────────────────────────
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., Electron app / Postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Compression ────────────────────────────────────────────
  app.use(compression());

  // ── Body parsers ───────────────────────────────────────────
  // Note: /payments/webhook uses raw urlencoded — mounted before json parser
  app.use('/api/v1/payments/webhook', express.urlencoded({ extended: false }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── HTTP request logging ───────────────────────────────────
  app.use(
    morgan(
      env.NODE_ENV === 'production'
        ? 'combined'
        : ':method :url :status :response-time ms - :res[content-length]',
      { stream: morganStream },
    ),
  );

  // ── Global rate limit ──────────────────────────────────────
  app.use('/api', apiRateLimiter);

  // ── Static file serving (dev only — use CDN/nginx in production) ──
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ── Health check ───────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      app: env.APP_NAME,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API routes ─────────────────────────────────────────────
  const API = '/api/v1';

  app.use(`${API}/auth`,          authRoutes);
  app.use(`${API}/users`,         userRoutes);
  app.use(`${API}/teachers`,      teacherRoutes);
  app.use(`${API}/courses`,       courseRoutes);

  // Lessons nested under courses
  app.use(`${API}/courses/:courseId/lessons`, lessonRoutes);

  app.use(`${API}/enrollments`,   enrollmentRoutes);
  app.use(`${API}/payments`,      paymentRoutes);
  app.use(`${API}/streams`,       streamRoutes);
  app.use(`${API}/notifications`, notificationRoutes);
  app.use(`${API}/analytics`,     analyticsRoutes);
  app.use(`${API}/videos`,        videoRoutes);

  // ── 404 handler ────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last) ───────────────────
  app.use(errorHandler);

  return app;
};
