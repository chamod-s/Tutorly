import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';

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

  async updateVideo(
    videoId: string,
    teacherUserId: string,
    data: {
      title?: string;
      description?: string;
      courseId?: string | null;
      status?: string;
    }
  ) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundError('Video not found');
    if (video.teacherId !== teacherUserId) throw new ForbiddenError('You do not own this video');

    return prisma.video.update({
      where: { id: videoId },
      data: {
        title: data.title,
        description: data.description,
        courseId: data.courseId === '' ? null : data.courseId,
        status: data.status,
      },
    });
  }

  async deleteVideo(videoId: string, teacherUserId: string) {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundError('Video not found');
    if (video.teacherId !== teacherUserId) throw new ForbiddenError('You do not own this video');

    return prisma.video.delete({ where: { id: videoId } });
  }
}

export const videoService = new VideoService();
