import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin, requireTeacher } from '../../middleware/roleGuard';
import { uploadTeacherFiles } from '../../middleware/upload.middleware';

const router = Router();

// ─── Public ───────────────────────────────────────────────────
router.get('/',        TeacherController.listTeachers);
router.get('/:userId', TeacherController.getTeacher);

// ─── Teacher self-service ─────────────────────────────────────
// POST /teachers/apply — submit application with file uploads
router.post('/apply',      authenticate, requireTeacher, uploadTeacherFiles, TeacherController.submitApplication);
router.put('/me',          authenticate, requireTeacher, uploadTeacherFiles, TeacherController.updateProfile);
router.get('/me/earnings', authenticate, requireTeacher, TeacherController.getEarnings);

// ─── Admin approval workflow ──────────────────────────────────
router.get('/admin/pending',              authenticate, requireAdmin, TeacherController.listPendingApplications);
router.post('/admin/:userId/approve',     authenticate, requireAdmin, TeacherController.approveTeacher);
router.post('/admin/:userId/reject',      authenticate, requireAdmin, TeacherController.rejectTeacher);

export default router;
