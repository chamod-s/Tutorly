import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';
import { sendEmail } from '../../utils/email';
import { logger } from '../../config/logger';

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
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true },
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
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      include: { user: true },
    });
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

    // Send email notification asynchronously
    sendEmail({
      to: profile.user.email,
      subject: '🎉 Tutor Application Approved - TUTORLY',
      text: `Congratulations ${profile.user.firstName}! Your teacher application on TUTORLY has been approved. Log in to the desktop app to start creating courses and scheduling live classes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6d28d9; margin-bottom: 20px;">🎉 Congratulations, ${profile.user.firstName}!</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We are thrilled to inform you that your tutor application on <strong>TUTORLY</strong> has been approved!
          </p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Your profile is now verified. You have full access to the tutor panel where you can:
          </p>
          <ul style="font-size: 15px; color: #555; line-height: 1.6;">
            <li>Create and publish video courses</li>
            <li>Schedule and host live stream classes</li>
            <li>Interact with your students</li>
            <li>Manage and withdraw your earnings</li>
          </ul>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Simply open the desktop app and log in to start teaching.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">TUTORLY Platform. All rights reserved.</p>
        </div>
      `,
    }).catch(err => {
      logger.error('Email dispatch failed', err);
    });

    return updatedProfile;
  }

  // ── Reject teacher (admin) ─────────────────────────────────

  async rejectTeacher(teacherUserId: string, reason: string) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      include: { user: true },
    });
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

    // Send email notification asynchronously
    sendEmail({
      to: profile.user.email,
      subject: 'Tutor Application Update - Action Required',
      text: `Hi ${profile.user.firstName}, your tutor application requires updates. Feedback: "${reason}". Please log in, go to your profile, make changes, and resubmit.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11d48; margin-bottom: 20px;">Hi ${profile.user.firstName},</h2>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for applying to teach on <strong>TUTORLY</strong>. Our team has reviewed your application.
          </p>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            Currently, your application requires some changes before we can verify your profile.
          </p>
          <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; padding: 15px; border-radius: 8px; margin: 20px 0; color: #9f1239;">
            <strong>Feedback from Admin:</strong><br>
            "${reason}"
          </div>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Please log in to the desktop app, go to your <strong>Tutor Profile</strong> page, update the requested details, and resubmit for review.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">TUTORLY Platform. All rights reserved.</p>
        </div>
      `,
    }).catch(err => {
      logger.error('Email dispatch failed', err);
    });

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

    const updateData: any = { ...data };
    if (profile.approvalStatus === 'REJECTED') {
      updateData.approvalStatus = 'PENDING';
      updateData.submittedAt = new Date();
      updateData.isVerified = false;
      updateData.rejectionReason = null;
    }

    return prisma.teacherProfile.update({ where: { userId }, data: updateData });
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
