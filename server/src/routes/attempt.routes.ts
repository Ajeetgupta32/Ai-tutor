import { Router } from 'express';
import { submitQuizAttempt, getMyAttempts, getAttemptById, explainAttemptMistake } from '../controllers/attempt.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/submit', submitQuizAttempt);
router.get('/my-attempts', getMyAttempts);
router.get('/:id', getAttemptById);
router.post('/:id/explain-mistake/:questionId', explainAttemptMistake);

export default router;

