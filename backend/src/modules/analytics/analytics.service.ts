import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';

export class AnalyticsService {
  // ── Admin dashboard ────────────────────────────────────────

  async getAdminDashboard() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

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
      paymentsLastSixMonths,
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
      // Successful payments for 6 months graph
      prisma.payment.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    // Group by month
    const monthlyRevenueMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize the last 6 months with 0
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyRevenueMap[key] = 0;
    }

    paymentsLastSixMonths.forEach(payment => {
      const date = new Date(payment.createdAt);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (key in monthlyRevenueMap) {
        monthlyRevenueMap[key] += payment.amount;
      }
    });

    const monthlyRevenue = Object.entries(monthlyRevenueMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();

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
      monthlyRevenue,
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

  async getAdminReports() {
    const [
      _totalUsers,
      totalStudents,
      totalTeachers,
      enrollments,
      teachers,
      payments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.enrollment.findMany({
        orderBy: { enrolledAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true, price: true } },
        },
      }),
      prisma.teacherProfile.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          courses: {
            include: {
              enrollments: { select: { id: true } }
            }
          }
        }
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    // Process Revenue Report Data
    const successPayments = payments.filter(p => p.status === 'SUCCESS');
    const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0);

    // Group revenue by course
    const revenueByCourseMap: Record<string, { course: string; type: string; salesCount: number; revenue: number }> = {};
    successPayments.forEach(p => {
      const meta = p.metadata as any;
      const courseName = meta?.courseName || 'Direct Subscription / Purchase';
      if (!revenueByCourseMap[courseName]) {
        revenueByCourseMap[courseName] = {
          course: courseName,
          type: p.type,
          salesCount: 0,
          revenue: 0,
        };
      }
      revenueByCourseMap[courseName].salesCount += 1;
      revenueByCourseMap[courseName].revenue += p.amount;
    });
    const revenueByCourse = Object.values(revenueByCourseMap);

    // Group revenue by month
    const revenueByMonthMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    successPayments.forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      revenueByMonthMap[key] = (revenueByMonthMap[key] || 0) + p.amount;
    });
    const revenueByMonth = Object.entries(revenueByMonthMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();

    // Process Student Report Data
    const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE').length;
    const cancelledEnrollments = enrollments.filter(e => e.status === 'CANCELLED').length;
    
    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
      studentEmail: e.student.email,
      courseTitle: e.course.title,
      status: e.status,
      enrolledAt: e.enrolledAt,
    }));

    // Process Teacher Performance Data
    const formattedTeachers = teachers.map(t => {
      const totalTStudents = t.courses.reduce((sum, c) => sum + c.enrollments.length, 0);
      const earnings = successPayments
        .filter(p => (p.metadata as any)?.teacherId === t.userId)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        id: t.id,
        name: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
        rating: t.rating,
        experience: t.experience,
        coursesCount: t.courses.length,
        studentsCount: totalTStudents,
        earnings,
      };
    });

    // Process Payment Audit Data
    const formattedPayments = payments.map(p => ({
      id: p.id,
      studentName: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown Student',
      studentEmail: p.user?.email || 'N/A',
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      type: p.type,
      payhereOrderId: p.payhereOrderId || 'N/A',
      createdAt: p.createdAt,
    }));

    return {
      revenueReport: {
        totalRevenue,
        revenueByCourse,
        revenueByMonth,
      },
      studentReport: {
        totalStudents,
        totalEnrollments: enrollments.length,
        activeEnrollments,
        cancelledEnrollments,
        enrollments: formattedEnrollments,
      },
      teacherPerformance: {
        totalTeachers,
        teachers: formattedTeachers,
      },
      paymentAudit: {
        totalPayments: payments.length,
        payments: formattedPayments,
      },
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
