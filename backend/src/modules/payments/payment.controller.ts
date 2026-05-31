import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { paymentService } from './payment.service';
import { UnauthorizedError } from '../../middleware/errorHandler';
import type { PayhereWebhookPayload } from '../../types';
import prisma from '../../config/database';

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
}
