import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireAdmin, requireTeacher } from '../../middleware/roleGuard';

const router = Router();

router.get('/admin',   authenticate, requireAdmin,   AnalyticsController.adminDashboard);
router.get('/reports', authenticate, requireAdmin,   AnalyticsController.adminReports);
router.get('/teacher', authenticate, requireTeacher, AnalyticsController.teacherDashboard);
router.get('/student', authenticate,                 AnalyticsController.studentDashboard);
router.post('/event',  optionalAuthenticate,          AnalyticsController.trackEvent);

export default router;
