import prisma from '../../config/database';

export class VideoService {
  async createVideo(
    teacherUserId: string,
    title: string,
    videoUrl: string,
    duration?: string,
    courseId?: string,
    description?: string,
    status?: string
  ) {
    return prisma.video.create({
      data: {
        teacherId: teacherUserId,
        title,
        videoUrl,
        duration: duration || '0m',
        courseId: courseId || null,
        description: description || null,
        status: status || 'PUBLISHED',
      },
    });
  }

  async getTeacherVideos(teacherUserId: string) {
    return prisma.video.findMany({
      where: { teacherId: teacherUserId },
      include: {
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentVideos(studentUserId: string) {
    // Find courses where the student is actively enrolled
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentUserId,
        status: 'ACTIVE'
      },
      select: {
        courseId: true
      }
    });

    const enrolledCourseIds = enrollments.map(e => e.courseId);

    // Fetch videos that are published and either public (no courseId) or belong to enrolled courses
    return prisma.video.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { courseId: null },
          { courseId: { in: enrolledCourseIds } }
        ]
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const videoService = new VideoService();
