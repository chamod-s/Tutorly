import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { analyticsService } from './analytics.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class AnalyticsController {
  static adminDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getAdminDashboard();
    sendSuccess(res, data, 'Admin dashboard data fetched');
  });

  static adminReports = asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.getAdminReports();
    sendSuccess(res, data, 'Admin reports data fetched');
  });

  static teacherDashboard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const data = await analyticsService.getTeacherDashboard(req.user.id);
    sendSuccess(res, data, 'Teacher dashboard data fetched');
  });

  static studentDashboard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const data = await analyticsService.getStudentDashboard(req.user.id);
    sendSuccess(res, data, 'Student dashboard data fetched');
  });

  static trackEvent = asyncHandler(async (req: Request, res: Response) => {
    await analyticsService.trackEvent({
      userId: req.user?.id,
      eventType: req.body.eventType as string,
      metadata: req.body.metadata as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(204).send();
  });
}
