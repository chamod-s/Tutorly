import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse';
import { courseService } from './course.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class CourseController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.listCourses(
      req.query as Record<string, unknown>,
      req.user?.id,
    );
    sendSuccess(res, result.courses, 'Courses fetched', 200, result.meta);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getCourseById(req.params.id, req.user?.id);
    sendSuccess(res, course, 'Course fetched');
  });

  static getMyCourses = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const courses = await courseService.getTeacherCourses(req.user.id);
    sendSuccess(res, courses, 'Your courses fetched');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const course = await courseService.createCourse(req.user.id, req.body);
    sendCreated(res, course, 'Course created');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const course = await courseService.updateCourse(req.params.id, req.user.id, req.body);
    sendSuccess(res, course, 'Course updated');
  });

  static togglePublish = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await courseService.togglePublish(req.params.id, req.user.id);
    sendSuccess(res, result, `Course ${result.isPublished ? 'published' : 'unpublished'}`);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await courseService.deleteCourse(req.params.id, req.user.id, req.user.role);
    sendNoContent(res);
  });
}
