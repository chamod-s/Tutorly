import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse';
import { lessonService } from './lesson.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class LessonController {
  static getBycourse = asyncHandler(async (req: Request, res: Response) => {
    const lessons = await lessonService.getCourseLessons(req.params.courseId, req.user?.id);
    sendSuccess(res, lessons, 'Lessons fetched');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonService.getLessonById(req.params.id, req.user?.id);
    sendSuccess(res, lesson, 'Lesson fetched');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const lesson = await lessonService.createLesson(req.params.courseId, req.user.id, req.body);
    sendCreated(res, lesson, 'Lesson created');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const lesson = await lessonService.updateLesson(req.params.id, req.user.id, req.body);
    sendSuccess(res, lesson, 'Lesson updated');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { orderedIds } = req.body as { orderedIds: string[] };
    await lessonService.reorderLessons(req.params.courseId, req.user.id, orderedIds);
    sendSuccess(res, null, 'Lessons reordered');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await lessonService.deleteLesson(req.params.id, req.user.id);
    sendNoContent(res);
  });
}
