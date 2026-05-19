import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';

export class AnalyticsService {
  // ── Admin dashboard ────────────────────────────────────────

  async getAdminDashboard() {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalCourses,
      totalPayments,
      revenueResult,
      recentPayments,
      enrollmentsByDay,
      topCourses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      // Enrollments per day (last 30 days)
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE(enrolled_at)::text AS date, COUNT(*)::int AS count
        FROM enrollments
        WHERE enrolled_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(enrolled_at)
        ORDER BY date ASC
      `,
      // Top 5 courses by enrollments
      prisma.course.findMany({
        take: 5,
        where: { isPublished: true },
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          id: true, title: true, price: true,
          _count: { select: { enrollments: true } },
        },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        totalPayments,
        totalRevenue: revenueResult._sum.amount ?? 0,
      },
      recentPayments,
      enrollmentsByDay,
      topCourses,
    };
  }

  // ── Teacher dashboard ──────────────────────────────────────

  async getTeacherDashboard(teacherUserId: string) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    const [courses, totalStudents, revenueResult, recentEnrollments] =
      await Promise.all([
        prisma.course.findMany({
          where: { teacherId: profile.id },
          select: {
            id: true, title: true, price: true, isPublished: true,
            _count: { select: { enrollments: true, lessons: true } },
          },
        }),
        prisma.enrollment.count({
          where: {
            course: { teacherId: profile.id },
            status: 'ACTIVE',
          },
        }),
        prisma.payment.aggregate({
          where: {
            status: 'SUCCESS',
            metadata: { path: ['teacherId'], equals: teacherUserId },
          },
          _sum: { amount: true },
        }),
        prisma.enrollment.findMany({
          where: { course: { teacherId: profile.id } },
          take: 10,
          orderBy: { enrolledAt: 'desc' },
          include: {
            student: { select: { firstName: true, lastName: true, avatar: true } },
            course: { select: { title: true } },
          },
        }),
      ]);

    return {
      overview: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c: { isPublished: boolean }) => c.isPublished).length,
        totalStudents,
        totalRevenue: revenueResult._sum.amount ?? 0,
      },
      courses,
      recentEnrollments,
    };
  }

  // ── Student dashboard ──────────────────────────────────────

  async getStudentDashboard(studentId: string) {
    const [enrollments, totalSpent] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        include: {
          course: {
            select: {
              id: true, title: true, thumbnail: true,
              totalLessons: true, totalDuration: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.payment.aggregate({
        where: { userId: studentId, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      overview: {
        activeCourses: enrollments.length,
        totalSpent: totalSpent._sum.amount ?? 0,
      },
      enrollments,
    };
  }

  // ── Track analytics event ──────────────────────────────────

  async trackEvent(
    data: {
      userId?: string;
      eventType: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return prisma.analyticsEvent.create({
      data: {
        userId:    data.userId,
        eventType: data.eventType,
        // Prisma v5: Use `as any` to bypass strict IDE inference issues on overloaded methods
        metadata:  data.metadata as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
