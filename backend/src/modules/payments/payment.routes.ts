import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleGuard';
import { webhookRateLimiter } from '../../middleware/rateLimiter';
import express from 'express';

const router = Router();

// ─── PayHere webhook (no auth — server-to-server) ─────────────
router.post(
  '/webhook',
  webhookRateLimiter,
  express.urlencoded({ extended: false }), // PayHere sends form-encoded
  PaymentController.webhook,
);

// ─── Student ──────────────────────────────────────────────────
router.post('/initiate', authenticate, PaymentController.initiate);
router.post('/simulate-webhook', authenticate, PaymentController.simulateWebhook);
router.get('/my',        authenticate, PaymentController.myPayments);
router.get('/:id/status', authenticate, PaymentController.getStatus);

// ─── Admin ────────────────────────────────────────────────────
router.get('/',              authenticate, requireAdmin, PaymentController.listAll);
router.post('/:id/refund',   authenticate, requireAdmin, PaymentController.refund);

export default router;
