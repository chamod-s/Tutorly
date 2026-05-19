import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { teacherService } from './teacher.service';
import { submitApplicationSchema, rejectTeacherSchema } from './teacher.dto';
import { UnauthorizedError } from '../../middleware/errorHandler';
import { buildFileUrl } from '../../middleware/upload.middleware';

// ─── Teacher Controller ───────────────────────────────────────

export class TeacherController {
  /**
   * GET /teachers — List verified teachers (public)
   */
  static listTeachers = asyncHandler(async (req: Request, res: Response) => {
    const result = await teacherService.listTeachers(req.query as Record<string, unknown>);
    sendSuccess(res, result, 'Teachers fetched successfully');
  });

  /**
   * GET /teachers/:userId — Get single teacher profile (public)
   */
  static getTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacher = await teacherService.getTeacherByUserId(req.params.userId);
    sendSuccess(res, teacher, 'Teacher profile fetched');
  });

  /**
   * POST /teachers/apply — Submit teacher application (TEACHER role)
   */
  static submitApplication = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();

    const dto = submitApplicationSchema.parse({ body: req.body }).body;

    const uploadedFiles = req.files as {
      profileImage?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    };

    const profileImageUrl = uploadedFiles?.profileImage?.[0]
      ? buildFileUrl(req, uploadedFiles.profileImage[0].path)
      : undefined;

    const documentUrls = (uploadedFiles?.documents ?? []).map((f) =>
      buildFileUrl(req, f.path),
    );

    const result = await teacherService.submitApplication(
      req.user.id,
      dto,
      { profileImageUrl, documentUrls },
    );

    sendSuccess(res, result, 'Application submitted successfully. Awaiting admin review.');
  });

  /**
   * GET /teachers/admin/pending — List pending applications (ADMIN)
   */
  static listPendingApplications = asyncHandler(async (_req: Request, res: Response) => {
    const result = await teacherService.listPendingApplications();
    sendSuccess(res, result, 'Pending applications fetched');
  });

  /**
   * POST /teachers/admin/:userId/approve — Approve teacher (ADMIN)
   */
  static approveTeacher = asyncHandler(async (req: Request, res: Response) => {
    const result = await teacherService.approveTeacher(req.params.userId);
    sendSuccess(res, result, 'Teacher approved successfully');
  });

  /**
   * POST /teachers/admin/:userId/reject — Reject teacher (ADMIN)
   */
  static rejectTeacher = asyncHandler(async (req: Request, res: Response) => {
    const dto = rejectTeacherSchema.parse({ body: req.body }).body;
    const result = await teacherService.rejectTeacher(req.params.userId, dto.reason);
    sendSuccess(res, result, 'Teacher application rejected');
  });

  /**
   * GET /teachers/me/earnings — Own earnings (TEACHER)
   */
  static getEarnings = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await teacherService.getEarnings(req.user.id);
    sendSuccess(res, result, 'Earnings fetched');
  });
}
