import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse';
import { userService } from './user.service';
import { UnauthorizedError } from '../../middleware/errorHandler';

export class UserController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.listUsers(req.query as Record<string, unknown>);
    sendSuccess(res, result.users, 'Users fetched', 200, result.meta);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, user, 'User fetched');
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await userService.updateProfile(req.user.id, req.body);
    sendSuccess(res, user, 'Profile updated');
  });

  static toggleActive = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const result = await userService.toggleActive(req.user.id, req.params.id);
    sendSuccess(res, result, `User ${result.isActive ? 'activated' : 'deactivated'}`);
  });

  static adminCreate = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.adminCreateUser(req.body);
    sendCreated(res, user, 'User created');
  });

  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await userService.deleteUser(req.user.id, req.params.id);
    sendNoContent(res);
  });
}
