import { Router } from 'express';
import { LessonController } from './lesson.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireTeacher } from '../../middleware/roleGuard';

const router = Router({ mergeParams: true });

// ─── Course lessons (nested under /courses/:courseId/lessons) ─
router.get('/',    optionalAuthenticate, LessonController.getBycourse);
router.post('/',   authenticate, requireTeacher, LessonController.create);
router.patch('/reorder', authenticate, requireTeacher, LessonController.reorder);

// ─── Individual lesson ─────────────────────────────────────────
router.get('/:id',    optionalAuthenticate, LessonController.getById);
router.put('/:id',    authenticate, requireTeacher, LessonController.update);
router.delete('/:id', authenticate, requireTeacher, LessonController.delete);

export default router;
