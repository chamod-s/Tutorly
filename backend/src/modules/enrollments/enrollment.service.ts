import prisma from '../../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

export class EnrollmentService {
  // ── Enroll student in a course ─────────────────────────────

  async enroll(studentId: string, courseId: string, paymentId?: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    if (!course.isPublished) throw new ForbiddenError('Course is not available');

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (existing?.status === 'ACTIVE') {
      throw new ConflictError('You are already enrolled in this course');
    }

    let expiresAt: Date | undefined;
    if (course.type === 'SUBSCRIPTION') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expiresAt = d;
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      // Upsert enrollment
      const enroll = await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: {
          studentId,
          courseId,
          status: 'ACTIVE',
          paymentId,
          expiresAt,
        },
        update: {
          status: 'ACTIVE',
          paymentId,
          expiresAt,
        },
      });

      // Update teacher student count
      await tx.teacherProfile.update({
        where: { id: course.teacherId },
        data: { totalStudents: { increment: 1 } },
      });

      return enroll;
    });

    // Create enrollment chat room if not exists
    await prisma.chatRoom.upsert({
      where: { courseId },
      create: { courseId },
      update: {},
    });

    return enrollment;
  }

  // ── Get enrollments for a student ─────────────────────────

  async getStudentEnrollments(studentId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            include: {
              teacher: {
                include: {
                  user: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
              _count: { select: { lessons: true } },
            },
          },
        },
      }),
      prisma.enrollment.count({ where: { studentId } }),
    ]);

    return { enrollments, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get enrollments for a course (teacher view) ───────────

  async getCourseEnrollments(courseId: string, teacherUserId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this course');
    }

    return prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  // ── Cancel enrollment ──────────────────────────────────────

  async cancelEnrollment(studentId: string, courseId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    if (!enrollment) throw new NotFoundError('Enrollment not found');
    if (enrollment.status !== 'ACTIVE') throw new ForbiddenError('Enrollment is not active');

    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { status: 'CANCELLED' },
    });
  }

  // ── Check if enrolled ──────────────────────────────────────

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    return enrollment?.status === 'ACTIVE';
  }
}

export const enrollmentService = new EnrollmentService();
