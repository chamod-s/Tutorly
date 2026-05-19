import prisma from '../../config/database';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import crypto from 'crypto';
import type { PayhereWebhookPayload } from '../../types';
import { enrollmentService } from '../enrollments/enrollment.service';
import { notificationService } from '../notifications/notification.service';
import { logger } from '../../config/logger';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

// ─── PayHere helpers ──────────────────────────────────────────

const generatePayhereHash = (
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string,
): string => {
  const secretHash = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashStr = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
  return crypto.createHash('md5').update(hashStr).digest('hex').toUpperCase();
};

const verifyPayhereWebhookHash = (payload: PayhereWebhookPayload): boolean => {
  if (!env.PAYHERE_MERCHANT_ID || !env.PAYHERE_MERCHANT_SECRET) return false;

  const secretHash = crypto
    .createHash('md5')
    .update(env.PAYHERE_MERCHANT_SECRET)
    .digest('hex')
    .toUpperCase();

  const localSig = crypto
    .createHash('md5')
    .update(
      `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${secretHash}`,
    )
    .digest('hex')
    .toUpperCase();

  return localSig === payload.md5sig;
};

// ─── Payment Service ──────────────────────────────────────────

export class PaymentService {
  // ── Initiate payment ───────────────────────────────────────

  async initiatePayment(
    userId: string,
    courseId: string,
  ): Promise<{ checkoutUrl: string; orderId: string; params: Record<string, string> }> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: { include: { user: true } } },
    });
    if (!course) throw new NotFoundError('Course not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: course.price,
        currency: 'LKR',
        type: course.type === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'ENROLLMENT',
        status: 'PENDING',
        metadata: {
          courseId,
          teacherId: course.teacher.userId,
          courseName: course.title,
        },           // Json? — Prisma v5 accepts plain objects directly
      },
    });

    const amount = course.price.toFixed(2);
    const currency = 'LKR';
    const merchantId = env.PAYHERE_MERCHANT_ID ?? '';
    const hash = generatePayhereHash(merchantId, payment.id, amount, currency, env.PAYHERE_MERCHANT_SECRET ?? '');

    const params: Record<string, string> = {
      merchant_id: merchantId,
      return_url: `${env.CLIENT_URL}/payment/success`,
      cancel_url: `${env.CLIENT_URL}/payment/cancel`,
      notify_url: env.PAYHERE_NOTIFY_URL ?? '',
      order_id: payment.id,
      items: course.title,
      currency,
      amount,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      address: 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
    };

    const baseUrl =
      env.PAYHERE_MODE === 'sandbox'
        ? (process.env['PAYHERE_SANDBOX_URL'] ?? 'https://sandbox.payhere.lk/pay/checkout')
        : (process.env['PAYHERE_LIVE_URL'] ?? 'https://www.payhere.lk/pay/checkout');

    return {
      checkoutUrl: baseUrl ?? 'https://sandbox.payhere.lk/pay/checkout',
      orderId: payment.id,
      params,
    };
  }

  // ── Handle PayHere webhook ─────────────────────────────────

  async handleWebhook(payload: PayhereWebhookPayload): Promise<void> {
    logger.info('PayHere webhook received', { orderId: payload.order_id, status: payload.status_code });

    const isValid = verifyPayhereWebhookHash(payload);
    if (!isValid) {
      logger.warn('PayHere webhook signature invalid', { orderId: payload.order_id });
      throw new BadRequestError('Invalid webhook signature');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: payload.order_id },
    });

    if (!payment) {
      logger.warn('Payment not found for webhook', { orderId: payload.order_id });
      return;
    }

    const statusCode = parseInt(payload.status_code, 10);

    // Status codes: 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargeback
    const statusMap: Record<number, 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK'> = {
      2: 'SUCCESS',
      0: 'PENDING',
      [-1]: 'FAILED',
      [-2]: 'FAILED',
      [-3]: 'CHARGEBACK',
    };

    const newStatus = statusMap[statusCode] ?? 'FAILED';

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        payhereRef: payload.payment_id,
        payhereOrderId: payload.order_id,
      },
    });

    // If payment succeeded — enroll student
    if (newStatus === 'SUCCESS') {
      const meta = payment.metadata as Record<string, string> | null;
      if (meta?.courseId && payment.userId) {
        await enrollmentService.enroll(payment.userId, meta.courseId, payment.id);

        await notificationService.create({
          userId: payment.userId,
          type: 'PAYMENT',
          title: 'Payment Successful',
          body: `Your payment for "${meta.courseName}" was successful. You are now enrolled!`,
          payload: { courseId: meta.courseId, paymentId: payment.id },
        });

        logger.info('Enrollment created after payment', {
          userId: payment.userId,
          courseId: meta.courseId,
        });
      }
    }
  }

  // ── List payments (admin) ──────────────────────────────────

  async listPayments(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.payment.count(),
    ]);

    return { payments, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get user payment history ───────────────────────────────

  async getUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Refund payment (admin) ────────────────────────────────

  async refundPayment(paymentId: string): Promise<{ id: string; status: string }> {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'SUCCESS') throw new BadRequestError('Only successful payments can be refunded');

    // NOTE: PayHere does not support automated refunds via API.
    // Mark as REFUNDED in DB; actual refund must be processed via PayHere merchant portal.
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
      select: { id: true, status: true },
    });

    // Cancel enrollment if present
    const meta = payment.metadata as Record<string, string> | null;
    if (meta?.courseId && payment.userId) {
      await prisma.enrollment.updateMany({
        where: { studentId: payment.userId, courseId: meta.courseId },
        data: { status: 'CANCELLED' },
      });
      await notificationService.create({
        userId: payment.userId,
        type: 'PAYMENT',
        title: 'Refund Processed',
        body: `Your refund for "${meta.courseName ?? 'course'}" has been processed. Access has been removed.`,
        payload: { paymentId },
      });
    }

    logger.info('Payment refunded', { paymentId, userId: payment.userId });
    return updated;
  }
}

export const paymentService = new PaymentService();
