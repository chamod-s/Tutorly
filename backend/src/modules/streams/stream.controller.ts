import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse';
import { streamService } from './stream.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class StreamController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await streamService.listStreams(req.query as Record<string, unknown>);
    sendSuccess(res, result.streams, 'Streams fetched', 200, result.meta);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const stream = await streamService.getStreamById(req.params.id);
    sendSuccess(res, stream, 'Stream fetched');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const stream = await streamService.createStream(req.user.id, req.body);
    sendCreated(res, stream, 'Stream scheduled');
  });

  static goLive = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await streamService.goLive(req.params.id, req.user.id);
    sendSuccess(res, result, 'Stream is now live');
  });

  static endStream = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await streamService.endStream(req.params.id, req.user.id);
    sendNoContent(res);
  });

  static myStreams = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const streams = await streamService.getTeacherStreams(req.user.id);
    sendSuccess(res, streams, 'Your streams fetched');
  });

  static credentials = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await streamService.getRtmpCredentials(req.params.id, req.user.id);
    sendSuccess(res, result, 'Stream credentials fetched');
  });

  static recording = asyncHandler(async (req: Request, res: Response) => {
    const result = await streamService.getRecording(req.params.id);
    sendSuccess(res, result, 'Recording info fetched');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const stream = await streamService.updateStream(req.params.id, req.user.id, req.body);
    sendSuccess(res, stream, 'Stream updated successfully');
  });

  static togglePause = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { isPaused } = req.body;
    const stream = await streamService.togglePause(req.params.id, req.user.id, isPaused);
    sendSuccess(res, stream, `Stream ${isPaused ? 'paused' : 'resumed'} successfully`);
  });
}
