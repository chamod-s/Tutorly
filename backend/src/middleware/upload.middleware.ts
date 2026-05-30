import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { BadRequestError } from '../middleware/errorHandler';

// ─── Ensure upload directories exist ─────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const PROFILE_DIR = path.join(UPLOADS_DIR, 'profiles');
const DOCS_DIR    = path.join(UPLOADS_DIR, 'documents');

[UPLOADS_DIR, PROFILE_DIR, DOCS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Storage engine ───────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, PROFILE_DIR);
    } else {
      cb(null, DOCS_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ─── File type filter ─────────────────────────────────────────

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_DOC_TYPES   = ['application/pdf', 'image/jpeg', 'image/png'];

  if (file.fieldname === 'profileImage') {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Profile image must be JPEG, PNG, or WebP') as unknown as null, false);
    }
  } else if (file.fieldname === 'documents') {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Documents must be PDF, JPEG, or PNG') as unknown as null, false);
    }
  } else {
    cb(null, true);
  }
};

// ─── Multer upload instance ───────────────────────────────────

export const uploadTeacherFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'documents',    maxCount: 5 },
]);

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
}).single('profileImage');

// ─── Helper: build public URLs for stored files ───────────────

export const buildFileUrl = (req: Request, filePath: string): string => {
  const relative = path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/uploads/${relative}`;
};
