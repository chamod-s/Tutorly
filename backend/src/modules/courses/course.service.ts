import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';
import { Role } from '@prisma/client';

export class CourseService {
  // ── List courses (public with filters) ────────────────────

  async listCourses(query: Record<string, unknown>, userId?: string) {
    const { page, limit, skip } = parsePagination(query);
    const { search, type, level, category } = query as Record<string, string | undefined>;

    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { has: search } },
        ],
      }),
      ...(type && { type: type as 'SUBSCRIPTION' | 'ONE_TIME' }),
      ...(level && { level: level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }),
      ...(category && { category }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
          _count: { select: { enrollments: true, lessons: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Attach enrollment status if user is authenticated
    let enrolledCourseIds = new Set<string>();
    if (userId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId, status: 'ACTIVE' },
        select: { courseId: true },
      });
      enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    }

    const enriched = courses.map((c) => ({
      ...c,
      isEnrolled: enrolledCourseIds.has(c.id),
    }));

    return { courses: enriched, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get single course ──────────────────────────────────────

  async getCourseById(id: string, userId?: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true, email: true } },
          },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true, title: true, description: true, duration: true,
            order: true, isFree: true, thumbnailUrl: true,
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    let isEnrolled = false;
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId: id } },
      });
      isEnrolled = enrollment?.status === 'ACTIVE';
    }

    // Mask non-free lesson video URLs if not enrolled
    const lessons = course.lessons.map((l) => ({
      ...l,
      videoUrl: isEnrolled || l.isFree ? l : undefined,
    }));

    return { ...course, lessons, isEnrolled };
  }

  // ── Get teacher's own courses ──────────────────────────────

  async getTeacherCourses(teacherUserId: string) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    return prisma.course.findMany({
      where: { teacherId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true, lessons: true } },
      },
    });
  }

  // ── Create course ──────────────────────────────────────────

  async createCourse(
    teacherUserId: string,
    data: {
      title: string;
      description: string;
      shortDesc?: string;
      price: number;
      monthlyPrice?: number;
      type: 'SUBSCRIPTION' | 'ONE_TIME';
      level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      language?: string;
      tags?: string[];
      category?: string;
      thumbnail?: string;
      isPublished?: boolean;
    },
  ) {
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
    });
    if (!profile) throw new NotFoundError('Teacher profile not found');

    const course = await prisma.course.create({
      data: {
        ...data,
        teacherId: profile.id,
        tags: data.tags ?? [],
      },
    });

    // Update teacher course count
    await prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { totalCourses: { increment: 1 } },
    });

    return course;
  }

  // ── Update course ──────────────────────────────────────────

  async updateCourse(courseId: string, teacherUserId: string, data: Record<string, unknown>) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this course');
    }

    return prisma.course.update({ where: { id: courseId }, data });
  }

  // ── Publish / unpublish ────────────────────────────────────

  async togglePublish(courseId: string, teacherUserId: string): Promise<{ isPublished: boolean }> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this course');
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: !course.isPublished },
      select: { isPublished: true },
    });

    return updated;
  }

  // ── Delete course ──────────────────────────────────────────

  async deleteCourse(courseId: string, userId: string, role: Role): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');

    if (role !== Role.ADMIN && course.teacher.userId !== userId) {
      throw new ForbiddenError('You do not own this course');
    }

    await prisma.course.delete({ where: { id: courseId } });
  }
}

export const courseService = new CourseService();
