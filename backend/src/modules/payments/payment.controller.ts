import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { paymentService } from './payment.service';
import { UnauthorizedError } from '../../middleware/errorHandler';
import type { PayhereWebhookPayload } from '../../types';

export class PaymentController {
  static initiate = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await paymentService.initiatePayment(req.user.id, req.body.courseId);
    sendCreated(res, result, 'Payment initiated');
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
