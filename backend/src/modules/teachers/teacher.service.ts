import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

export class TeacherService {
  // ── List all teachers (public) ─────────────────────────────

  async listTeachers(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { search, subject } = query as { search?: string; subject?: string };

    const where = {
      isVerified: true,
      ...(search && {
        OR: [
          { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: search, mode: 'insensitive' as const } } },
          { bio: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(subject && { subjects: { has: subject } }),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacherProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
          },
          _count: { select: { courses: true } },
        },
      }),
      prisma.teacherProfile.count({ where }),
    ]);

    return { teachers, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get teacher by user ID (public) ───────────────────────

  async getTeacherByUserId(userId: string) {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        courses: {
          where: { isPublished: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, title: true, thumbnail: true, price: true,
            type: true, rating: true, totalLessons: true, level: true,
          },
        },
      },
    });

    if (!teacher) throw new NotFoundError('Teacher profile not found');
    return teacher;
  }

  // ── Submit application (teacher) ───────────────────────────

  async submitApplication(
    userId: string,
    data: { bio: string; subjects: string[]; qualifications: string[]; experience: number },
    files: { profileImageUrl?: string; documentUrls: string[] },
  ) {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    return prisma.teacherProfile.update({
      where: { userId },
      data: {
        bio: data.bio,
        subjects: data.subjects,
        qualifications: data.qualifications,
        experience: data.experience,
        profileImage: files.profileImageUrl ?? profile.profileImage,
        documents: files.documentUrls.length > 0 ? files.documentUrls : profile.documents,
        approvalStatus: 'PENDING',
        submittedAt: new Date(),
        isVerified: false,
      },
    });
  }

  // ── List pending applications (admin) ─────────────────────

  async listPendingApplications() {
    return prisma.teacherProfile.findMany({
      where: { approvalStatus: 'PENDING', submittedAt: { not: null } },
      orderBy: { submittedAt: 'asc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
        },
      },
    });
  }

  // ── Approve teacher (admin) ────────────────────────────────

  async approveTeacher(teacherUserId: string) {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId: teacherUserId } });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    const [updatedProfile] = await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { userId: teacherUserId },
        data: { approvalStatus: 'APPROVED', isVerified: true, rejectionReason: null },
      }),
      prisma.notification.create({
        data: {
          userId: teacherUserId,
          type: 'SYSTEM',
          title: '🎉 Application Approved!',
          body: 'Congratulations! Your teacher application has been approved. You can now create and publish courses.',
          payload: {},
        },
      }),
    ]);

    return updatedProfile;
  }

  // ── Reject teacher (admin) ─────────────────────────────────

  async rejectTeacher(teacherUserId: string, reason: string) {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId: teacherUserId } });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    const [updatedProfile] = await prisma.$transaction([
      prisma.teacherProfile.update({
        where: { userId: teacherUserId },
        data: { approvalStatus: 'REJECTED', isVerified: false, rejectionReason: reason },
      }),
      prisma.notification.create({
        data: {
          userId: teacherUserId,
          type: 'SYSTEM',
          title: 'Application Update',
          body: `Your teacher application requires updates. Reason: ${reason}`,
          payload: {},
        },
      }),
    ]);

    return updatedProfile;
  }

  // ── Update own teacher profile ─────────────────────────────

  async updateProfile(
    userId: string,
    data: {
      bio?: string;
      subjects?: string[];
      qualifications?: string[];
      experience?: number;
      bankAccountName?: string;
      bankAccountNo?: string;
      bankName?: string;
      bankBranch?: string;
      socialLinks?: Record<string, string>;
    },
  ) {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    return prisma.teacherProfile.update({ where: { userId }, data });
  }

  // ── Get teacher earnings ───────────────────────────────────

  async getEarnings(userId: string) {
    const profile = await prisma.teacherProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS', metadata: { path: ['teacherId'], equals: userId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, amount: true, currency: true, type: true, createdAt: true },
    });

    const total = payments.reduce((acc, p) => acc + p.amount, 0);
    return { total, payments };
  }
}

export const teacherService = new TeacherService();
