import { Router } from 'express';
import { EnrollmentController } from './enrollment.controller';
import { authenticate } from '../../middleware/auth';
import { requireTeacher } from '../../middleware/roleGuard';

const router = Router();

router.post('/',                                        authenticate, EnrollmentController.enroll);
router.get('/my',                                       authenticate, EnrollmentController.myEnrollments);
router.get('/check/:courseId',                          authenticate, EnrollmentController.checkEnrollment);
router.delete('/:courseId',                             authenticate, EnrollmentController.cancel);
router.get('/course/:courseId/students', authenticate, requireTeacher, EnrollmentController.courseStudents);
router.get('/teacher/students',          authenticate, requireTeacher, EnrollmentController.teacherStudents);

export default router;
