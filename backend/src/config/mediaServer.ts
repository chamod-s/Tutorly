import NodeMediaServer from 'node-media-server';
import path from 'path';
import fs from 'fs';
import prisma from './database';
import { logger } from './logger';

// ─── Directories ──────────────────────────────────────────────
const MEDIA_ROOT = path.join(process.cwd(), 'media');
const HLS_DIR    = path.join(MEDIA_ROOT, 'hls');
const REC_DIR    = path.join(MEDIA_ROOT, 'recordings');

[MEDIA_ROOT, HLS_DIR, REC_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── NMS Configuration ───────────────────────────────────────
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: MEDIA_ROOT,
    allow_origin: '*',
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH ?? 'ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=6:hls_flags=delete_segments+append_list]',
        hlsKeep: false,
        // Adaptive bitrate: 3 quality ladders
        vc: 'libx264',
        ac: 'aac',
        tasks: [
          { vc: 'libx264', vcParam: ['-b:v', '2500k', '-maxrate', '2500k', '-vf', 'scale=1280:720'], ac: 'aac', acParam: ['-b:a', '128k'], hls: true, hlsFlags: '[hls_time=2:hls_list_size=6]' },
          { vc: 'libx264', vcParam: ['-b:v', '800k',  '-maxrate', '800k',  '-vf', 'scale=854:480'],  ac: 'aac', acParam: ['-b:a', '96k'],  hls: true, hlsFlags: '[hls_time=2:hls_list_size=6]' },
          { vc: 'libx264', vcParam: ['-b:v', '400k',  '-maxrate', '400k',  '-vf', 'scale=640:360'],  ac: 'aac', acParam: ['-b:a', '64k'],  hls: true, hlsFlags: '[hls_time=2:hls_list_size=6]' },
        ],
      },
      {
        app: 'live',
        rec: true,
        recPath: REC_DIR,
        recFlags: '[movflags=faststart]',
      },
    ],
  },
};

// ─── NMS Instance ─────────────────────────────────────────────
let nms: NodeMediaServer;

export const createMediaServer = (): NodeMediaServer => {
  nms = new NodeMediaServer(nmsConfig as never);

  // ── Stream key validation ─────────────────────────────────
  nms.on('prePublish', async (id: string, StreamPath: string, _args: unknown) => {
    // StreamPath format: /live/<rtmpKey>
    const rtmpKey = StreamPath.split('/').pop();
    logger.info(`[NMS] Incoming stream: key=${rtmpKey}`);

    if (!rtmpKey) {
      logger.warn(`[NMS] Rejected: no stream key`);
      const session = (nms as unknown as { getSession: (id: string) => { reject: () => void } }).getSession(id);
      session?.reject();
      return;
    }

    // Validate key against DB
    const stream = await prisma.liveStream.findFirst({
      where: { rtmpKey, status: { in: ['SCHEDULED', 'LIVE'] } },
    });

    if (!stream) {
      logger.warn(`[NMS] Rejected stream key: ${rtmpKey}`);
      const session = (nms as unknown as { getSession: (id: string) => { reject: () => void } }).getSession(id);
      session?.reject();
      return;
    }

    // Mark stream as LIVE
    const hlsUrl = `http://localhost:8000/hls/${rtmpKey}/index.m3u8`;
    await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'LIVE', startedAt: new Date(), hlsUrl },
    });

    logger.info(`[NMS] Stream LIVE: ${stream.id} — ${hlsUrl}`);
  });

  // ── Stream ended ──────────────────────────────────────────
  nms.on('donePublish', async (_id: string, StreamPath: string, _args: unknown) => {
    const rtmpKey = StreamPath.split('/').pop();
    if (!rtmpKey) return;

    const stream = await prisma.liveStream.findFirst({ where: { rtmpKey } });
    if (!stream) return;

    const recFile = path.join(REC_DIR, `${rtmpKey}.mp4`);
    const recordingUrl = fs.existsSync(recFile)
      ? `http://localhost:8000/recordings/${rtmpKey}.mp4`
      : undefined;

    await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'ENDED', endedAt: new Date(), ...(recordingUrl && { recordingUrl }) },
    });

    // Deactivate chat
    await prisma.chatRoom.updateMany({ where: { streamId: stream.id }, data: { isActive: false } });

    logger.info(`[NMS] Stream ENDED: ${stream.id}${recordingUrl ? ' — Recording saved' : ''}`);
  });

  // ── Viewer events ─────────────────────────────────────────
  nms.on('prePlay', async (_id: string, StreamPath: string, _args: unknown) => {
    const rtmpKey = StreamPath.split('/').pop();
    if (!rtmpKey) return;
    const stream = await prisma.liveStream.findFirst({ where: { rtmpKey } });
    if (stream) {
      await prisma.liveStream.update({ where: { id: stream.id }, data: { viewerCount: { increment: 1 } } });
    }
  });

  nms.on('donePlay', async (_id: string, StreamPath: string, _args: unknown) => {
    const rtmpKey = StreamPath.split('/').pop();
    if (!rtmpKey) return;
    const stream = await prisma.liveStream.findFirst({ where: { rtmpKey } });
    if (stream && stream.viewerCount > 0) {
      await prisma.liveStream.update({ where: { id: stream.id }, data: { viewerCount: { increment: -1 } } });
    }
  });

  return nms;
};

export const startMediaServer = () => {
  const server = createMediaServer();
  server.run();
  logger.info('🎥  Node Media Server started', { rtmp: 'rtmp://localhost:1935/live', hls: 'http://localhost:8000/hls' });
};

export const getHlsUrl = (rtmpKey: string) => `http://localhost:8000/hls/${rtmpKey}/index.m3u8`;
export const getRtmpUrl = (rtmpKey: string) => `rtmp://localhost:1935/live/${rtmpKey}`;
