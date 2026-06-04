import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { paymentService } from './payment.service';
import { UnauthorizedError, BadRequestError } from '../../middleware/errorHandler';
import type { PayhereWebhookPayload } from '../../types';
import prisma from '../../config/database';
import { env } from '../../config/env';
import crypto from 'crypto';

export class PaymentController {
  static initiate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await paymentService.initiatePayment(req.user.id, req.body.courseId);
    sendCreated(res, result, 'Payment initiated');
  });

  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    if (payment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Unauthorized');
    }
    sendSuccess(res, { status: payment.status }, 'Payment status fetched');
  });

  /**
   * POST /payments/webhook
   * PayHere server-to-server notification — no auth middleware
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    await paymentService.handleWebhook(req.body as PayhereWebhookPayload);
    // PayHere expects a 200 with no body
    res.status(200).send('OK');
  });

  static myPayments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const payments = await paymentService.getUserPayments(req.user.id);
    sendSuccess(res, payments, 'Payment history fetched');
  });

  static listAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.listPayments(req.query as Record<string, unknown>);
    sendSuccess(res, result.payments, 'Payments fetched', 200, result.meta);
  });

  static refund = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.refundPayment(req.params.id);
    sendSuccess(res, result, 'Payment refunded successfully');
  });

  static simulateWebhook = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { orderId, status } = req.body;
    if (!orderId) throw new BadRequestError('orderId is required');

    const payment = await prisma.payment.findUnique({
      where: { id: orderId },
    });
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    const merchantId = env.PAYHERE_MERCHANT_ID ?? 'your_payhere_merchant_id';
    const merchantSecret = env.PAYHERE_MERCHANT_SECRET ?? 'your_payhere_merchant_secret';

    const statusCode = status === 'SUCCESS' ? '2' : '-1';
    const amount = payment.amount.toFixed(2);
    const currency = payment.currency;

    const secretHash = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const md5sig = crypto
      .createHash('md5')
      .update(
        `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`,
      )
      .digest('hex')
      .toUpperCase();

    const payload: PayhereWebhookPayload = {
      merchant_id: merchantId,
      order_id: orderId,
      payment_id: `payhere_sim_${crypto.randomBytes(4).toString('hex')}`,
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig,
      status_message: status === 'SUCCESS' ? 'Simulated success' : 'Simulated failure',
    };

    await paymentService.handleWebhook(payload);
    sendSuccess(res, null, `Webhook simulation successful for order ${orderId}`);
  });
}
