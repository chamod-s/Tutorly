import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';
import { videoService } from './video.service';
import { UnauthorizedError, BadRequestError } from '../../middleware/errorHandler';
import { buildFileUrl } from '../../middleware/upload.middleware';

export class VideoController {
  static upload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    if (!req.file) throw new BadRequestError('No video file uploaded');

    const videoUrl = buildFileUrl(req, req.file.path);
    // Extrapolate title from original name (without extension)
    const originalName = req.file.originalname;
    const title = req.body.title || originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    
    // Estimate a random or simple duration for mock purposes
    const duration = req.body.duration || `${Math.floor(Math.random() * 45) + 15}m`;

    const { courseId, description, status } = req.body;

    const video = await videoService.createVideo(
      req.user.id,
      title,
      videoUrl,
      duration,
      courseId,
      description,
      status
    );
    sendCreated(res, video, 'Video uploaded successfully');
  });

  static myVideos = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const videos = await videoService.getTeacherVideos(req.user.id);
    sendSuccess(res, videos, 'Videos fetched successfully');
  });

  static listForStudent = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const videos = await videoService.getStudentVideos(req.user.id);
    sendSuccess(res, videos, 'Videos fetched successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { title, description, courseId, status } = req.body;
    const video = await videoService.updateVideo(req.params.id, req.user.id, {
      title,
      description,
      courseId,
      status
    });
    sendSuccess(res, video, 'Video updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await videoService.deleteVideo(req.params.id, req.user.id);
    sendSuccess(res, null, 'Video deleted successfully');
  });
}
