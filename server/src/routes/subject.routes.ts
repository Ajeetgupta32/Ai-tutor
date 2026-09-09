import { Router } from 'express';
import { getSubjects, getTopicsBySubject } from '../controllers/subject.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getSubjects);
router.get('/:subjectId/topics', getTopicsBySubject);

export default router;
