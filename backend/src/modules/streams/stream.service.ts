import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';
import { parsePagination, buildPaginationMeta } from '../../utils/apiResponse';

export class StreamService {
  // ── Create live stream ─────────────────────────────────────

  async createStream(
    teacherUserId: string,
    data: {
      title: string;
      description?: string;
      thumbnail?: string;
      isPublic?: boolean;
      price?: number;
      scheduledAt?: Date;
      courseId?: string;
    },
  ) {
    const stream = await prisma.liveStream.create({
      data: {
        ...data,
        teacherId: teacherUserId,
        rtmpKey: uuidv4(),
        status: 'SCHEDULED',
      },
    });

    // Create associated chat room
    await prisma.chatRoom.create({
      data: { streamId: stream.id },
    });

    return stream;
  }

  // ── List streams ───────────────────────────────────────────

  async listStreams(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query);
    const { status } = query as { status?: string };

    const where = status
      ? { status: status as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' }
      : { status: { in: ['SCHEDULED' as const, 'LIVE' as const] } };

    const [streams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          teacher: {
            select: {
              id: true, firstName: true, lastName: true, avatar: true,
            },
          },
        },
      }),
      prisma.liveStream.count({ where }),
    ]);

    return { streams, meta: buildPaginationMeta(total, page, limit) };
  }

  // ── Get stream by ID ───────────────────────────────────────

  async getStreamById(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        chatRoom: { select: { id: true } },
      },
    });

    if (!stream) throw new NotFoundError('Stream not found');
    return stream;
  }

  // ── Go live ────────────────────────────────────────────────

  async goLive(streamId: string, teacherUserId: string): Promise<{ hlsUrl: string }> {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundError('Stream not found');
    if (stream.teacherId !== teacherUserId) throw new ForbiddenError('You do not own this stream');

    // In a real system, the HLS URL comes from your media server
    // Here we construct it based on the rtmpKey
    const hlsUrl = `${process.env.HLS_BASE_URL ?? 'https://stream.tutorly.lk/hls'}/${stream.rtmpKey}/index.m3u8`;

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'LIVE',
        startedAt: new Date(),
        hlsUrl,
      },
      select: { hlsUrl: true },
    });

    logger.info('Stream went live', { streamId, teacherUserId });
    return { hlsUrl: updated.hlsUrl! };
  }

  // ── End stream ─────────────────────────────────────────────

  async endStream(streamId: string, teacherUserId: string): Promise<void> {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundError('Stream not found');
    if (stream.teacherId !== teacherUserId) throw new ForbiddenError('You do not own this stream');

    await prisma.liveStream.update({
      where: { id: streamId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    // Deactivate chat room
    await prisma.chatRoom.updateMany({
      where: { streamId },
      data: { isActive: false },
    });

    logger.info('Stream ended', { streamId });
  }

  // ── Update viewer count ────────────────────────────────────

  async updateViewerCount(streamId: string, delta: 1 | -1): Promise<void> {
    await prisma.liveStream.update({
      where: { id: streamId },
      data: { viewerCount: { increment: delta } },
    });
  }

  // ── Teacher's own streams ──────────────────────────────────

  async getTeacherStreams(teacherUserId: string) {
    return prisma.liveStream.findMany({
      where: { teacherId: teacherUserId },
      orderBy: { createdAt: 'desc' },
    });
  }
  // ── Get RTMP credentials for teacher ──────────────────────

  async getRtmpCredentials(streamId: string, teacherUserId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundError('Stream not found');
    if (stream.teacherId !== teacherUserId) throw new ForbiddenError('Not your stream');

    return {
      rtmpUrl: `rtmp://localhost:1935/live/${stream.rtmpKey}`,
      streamKey: stream.rtmpKey,
      hlsUrl: `http://localhost:8000/hls/${stream.rtmpKey}/index.m3u8`,
      obsSettings: {
        server: 'rtmp://localhost:1935/live',
        streamKey: stream.rtmpKey,
      },
    };
  }

  // ── Get recording URL ──────────────────────────────────────

  async getRecording(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      select: { id: true, title: true, recordingUrl: true, status: true },
    });
    if (!stream) throw new NotFoundError('Stream not found');
    return stream;
  }

  async updateStream(
    streamId: string,
    teacherUserId: string,
    data: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      chatEnabled?: boolean;
      slowMode?: boolean;
    }
  ) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundError('Stream not found');
    if (stream.teacherId !== teacherUserId) throw new ForbiddenError('Not your stream');

    return prisma.liveStream.update({
      where: { id: streamId },
      data,
    });
  }

  async togglePause(streamId: string, teacherUserId: string, isPaused: boolean) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new NotFoundError('Stream not found');
    if (stream.teacherId !== teacherUserId) throw new ForbiddenError('Not your stream');

    return prisma.liveStream.update({
      where: { id: streamId },
      data: { isPaused },
    });
  }
}

export const streamService = new StreamService();
