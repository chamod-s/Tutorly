import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateTokenPair, verifyRefreshToken, getRefreshTokenExpiry } from '../../utils/jwt';
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
  NotFoundError,
} from '../../middleware/errorHandler';
import type { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto, VerifyAccountDto } from './auth.dto';
import type { TokenPair, AuthenticatedUser } from '../../types';
import { logger } from '../../config/logger';

// ─── Auth Service ─────────────────────────────────────────────

export class AuthService {
  // ── Register ───────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        phone: dto.phone,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    // If registering as teacher — create profile with submitted details
    let teacherProfile = null;
    if (dto.role === 'TEACHER') {
      teacherProfile = await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          bio: dto.bio || null,
          subjects: dto.subjects || [],
          qualifications: dto.qualifications || [],
          experience: dto.experience || 0,
          approvalStatus: 'PENDING',
          submittedAt: new Date(),
          isVerified: false,
        },
        select: {
          id: true,
          bio: true,
          subjects: true,
          qualifications: true,
          experience: true,
          approvalStatus: true,
          isVerified: true,
          rejectionReason: true,
        }
      });
    }

    // If registering as student — create student profile
    let studentProfile = null;
    if (dto.role === 'STUDENT') {
      studentProfile = await prisma.studentProfile.create({
        data: { 
          userId: user.id,
          grade: dto.grade || null,
        },
        select: {
          id: true,
          grade: true,
        }
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    logger.info('New user registered and auto-logged in', { userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        teacherProfile: teacherProfile as any,
        studentProfile: studentProfile as any,
      } as any,
      tokens,
    };
  }

  // ── Verify Account Registration ────────────────────────────

  async verifyAccount(dto: VerifyAccountDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        otpCode: true,
        otpExpiresAt: true,
        isVerified: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');
    if (user.isVerified) throw new BadRequestError('Account is already verified');
    
    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestError('OTP is invalid or expired. Please request a new one.');
    }

    if (user.otpCode !== dto.code) {
      throw new BadRequestError('Invalid OTP code');
    }

    // Verify user and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    logger.info('User account verified and logged in', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      tokens,
    };
  }

  // ── Login ──────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        teacherProfile: {
          select: {
            id: true,
            bio: true,
            subjects: true,
            qualifications: true,
            experience: true,
            approvalStatus: true,
            isVerified: true,
            rejectionReason: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            grade: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = generateTokenPair(user.id, user.email, user.role);

    // Store refresh token (cleanup old ones > 5 stored)
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    // Purge expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
      },
    });

    logger.info('User logged in', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        teacherProfile: user.teacherProfile as any,
        studentProfile: user.studentProfile as any,
      } as any,
      tokens,
    };
  }

  // ── Refresh Access Token ───────────────────────────────────

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is expired or revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Rotate refresh token
    const tokens = generateTokenPair(user.id, user.email, user.role);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: dto.refreshToken } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
    ]);

    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  // ── Logout all devices ─────────────────────────────────────

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    logger.info('User logged out from all devices', { userId });
  }

  // ── Change password ────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new NotFoundError('User not found');

    const isValid = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestError('Current password is incorrect');

    const newHash = await hashPassword(dto.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all refresh tokens on password change
      prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    logger.info('User changed password', { userId });
  }

  // ── Get current user ───────────────────────────────────────

  async getMe(userId: string): Promise<AuthenticatedUser & { teacherProfile?: unknown; studentProfile?: unknown }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        teacherProfile: {
          select: {
            id: true,
            bio: true,
            subjects: true,
            rating: true,
            totalStudents: true,
            totalCourses: true,
            isVerified: true,
            approvalStatus: true,
            rejectionReason: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            grade: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  // ── Forgot Password (Generate OTP) ─────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      // Do not reveal if user exists or not for security, just return
      return;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    // In a real app, send this via email/SMS. For now, log it.
    logger.info(`[SIMULATED EMAIL] OTP for ${dto.email} is: ${otpCode}`);
  }

  // ── Verify OTP ─────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    if (user.otpExpiresAt < new Date()) {
      throw new BadRequestError('OTP has expired');
    }

    if (user.otpCode !== dto.code) {
      throw new BadRequestError('Invalid OTP code');
    }

    return true;
  }

  // ── Reset Password ─────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // First verify OTP again
    await this.verifyOtp({ email: dto.email, code: dto.code });

    const newHash = await hashPassword(dto.newPassword);

    await prisma.user.update({
      where: { email: dto.email },
      data: {
        passwordHash: newHash,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    logger.info('User reset password via OTP', { email: dto.email });
  }
}

export const authService = new AuthService();
