import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse';
import { enrollmentService } from './enrollment.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class EnrollmentController {
  static enroll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const enrollment = await enrollmentService.enroll(req.user.id, req.body.courseId);
    sendCreated(res, enrollment, 'Enrolled successfully');
  });

  static myEnrollments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await enrollmentService.getStudentEnrollments(
      req.user.id,
      req.query as Record<string, unknown>,
    );
    sendSuccess(res, result.enrollments, 'Enrollments fetched', 200, result.meta);
  });

  static courseStudents = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const list = await enrollmentService.getCourseEnrollments(req.params.courseId, req.user.id);
    sendSuccess(res, list, 'Students fetched');
  });

  static teacherStudents = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const list = await enrollmentService.getTeacherStudents(req.user.id);
    sendSuccess(res, list, 'Teacher students fetched');
  });

  static cancel = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await enrollmentService.cancelEnrollment(req.user.id, req.params.courseId);
    sendNoContent(res);
  });

  static checkEnrollment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const enrolled = await enrollmentService.isEnrolled(req.user.id, req.params.courseId);
    sendSuccess(res, { enrolled }, 'Enrollment status checked');
  });
}
