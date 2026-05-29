import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';

export class LessonService {
  // ── Get lessons for a course ───────────────────────────────

  async getCourseLessons(courseId: string, userId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });
    if (!course) throw new NotFoundError('Course not found');

    const isTeacher = userId ? course.teacher.userId === userId : false;

    let isEnrolled = false;
    if (userId && !isTeacher) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId } },
      });
      isEnrolled = enrollment?.status === 'ACTIVE';
    }

    const where = isTeacher ? { courseId } : { courseId, isPublished: true };

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    // Mask video URLs for non-enrolled students
    return lessons.map((l) => ({
      ...l,
      videoUrl: isTeacher || isEnrolled || l.isFree ? l.videoUrl : null,
      hlsUrl: isTeacher || isEnrolled || l.isFree ? l.hlsUrl : null,
    }));
  }

  // ── Get single lesson (checks enrollment) ─────────────────

  async getLessonById(lessonId: string, userId?: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { select: { id: true, teacherId: true } } },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');

    if (!lesson.isFree && userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId: lesson.courseId } },
      });
      if (!enrollment || enrollment.status !== 'ACTIVE') {
        return { ...lesson, videoUrl: null, hlsUrl: null, isLocked: true };
      }
    }

    return { ...lesson, isLocked: false };
  }

  // ── Create lesson ──────────────────────────────────────────

  async createLesson(
    courseId: string,
    teacherUserId: string,
    data: {
      title: string;
      description?: string;
      videoUrl?: string;
      hlsUrl?: string;
      duration?: number;
      order?: number;
      isFree?: boolean;
    },
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this course');
    }

    // Auto-assign order if not provided
    if (!data.order) {
      const count = await prisma.lesson.count({ where: { courseId } });
      data.order = count + 1;
    }

    const lesson = await prisma.lesson.create({
      data: { ...data, courseId, duration: data.duration ?? 0 },
    });

    // Update course lesson count & total duration
    await prisma.course.update({
      where: { id: courseId },
      data: {
        totalLessons: { increment: 1 },
        totalDuration: { increment: data.duration ?? 0 },
      },
    });

    return lesson;
  }

  // ── Update lesson ──────────────────────────────────────────

  async updateLesson(
    lessonId: string,
    teacherUserId: string,
    data: Record<string, unknown>,
  ) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { teacher: true } } },
    });

    if (!lesson) throw new NotFoundError('Lesson not found');
    if (lesson.course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this lesson');
    }

    return prisma.lesson.update({ where: { id: lessonId }, data });
  }

  // ── Reorder lessons ────────────────────────────────────────

  async reorderLessons(
    courseId: string,
    teacherUserId: string,
    orderedIds: string[],
  ): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new NotFoundError('Course not found');
    if (course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this course');
    }

    const updates = orderedIds.map((id, index) =>
      prisma.lesson.update({ where: { id }, data: { order: index + 1 } }),
    );

    await prisma.$transaction(updates);
  }

  // ── Delete lesson ──────────────────────────────────────────

  async deleteLesson(lessonId: string, teacherUserId: string): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { teacher: true } } },
    });

    if (!lesson) throw new NotFoundError('Lesson not found');
    if (lesson.course.teacher.userId !== teacherUserId) {
      throw new ForbiddenError('You do not own this lesson');
    }

    await prisma.$transaction([
      prisma.lesson.delete({ where: { id: lessonId } }),
      prisma.course.update({
        where: { id: lesson.courseId },
        data: {
          totalLessons: { decrement: 1 },
          totalDuration: { decrement: lesson.duration },
        },
      }),
    ]);
  }
}

export const lessonService = new LessonService();
