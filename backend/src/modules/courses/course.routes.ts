import { Router } from 'express';
import { CourseController } from './course.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireTeacher } from '../../middleware/roleGuard';

const router = Router();

// ─── Public (optional auth for enrollment status) ─────────────
router.get('/',     optionalAuthenticate, CourseController.list);
router.get('/:id',  optionalAuthenticate, CourseController.getById);

// ─── Teacher ──────────────────────────────────────────────────
router.get('/my/courses',           authenticate, requireTeacher, CourseController.getMyCourses);
router.post('/',                    authenticate, requireTeacher, CourseController.create);
router.put('/:id',                  authenticate, requireTeacher, CourseController.update);
router.patch('/:id/publish',        authenticate, requireTeacher, CourseController.togglePublish);

// ─── Teacher or Admin ─────────────────────────────────────────
router.delete('/:id',               authenticate, CourseController.delete);

export default router;
