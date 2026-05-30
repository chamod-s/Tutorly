import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { authService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  verifyAccountSchema,
} from './auth.dto';
import { UnauthorizedError } from '../../middleware/errorHandler';

// ─── Auth Controller ──────────────────────────────────────────

export class AuthController {
  /**
   * POST /auth/register
   * Register a new student or teacher account
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const dto = registerSchema.parse({ body: req.body }).body;
    const result = await authService.register(dto);

    sendSuccess(res, result, 'Registration successful');
  });

  /**
   * POST /auth/verify-account
   * Verify newly registered account using OTP
   */
  static verifyAccount = asyncHandler(async (req: Request, res: Response) => {
    const dto = verifyAccountSchema.parse({ body: req.body }).body;
    const result = await authService.verifyAccount(dto);

    sendSuccess(res, result, 'Account verified and logged in successfully');
  });

  /**
   * POST /auth/login
   * Authenticate user and return token pair
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const dto = loginSchema.parse({ body: req.body }).body;
    const result = await authService.login(dto);

    sendSuccess(res, result, 'Login successful');
  });

  /**
   * POST /auth/refresh
   * Rotate refresh token and return new token pair
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const dto = refreshTokenSchema.parse({ body: req.body }).body;
    const tokens = await authService.refresh(dto);

    sendSuccess(res, tokens, 'Token refreshed');
  });

  /**
   * POST /auth/logout
   * Revoke the provided refresh token
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    sendSuccess(res, null, 'Logged out successfully');
  });

  /**
   * POST /auth/logout-all
   * Revoke all refresh tokens for the authenticated user
   */
  static logoutAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await authService.logoutAll(req.user.id);
    sendSuccess(res, null, 'Logged out from all devices');
  });

  /**
   * PUT /auth/change-password
   * Change password for authenticated user
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const dto = changePasswordSchema.parse({ body: req.body }).body;
    await authService.changePassword(req.user.id, dto);
    sendSuccess(res, null, 'Password changed successfully');
  });

  /**
   * GET /auth/me
   * Return current authenticated user's profile
   */
  static me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, user, 'User profile fetched');
  });

  /**
   * POST /auth/forgot-password
   * Generate OTP and simulate sending email
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const dto = forgotPasswordSchema.parse({ body: req.body }).body;
    await authService.forgotPassword(dto);
    // Always return success to prevent email enumeration
    sendSuccess(res, null, 'If an account with that email exists, an OTP has been sent.');
  });

  /**
   * POST /auth/verify-otp
   * Verify if the provided OTP is valid
   */
  static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const dto = verifyOtpSchema.parse({ body: req.body }).body;
    await authService.verifyOtp(dto);
    sendSuccess(res, null, 'OTP verified successfully');
  });

  /**
   * POST /auth/reset-password
   * Reset password using a valid OTP
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const dto = resetPasswordSchema.parse({ body: req.body }).body;
    await authService.resetPassword(dto);
    sendSuccess(res, null, 'Password reset successfully');
  });
}
