import { Router } from 'express';
import { StreamController } from './stream.controller';
import { authenticate } from '../../middleware/auth';
import { requireTeacher } from '../../middleware/roleGuard';

const router = Router();

router.get('/',                    StreamController.list);
router.get('/my',                  authenticate, requireTeacher, StreamController.myStreams);
router.get('/:id',                 StreamController.getById);
router.get('/:id/credentials',     authenticate, requireTeacher, StreamController.credentials);
router.get('/:id/recording',       StreamController.recording);
router.post('/',                   authenticate, requireTeacher, StreamController.create);
router.patch('/:id/live',          authenticate, requireTeacher, StreamController.goLive);
router.patch('/:id/end',           authenticate, requireTeacher, StreamController.endStream);
router.patch('/:id/pause',         authenticate, requireTeacher, StreamController.togglePause);
router.patch('/:id',               authenticate, requireTeacher, StreamController.update);

export default router;
