import prisma from '../../config/database';
import { hashPassword } from '../../utils/hash';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middleware/errorHandler';
import { Role } from '@prisma/client';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

export class UserService {
  // ── List users (admin) ─────────────────────────────────────

  async listUsers(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { search, role } = query as { search?: string; role?: Role };

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, role: true,
          firstName: true, lastName: true, avatar: true,
          isActive: true, isVerified: true,
          lastLoginAt: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get user by ID ─────────────────────────────────────────

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true,
        avatar: true, phone: true,
        isActive: true, isVerified: true,
        createdAt: true, lastLoginAt: true,
        teacherProfile: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  // ── Update profile ─────────────────────────────────────────

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string; avatar?: string; grade?: string },
  ) {
    const { grade, ...userData } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'STUDENT' && grade !== undefined) {
      await prisma.studentProfile.upsert({
        where: { userId },
        update: { grade },
        create: { userId, grade },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: userData,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        studentProfile: {
          select: {
            id: true,
            grade: true,
          },
        },
      },
    });
  }

  // ── Toggle user active (admin) ─────────────────────────────

  async toggleActive(adminId: string, targetId: string): Promise<{ isActive: boolean }> {
    if (adminId === targetId) throw new ForbiddenError('Cannot deactivate your own account');

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: !user.isActive },
      select: { isActive: true },
    });

    return updated;
  }

  // ── Admin create user ──────────────────────────────────────

  async adminCreateUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
  }

  // ── Delete user (admin) ────────────────────────────────────

  async deleteUser(adminId: string, targetId: string): Promise<void> {
    if (adminId === targetId) throw new ForbiddenError('Cannot delete your own account');
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundError('User not found');
    await prisma.user.delete({ where: { id: targetId } });
  }
}

export const userService = new UserService();
