import { Router } from 'express';
import { VideoController } from './video.controller';
import { authenticate } from '../../middleware/auth';
import { requireTeacher } from '../../middleware/roleGuard';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads/videos exists
const VIDEOS_DIR = path.join(process.cwd(), 'uploads', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Allow up to 100MB for video uploads
  },
  fileFilter: (_req, file, cb) => {
    // Basic filter to ensure it's a video file
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!') as any, false);
    }
  }
});

router.post('/upload', authenticate, requireTeacher, upload.single('video'), VideoController.upload);
router.get('/my',      authenticate, requireTeacher, VideoController.myVideos);
router.get('/',        authenticate, VideoController.listForStudent);
router.patch('/:id',   authenticate, requireTeacher, VideoController.update);
router.delete('/:id',  authenticate, requireTeacher, VideoController.delete);

export default router;
